'use server';

import { promises as fs } from 'fs';
import * as path from 'path';

import { executeCodeSchema } from '../validations';

const PYTHON_TRACER_SOURCE = `
import sys
import json
import io
import traceback
import copy

# デバッグ用: 標準エラー出力のエンコーディングを強制
sys.stderr.reconfigure(encoding='utf-8')

def main():
    try:
        # 標準入力からコードを読み込む
        code = sys.stdin.read()
        
        if not code.strip():
            print("[]")
            return

        trace_log = []
        stdout_buffer = io.StringIO()

        def trace_lines(frame, event, arg):
            if event != 'line':
                return trace_lines
            
            filename = frame.f_code.co_filename
            if filename != '<string>':
                return trace_lines

            try:
                line_no = frame.f_lineno
                
                local_vars = {}
                for k, v in frame.f_locals.items():
                    try:
                        if isinstance(v, (int, float, str, bool, type(None))):
                             local_vars[k] = v
                        elif isinstance(v, (list, dict, set, tuple)):
                             # Use deepcopy to capture the current state of mutable objects
                             # This prevents future mutations (like sort) from affecting past trace steps
                             local_vars[k] = copy.deepcopy(v)
                        else:
                            local_vars[k] = str(v)
                    except:
                        local_vars[k] = "<unserializable>"

                current_stdout = stdout_buffer.getvalue()
                
                trace_log.append({
                    "line": line_no,
                    "variables": local_vars.copy(),
                    "stdout": current_stdout,
                    "event": "step"
                })
            except Exception as e:
                sys.stderr.write(f"[Python Tracer] Trace Logic Error: {e}\\n")

            return trace_lines

        original_stdout = sys.stdout
        sys.stdout = stdout_buffer
        
        last_vars = {}

        try:
            sys.settrace(trace_lines)
            compiled_code = compile(code, '<string>', 'exec')
            exec(compiled_code, {'__name__': '__main__'})
        except Exception:
            trace_log.append({
                "line": -1,
                "variables": {},
                "stdout": stdout_buffer.getvalue(),
                "error": traceback.format_exc(),
                "event": "error"
            })
        finally:
            sys.settrace(None)
            sys.stdout = original_stdout

        # --- 修正点: 実行完了後の最終状態を追加 ---
        # 最後のステップの変数を引き継ぐ（もしあれば）
        if trace_log and trace_log[-1].get("variables"):
            last_vars = trace_log[-1]["variables"]

        # 最終的な出力を取得
        final_stdout = stdout_buffer.getvalue()

        # 「実行完了」を表すステップを追加（行番号はハイライトなし=-1 または 最終行など）
        trace_log.append({
            "line": -1, # ハイライトを消すために-1
            "variables": last_vars,
            "stdout": final_stdout,
            "event": "finish"
        })
        # ------------------------------------------

        print(json.dumps(trace_log, default=str))

    except Exception as e:
        sys.stderr.write(f"[Python Tracer] System Error: {e}\\n")
        print("[]")

if __name__ == "__main__":
    main()
`;

/**
 * OpenAIのGPT-4oモデルに疑似言語コードの生成をリクエストするサーバーアクション
 * @param prompt ユーザーからの指示 (例: "1から10までの合計を計算する")
 * @returns 生成された疑似言語コードの文字列
 */
