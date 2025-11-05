'use server';

/**
 * OpenAIのGPT-4oモデルに疑似言語コードの生成をリクエストするサーバーアクション
 * @param prompt ユーザーからの指示 (例: "1から10までの合計を計算する")
 * @returns 生成された疑似言語コードの文字列
 */
export async function generateTraceCodeFromAI(prompt: string): Promise<string> {
  const systemPrompt = `あなたは、本ツール専用の疑似言語を生成する専門家です。ユーザーの指示に基づき、トレース実行可能なコードのみを生成してください。

# 厳密な構文ルール
- 変数宣言: 「整数型: var1, var2」「文字列型: str1」「配列型: arr1」の形式のみ。
- 代入: 「変数 ← 値」 (例: x ← 10, arr[1] ← 5)
- 出力: 「出力する 変数」または「出力する "文字列リテラル"」
- 条件分岐: 「if (条件)」「else」「endif」を使用。条件内の比較演算子は '>' '<' '>=' '<=' '==' '!=' のみ。
- forループ: 「for (変数 を 開始値 から 終了値 まで 1 ずつ増やす)」「endfor」
- whileループ: 「while (条件)」「endwhile」

# 禁止事項 (最重要)
- **コメント禁止**: '//' で始まるコメント行は絶対に追加しないでください。生成するコードにはコメントを一切含めないでください。
- **算術演算子**: \`+\`, \`-\`, \`*\`, \`/\` のみ使用可能です (\`/\` は整数除算の商)。
- **剰余演算子 \`%\` 禁止**: 剰余は \`x - (x / y の商) * y\` の形式で計算してください。
- **論理演算子 \`&&\`, \`||\` 禁止**: 複数の条件はif文をネストさせて表現してください。(例: \`if (a > 0) if (b < 10) ... endif endif\`)
- **複雑な関数禁止**: sqrt(), pow(), ceil() などの組み込み関数は使用しないでください。
- **その他**: 上記以外の構文や記法は使用しないでください。

# 生成コードのお手本 (この形式に厳密に従ってください)

## 例1: FizzBuzz問題
### 指示: 1から30までのFizzBuzz
### 生成コード:
整数型: i, mod3, mod5, mod15
for (i を 1 から 30 まで 1 ずつ増やす)
  mod15 ← i - (i / 15 の商) * 15
  mod3 ← i - (i / 3 の商) * 3
  mod5 ← i - (i / 5 の商) * 5
  if (mod15 == 0)
    出力する "FizzBuzz"
  else
    if (mod3 == 0)
      出力する "Fizz"
    else
      if (mod5 == 0)
        出力する "Buzz"
      else
        出力する i
      endif
    endif
  endif
endfor

## 例2: 最大公約数
### 指示: 60と36の最大公約数を求める
### 生成コード:
整数型: x, y
x ← 60
y ← 36
while (x != y)
  if (x > y)
    x ← x - y
  else
    y ← y - x
  endif
endwhile
出力する x

---
以上のルールと例を厳守し、ユーザーの指示に対する疑似言語コードのみを、追加の説明やマークダウン(\`\`\`)なしで直接生成してください。`;

  try {
    // ChatGPT APIのエンドポイント
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
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
        // AuthorizationヘッダーでAPIキーを送信
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