export async function generateTraceCodeFromAI(prompt: string): Promise<string> {
  const systemPrompt = `あなたは、本ツール専用の疑似言語を生成する専門家です。ユーザーの指示に基づき、トレース実行可能なコードのみを生成してください。

# 厳密な構文ルール
- 変数宣言: 「整数型: var1, arr[5]」「文字列型: str1」「配列型: arr1」の形式。
- 関数定義: 「○[型]: [関数名]([引数])」や「●[型]: [関数名]([引数])」の形式を許可します。
- 代入: 「変数 ← 値」 (例: x ← 10, arr[1] ← 5)
- 出力: 「出力する 変数」または「出力する "文字列リテラル"」
- 条件分岐: 「if (条件)」「elseif (条件)」「else」「endif」を使用。
- ループ: 「for (変数 を 開始値 から 終了値 まで 1 ずつ増やす)」「endfor」、「while (条件)」「endwhile」
- 戻り値: 「return [値]」
- その他: 「繰返し処理を終了する」

# 禁止事項 (最重要)
- **コメント禁止**: '//' や '/*' で始まるコメント行は絶対に追加しないでください。生成するコードにはコメントを一切含めないでください。
- **算術演算子**: \`+\`, \`-\`, \`*\`, \`/\` (整数除算の商) のみ使用可能です。
- **剰余演算子 \`%\` 禁止**: 剰余は \`x - (x / y) * y\` の形式で計算してください。 (注: (x / y) は商を求める整数除算です)
- **論理演算子 \`&&\`, \`||\` 禁止**: 複数の条件は \`and\` を使うか、if文をネストさせて表現してください。
- **複雑な関数禁止**: sqrt(), pow(), ceil() などの組み込み関数は使用しないでください。
- **その他**: 上記以外の構文や記法は使用しないでください。

# 値の扱い (重要)
- ユーザーの指示に具体的な数値や文字列が含まれている場合 (例: "15のFizzBuzz", "60と36の最大公約数"), それらの値はコード内で変数に直接代入 (ハードコーディング) してください。JSONからの入力を前提としないでください。

# 生成コードのお手本 (この形式に厳密に従ってください)

## 例1: (サンプル問題 [科目B] 問1)
### 指示: 変数x, y, zの値を入れ替え、yとzの値を出力する
### 生成コード:
整数型: x ← 1
整数型: y ← 2
整数型: z ← 3
x ← y
y ← z
z ← x
yとzの値をこの順にコンマ区切りで出力する

## 例2: (サンプル問題 [科目B] 問2)
### 指示: FizzBuzz判定
### 生成コード:
○文字列型: fizzBuzz(整数型: num)
　文字列型: result
　if (num が 3と5 で割り切れる)
　　result ← "3と5で割り切れる"
　elseif (num が 3 で割り切れる)
　　result ← "3で割り切れる"
　elseif (num が 5 で割り切れる)
　　result ← "5で割り切れる"
　else
　　result ← "3でも5でも割り切れない"
　endif
　return result

## 例3: (サンプル問題 [科目B] 問3)
### 指示: 累積和配列の作成
### 生成コード:
○整数型の配列: makeNewArray(整数型の配列: in)
　整数型の配列: out ← {}
　整数型: i, tail
　outの末尾に in[1] の値 を追加する
　for (i を 2 から inの要素数 まで 1 ずつ増やす)
　　tail ← out[outの要素数]
　　outの末尾に (tail + in[i]) の結果を追加する
endfor
　return out

## 例4: (サンプル問題 [科目B] 問4)
### 指示: 最大公約数 (ユークリッドの互除法)
### 生成コード:
○整数型: gcd(整数型: num1, 整数型: num2)
　整数型: x ← num1
　整数型: y ← num2
　while (x ≠ y)
　　if (x > y)
　　　x ← x - y
　　else
　　　y ← y - x
　　endif
endwhile
　return x

## 例5: (サンプル問題 [科目B] 問5)
### 指示: √x²+y² の計算 (pow関数使用)
### 生成コード:
○実数型: calc(実数型: x, 実数型: y)
return pow(pow(x, 2) + pow(y, 2), 0.5)

## 例6: (サンプル問題 [科目B] 問6)
### 指示: 8ビットのビット並びを逆順にする
### 生成コード:
○8ビット型: rev(8ビット型: byte)
  8ビット型: rbyte ← byte
  8ビット型: r ← 00000000
整数型: i
  for (i を 1 から 8 まで 1 ずつ増やす)
    r ← (r << 1) ∨ (rbyte ∧ 00000001)
    rbyte ← rbyte >> 1
endfor
  return r

## 例7: (サンプル問題 [科目B] 問7)
### 指示: 階乗を求める再帰関数
### 生成コード:
○整数型: factorial(整数型: n)
  if (n = 0)
    return 1
  endif
  return n * factorial(n - 1)

## 例8: (サンプル問題 [科目B] 問8)
### 指示: 優先度付きキューの操作
### 生成コード:
○prioSched()
  prioQueue: PrioQueue ← PrioQueue()
  prioQueue.enqueue("A", 1)
  prioQueue.enqueue("B", 2)
  prioQueue.enqueue("C", 2)
  prioQueue.enqueue("D", 3)
  prioQueue.dequeue()
  prioQueue.dequeue()
  prioQueue.enqueue("D", 3)
  prioQueue.enqueue("B", 2)
  prioQueue.dequeue()
  prioQueue.dequeue()
  prioQueue.enqueue("C", 2)
  prioQueue.enqueue("A", 1)
  while (prioQueue.size() が 0 と等しくない)
    prioQueue.dequeue() の戻り値を出力
  endwhile

## 例9: (サンプル問題 [科目B] 問9)
### 指示: 2分木の通りがけ順（再帰）
### 生成コード:
大域: 整数型配列の配列: tree ← {{2, 3}, {4, 5}, {6, 7}, {8, 9},
                            {10, 11}, {12, 13}, {14}, {}, {},
                            {}, {}, {}, {}}
○order(整数型: n)
  if (tree[n]の要素数 が 2 と等しい)
    order(tree[n][1])
    nを出力
    order(tree[n][2])
  elseif (tree[n]の要素数 が 1 と等しい)
    order(tree[n][1])
    nを出力
  else
    nを出力
endif

## 例10: (サンプル問題 [科目B] 問10)
### 指示: 単方向リストの要素削除
### 生成コード:
大域: ListElement: listHead
○delNode(整数型: pos)
  ListElement: prev
  整数型: i
  if (pos が 1 と等しい)
    listHead ← listHead.next
  else
    prev ← listHead
   for (i を 2 から pos - 1 まで 1 ずつ増やす)
     prev ← prev.next
endfor
   prev.next ← prev.next.next
  endif

## 例11: (サンプル問題 [科目B] 問11)
### 指示: ビンソート
### 生成コード:
○整数型の配列: binSort(整数型の配列: data)
  整数型: n ← dataの要素数
  整数型の配列: bins ← {n個の未定義の値}
  整数型: i
  for (i を 1 から n まで 1 ずつ増やす)
    bins[data[i]] ← data[i]
  endfor
  return bins

## 例12: (サンプル問題 [科目B] 問12)
### 指示: 配列の類似度計算
### 生成コード:
○実数型: simRatio(文字列型の配列: s1, 文字列型の配列: s2)
  整数型: i, cnt ← 0
  if (s1の要素数 ≠ s2の要素数)
    return -1
  endif
  for (i を 1 から s1の要素数 まで 1 ずつ増やす)
    if (s1[i] = s2[i])
      cnt ← cnt + 1
    endif
endfor
  return cnt ÷ s1の要素数

## 例13: (サンプル問題 [科目B] 問13)
### 指示: 2分探索（バグあり）
### 生成コード:
○整数型: search(整数型の配列: data, 整数型: target)
  整数型: low, high, middle
  low ← 1
  high ← dataの要素数
  while (low <= high)
    middle ← (low + high) ÷ 2 の商
    if (data[middle] < target)
      low ← middle
    elseif (data[middle] > target)
      high ← middle
    else
      return middle
    endif
endwhile
   return -1

## 例14: (サンプル問題 [科目B] 問14)
### 指示: 五数要約
### 生成コード:
○実数型: findRank(実数型の配列: sortedData, 実数型: p)
整数型: i
  i ← (sortedDataの要素数 - 1) × p の小数点以下を切り上げた値
  return sortedData[i + 1]
○実数型の配列: summarize(実数型の配列: sortedData)
 実数型の配列: rankData ← {}
 実数型の配列: p ← {0, 0.25, 0.5, 0.75, 1}
 整数型: i
 for (i を 1 から pの要素数 まで 1 ずつ増やす)
   rankDataの末尾に findRank(sortedData, p[i])の戻り値 を追加する
endfor
 return rankData

## 例15: (サンプル問題 [科目B] 問16)
### 指示: UTF-8エンコード
### 生成コード:
○整数型の配列: encode(整数型: codePoint)
 整数型の配列: utf8Bytes ← {224, 128, 128}
 整数型: cp ← codePoint
 整数型: i
 for (i を utf8Bytesの要素数 から 1 まで 1 ずつ減らす)
   utf8Bytes[i] ← utf8Bytes[i] + (cp ÷ 64 の余り)
   cp ← cp ÷ 64 の商
endfor
 return utf8Bytes

## 例16: (基本情報技術者試験 科目B 問21)
### 指示: 入場料計算
### 生成コード:
○整数型: fee(整数型: num)
  整数型: ret
  if (num が 3 以下)
    ret ← 100
  elseif (numが9以下)
    ret ← 300
  else
    ret ← 500
  endif
  return ret

## 例17: (基本情報技術者試験 科目B 問22)
### 指示: 配列の要素を逆順にする
### 生成コード:
整数型の配列: array ← {1, 2, 3, 4, 5}
整数型: right, left
整数型: tmp
for (left を 1 から (arrayの要素数 ÷ 2の商) まで 1 ずつ増やす)
  right ← arrayの要素数 - left + 1
  tmp ← array[right]
  array[right] ← array[left]
  array[left] ← tmp
 endfor

## 例18: (基本情報技術者試験 科目B 問23)
### 指示: 単方向リストの末尾に要素を追加
### 生成コード:
大域: ListElement: listHead ← 未定義の値
○append(文字列型: qVal)
  ListElement: prev, curr
  curr ← ListElement(qVal)
  if (listHead が 未定義)
    listHead ← curr
  else
    prev ← listHead
    while (prev.next が 未定義でない)
      prev ← prev.next
    endwhile
    prev.next ← curr
  endif

## 例19: (基本情報技術者試験 科目B 問24)
### 指示: 疎行列（スパースマトリックス）への変換
### 生成コード:
○整数型配列の配列: transformSparseMatrix(整数型の二次元配列: matrix)
  整数型: i, j
  整数型配列の配列: sparseMatrix
  sparseMatrix ← {{}, {}, {}}
  for (i を 1 から matrixの行数 まで 1 ずつ増やす)
    for (j を 1 から matrixの列数 まで 1 ずつ増やす)
      if (matrix[i, j] が 0 でない)
        sparseMatrix[1]の末尾に iの値 を追加する
        sparseMatrix[2]の末尾に jの値 を追加する
        sparseMatrix[3]の末尾に matrix[i, j]の値 を追加する
      endif
    endfor
  endfor
  return sparseMatrix

## 例20: (基本情報技術者試験 科目B 問25)
### 指示: 条件付き確率の計算
### 生成コード:
○実数型: prob(文字型: c1, 文字型: c2)
  文字列型: s1 ← c1の1文字だけから成る文字列
  文字列型: s2 ← c2の1文字だけから成る文字列
  if (words.freq(s1 + s2) が 0 より大きい)
    return words.freq(s1 + s2) ÷ (words.freq(s1) - words.freqE(s1))
  else
    return 0
  endif

## 例21: (令和5年 科目B 問1)
### 指示: 素数探索（試し割り法）
### 生成コード:
○整数型の配列: findPrimeNumbers(整数型: num)
  整数型の配列: pnList ← {}
  整数型: i, j
  論理型: divideFlag
  for (i を 2 から num まで 1 ずつ増やす)
    divideFlag ← true
    for (j を 2 から iの正の平方根の整数部分 まで 1 ずつ増やす)
      if (i ÷ j の余り が 0 と等しい)
        divideFlag ← false
        繰返し処理を終了する
      endif
    endfor
    if (divideFlag が true と等しい)
      pnListの末尾に iの値を 追加する
    endif
  endfor
  return pnList

## 例22: (令和5年 科目B 問2)
### 指示: 手続きの呼び出し順トレース
### 生成コード:
○proc1()
  "A" を出力する
  proc3()
○proc2()
  proc3()
  "B" を出力する
  proc1()
○proc3()
  "C" を出力する

## 例23: (令和5年 科目B 問3)
### 指示: クイックソート
### 生成コード:
○sort(整数型: first, 整数型: last)
  整数型: pivot, i, j
  pivot ← data[(first + last) ÷ 2の商]
  i ← first
  j ← last
  while (true)
    while (data[i] < pivot)
      i ← i + 1
    endwhile
    while (pivot < data[j])
      j ← j - 1
    endwhile
    if (i ≧ j)
      繰返し処理を終了する
    endif
    data[i]とdata[j]の値を入れ替える
    i ← i + 1
    j ← j - 1
  endwhile
  dataの全要素の値を要素番号の順に空白区切りで出力する
  if (first < i - 1)
    sort(first, i - 1)
  endif
  if (j + 1 < last)
    sort(j + 1, last)
  endif

## 例25: (令和5年 科目B 問5)
### 指示: コサイン類似度の計算
### 生成コード:
○実数型: calcCosineSimilarity(実数型の配列: vector1, 実数型の配列: vector2)
  実数型: similarity, numerator, denominator, temp ← 0
  整数型: i
  numerator ← 0
  for (i を 1 から vector1の要素数 まで 1 ずつ増やす)
    numerator ← numerator + vector1[i] × vector2[i]
  endfor
  for (i を 1 から vector1の要素数 まで 1 ずつ増やす)
    temp ← temp + vector1[i]の2乗
  endfor
  denominator ← tempの正の平方根
  temp ← 0
  for (i を 1 から vector2の要素数 まで 1 ずつ増やす)
    temp ← temp + vector2[i]の2乗
  endfor
  denominator ← denominator × (tempの正の平方根)
  similarity ← numerator ÷ denominator
  return similarity

## 例26: (令和6年 科目B 問1)
### 指示: 3つの数の最大値
### 生成コード:
○整数型: maximum(整数型: x, 整数型: y, 整数型: z)
  if (x > y and x > z)
    return x
  elseif (y > z)
    return y
  else
    return z
  endif

## 例27: (令和6年 科目B 問2)
### 指示: 2進数文字列から10進数への変換
### 生成コード:
○整数型: convDecimal(文字列型: binary)
  整数型: i, length, result ← 0
  length ← binaryの文字数
  for (i を 1 から length まで 1 ずつ増やす)
    result ← result × 2 + int(binary の i文字目の文字)
  endfor
  return result

## 例28: (令和6年 科目B 問3)
### 指示: 辺リストから隣接行列への変換
### 生成コード:
○整数型の二次配列: edgesToMatrix(整数型配列の配列: edgeList, 整数型: nodeNum)
  整数型の二次配列: adjMatrix ← {nodeNum行nodeNum列の 0}
  整数型: i, u, v
  for (i を 1 から edgeListの要素数 まで 1 ずつ増やす)
    u ← edgeList[i][1]
    v ← edgeList[i][2]
    adjMatrix[u, v] ← 1
    adjMatrix[v, u] ← 1
  endfor
   return adjMatrix

## 例29: (令和6年 科目B 問4)
### 指示: マージアルゴリズム
### 生成コード:
○整数型の配列: merge(整数型の配列: data1, 整数型の配列: data2)
  整数型: n1 ← data1の要素数
  整数型: n2 ← data2の要素数
  整数型の配列: work ← {(n1 + n2)個の 未定義の値}
  整数型: i ← 1
  整数型: j ← 1
  整数型: k ← 1
  while ((i ≦ n1) and (j ≦ n2))
    if (data1[i] ≦ data2[j])
      work[k] ← data1[i]
      i ← i + 1
    else
      work[k] ← data2[j]
      j ← j + 1
    endif
    k ← k + 1
  endwhile
  while (i ≦ n1)
    work[k] ← data1[i]
    i ← i + 1
    k ← k + 1
  endwhile
  while (j ≦ n2)
    work[k] ← data2[j]
    j ← j + 1
    k ← k + 1
  endwhile
  return work

---
以上のルールと例を厳守し、ユーザーの指示に対する疑似言語コードのみを、追加の説明やマークダウン(\`\`\`)なしで直接生成してください。`;

  try {
    // ChatGPT APIのエンドポイント (Base URL対応)
    const baseUrl = process.env.OPENAI_BASE_URL
      ? process.env.OPENAI_BASE_URL.replace(/\/$/, "")
      : 'https://api.openai.com/v1';

    const apiUrl = `${baseUrl}/chat/completions`;

    // APIキーを環境変数から取得します。
    // Next.jsの環境変数(.env.localなど)に OPENAI_API_KEY="あなたのAPIキー" を設定してください。
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OpenAI APIキーが設定されていません。");
    }

    // OpenAI APIのリクエスト形式に合わせたペイロードを作成
    const payload = {
      model: "gpt-4o", // ご指定のモデル
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`APIリクエストに失敗しました: ${response.statusText} (${JSON.stringify(errorBody)})`);
    }

    const result = await response.json();
    // OpenAI APIの応答形式に合わせて、生成されたテキストを取得
    const generatedText = result.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error("AIからの応答が空でした。");
    }

    // 生成されたテキストからコメント行を念のため除去する処理を追加
    const codeWithoutComments = generatedText
      .split('\n')
      .filter((line: string) => !line.trim().startsWith('//')) // '//' で始まる行を除外
      .join('\n');

    return codeWithoutComments.trim();

  } catch (error: any) {
    console.error("AIコード生成エラー:", error);
    throw new Error(`コードの生成に失敗しました: ${error.message}`);
  }
}

/**
 * トレースエラーをログファイルに保存するサーバーアクション
 */
export async function saveErrorLogAction(errorMsg: string, code: string, line: number, vars: any) {
  try {
    // プロジェクトルートを取得
    const cwd = process.cwd();

    // パスの中に 'src' が既に含まれているかチェックして重複を防ぐ
    const targetPath = cwd.endsWith('src')
      ? 'app/(main)/customize_trace'
      : 'src/app/(main)/customize_trace';

    const logDir = path.join(cwd, targetPath);
    const logPath = path.join(logDir, 'error_logs.txt');

    const timestamp = new Date().toISOString();
    const codeLines = code.split('\n');
    const errorLineContent = codeLines[line] || 'Unknown Line';

    const content = `
==================================================
[Date]: ${timestamp}
[Error]: ${errorMsg}
[Line]: ${line + 1}
[Content]: ${errorLineContent}
[Variables]: ${JSON.stringify(vars, null, 2)}
==================================================
`;

    // ディレクトリが存在しない場合は再帰的に作成する (これがENOENT対策)
    await fs.mkdir(logDir, { recursive: true });

    // ファイルに追記
    await fs.appendFile(logPath, content, 'utf8');
    return { success: true };
  } catch (e) {
    console.error("Failed to write error log:", e);
    // エラー自体を返すと無限ループの危険があるため、コンソール出力にとどめる
    return { success: false };
  }
}

/**
 * OpenAIのGPT-4oモデルにPythonコードの生成をリクエストするサーバーアクション (新規追加)
 * @param prompt ユーザーからの指示
 * @returns 生成されたPythonコードの文字列
 */
export async function generatePythonCodeFromAI(prompt: string): Promise<string> {
  const systemPrompt = `あなたは、プログラミング学習用のPythonコードを生成する専門家です。
ユーザーの指示に基づき、初心者がトレース学習を行うのに適したPythonコードを生成してください。

# 生成ルール (厳守)
1. **構文**: 正しいPython 3の構文を使用してください。
2. **入力なし**: \`input()\` 関数は絶対に使用しないでください。必要な値は変数の初期化としてコード内にハードコーディングしてください。
3. **出力**: 結果の確認には \`print()\` 関数を使用してください。
4. **複雑さ**: 学習用のため、過度に複雑なライブラリや高度な機能（ラムダ式、リスト内包表記の多用など）は避け、基本的な制御構文（\`if\`, \`for\`, \`while\`）を中心に構成してください。
5. **コメント**: トレースの邪魔になるため、コメントは最小限、または無しにしてください。
6. **形式**: コードブロック(\`\`\`)を含めず、コードの中身のみをプレーンテキストで返してください。

# コード生成の例

## 指示: 1から5までの和を求める
i = 1
total = 0
while i <= 5:
    total = total + i
    i = i + 1
print(total)

## 指示: FizzBuzz
num = 15
if num % 15 == 0:
    print("FizzBuzz")
elif num % 3 == 0:
    print("Fizz")
elif num % 5 == 0:
    print("Buzz")
else:
    print(num)

## 指示: 配列の合計
numbers = [10, 20, 30, 40, 50]
sum_val = 0
for n in numbers:
    sum_val = sum_val + n
print(sum_val)
`;

  try {
    const baseUrl = process.env.OPENAI_BASE_URL
      ? process.env.OPENAI_BASE_URL.replace(/\/$/, "")
      : 'https://api.openai.com/v1';

    const apiUrl = `${baseUrl}/chat/completions`;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OpenAI APIキーが設定されていません。");
    }

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`APIリクエストに失敗しました: ${response.statusText} (${JSON.stringify(errorBody)})`);
    }

    const result = await response.json();
    const generatedText = result.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error("コハクからの応答が空でした。");
    }

    // コードブロックが含まれている場合の除去処理
    let cleanCode = generatedText.replace(/^```python\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

    return cleanCode.trim();

  } catch (error: any) {
    console.error("AIコード生成エラー:", error);
    throw new Error(`コードの生成に失敗しました: ${error.message}`);
  }
}

/**
 * ユーザーのPythonコードをサーバー側で実行し、トレース結果を取得する
 * (Security Update: Execute via Sandbox Service)
 */
export async function runPythonTraceAction(code: string) {
  // console.log("--- [Debug] runPythonTraceAction Started (Sandbox Mode) ---");

  // 1. Zod Validation
  const validationResult = executeCodeSchema.safeParse({ source_code: code, language: 'python' });
  if (!validationResult.success) {
    throw new Error(`Validation Error: ${(validationResult.error as any).errors.map((e: any) => e.message).join(', ')}`);
  }

  // 2. Keyword Blocking (Client-side pre-check)
  // Note: This is a basic filter. The real security is provided by the Sandbox container.
  const forbiddenKeywords = [
    'import os', 'from os', 'import sys', 'from sys', 'import subprocess', 'from subprocess',
    'import shutil', 'from shutil', 'import pathlib', 'from pathlib',
    'open(', 'exec(', 'eval(', '__import__'
  ];
  for (const keyword of forbiddenKeywords) {
    if (code.includes(keyword)) {
      throw new Error(`Security Error: Forbidden keyword "${keyword}" detected.`);
    }
  }

  try {
    // Use embedded tracer code to avoid file path issues in production (Docker/Next.js)
    const tracerCode = PYTHON_TRACER_SOURCE;

    // Sandbox URL (Env var or default)
    const sandboxUrl = process.env.SANDBOX_URL || 'http://sandbox:4000/execute';

    // console.log(`[Debug] Sending request to Sandbox: ${sandboxUrl}`);

    // Sandboxへリクエスト
    const response = await fetch(sandboxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'python',
        source_code: tracerCode,
        input: code
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sandbox service error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    // console.log("[Debug] Sandbox Response received.");

    // 結果の解析
    const programStdout = result.program_output?.stdout || result.stdout || "";
    const programStderr = result.program_output?.stderr || result.stderr || "";
    const buildStderr = result.build_result?.stderr || result.build_stderr || "";

    if (buildStderr) {
      console.error("[Debug] Build Stderr:", buildStderr);
      throw new Error(`Build Error: ${buildStderr}`);
    }

    if (!programStdout.trim()) {
      console.error("[Debug] Empty stdout from sandbox.");
      console.error("[Debug] Sandbox Result Dump:", JSON.stringify(result, null, 2));

      if (programStderr) {
        throw new Error(`Runtime Error: ${programStderr}`);
      }
      throw new Error("Tracer produced no output.");
    }

    // JSONパース
    const jsonMatch = programStdout.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[Debug] No JSON found in output:", programStdout);
      console.error("[Debug] Sandbox Result Dump:", JSON.stringify(result, null, 2));
      throw new Error("Invalid output format from tracer.");
    }

    let traceData;
    try {
      traceData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("[Debug] JSON Parse Error. Output was:", programStdout);
      throw new Error("Failed to parse trace results.");
    }

    return traceData;

  } catch (error: any) {
    console.error("runPythonTraceAction Error:", error);
    throw error;
  }
}