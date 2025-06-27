/**
 * @file このアプリケーションで扱う問題関連の型定義ファイルです。
 */

/**
 * @interface AnswerOption
 * @description 解答群の一つ一つの選択肢が持つデータ構造を定義します。
 */
export interface AnswerOption {
  label: string; // 画面に表示される選択肢の記号 (例: 'ア', 'イ')
  value: string; // 正誤判定に使われる内部的な値 (例: '1,2', 'ウ')
}

/**
 * @interface QueueItem
 * @description 優先度付きキューの各要素が持つデータ構造を定義します。
 */
export interface QueueItem {
    value: string;
    prio: number;
}

/**
 * @type VariablesState
 * @description プログラムのトレース中に変化する、すべての変数の状態を保持するオブジェクトの型です。
 */
export type VariablesState = Record<string, any>;


/**
 * @type TraceStep
 * @description トレースの1ステップ（1行）で実行される処理を定義する「関数」の型です。
 */
export type TraceStep = (vars: VariablesState) => VariablesState;

// 注: DBから取得した静的なproblems配列とgetProblemById関数は削除します。
/**
 * @interface Problem
 * @description 1つの問題を構成するために必要な、すべてのデータの構造を定義します。
 * 新しい問題を追加する際は、必ずこの `Problem` 型に従ってデータを作成します。
 */
export interface Problem {
  id: string;                                   // 問題をURLなどで一意に識別するためのID (例: "1", "2")
  title: { ja: string; en: string };            // 問題のタイトル (日本語/英語)
  description: { ja: string; en: string };      // 問題文
  programLines: { ja: string[]; en: string[] };  // 擬似言語プログラムの各行
  answerOptions: { ja: AnswerOption[]; en: AnswerOption[] }; // 解答群の選択肢
  correctAnswer: string;                        // この問題の正解の値
  explanationText: { ja: string; en: string };  // 解答後に表示される解説文
  initialVariables: VariablesState;             // トレース開始時の変数の初期状態
  traceLogic: TraceStep[];                      // プログラムの各行に対応するトレース処理の配列
  logicType: string;
  
  // --- 以下は特定の種類の問題でのみ使用するオプションのプロパティです ---
  
  /**
   * @property {object} [traceOptions] - トレースの特別な設定（FizzBuzz問題などで使用）
   * @property {number[]} presets - ユーザーが選択できるトレース開始時のプリセット値 (例: [3, 5, 15, 7])
   */
  traceOptions?: {
    presets?: number[];
    presets_array?: { label: string; value: any }[];
    presets_case?: { label: string; value: any }[];
  };

  /**
   * @property {function} [calculateNextLine] - 次に実行すべき行を計算する特別なロジック（条件分岐やループ問題で使用）
   * @param currentLine 現在の行番号
   * @param vars 更新後の変数の状態
   * @returns {number} 次にジャンプすべき行番号
   */
  calculateNextLine?: (currentLine: number, vars: VariablesState) => number;
}


/**
 * @constant problems
 * @description
 * この配列に、すべての問題データをオブジェクトとして格納します。
 * 新しい問題を追加する場合は、この配列の末尾に新しいオブジェクトを追加してください。
 */
export const problems: Problem[] = [
    {
        id: '1',
        logicType: 'VARIABLE_SWAP',
        title: { ja: "サンプル問題 [科目B] 問1", en: "Sample Problem [Subject B] Q1" },
        description: { ja: "次の記述中の□に入れる正しい答えを、解答群の中から選べ。プログラムを実行すると'　　'と出力される。", en: "What are the values of y and z after executing the following program?" },
        programLines: { ja: [ '1 整数型: x ← 1', '2 整数型: y ← 2', '3 整数型: z ← 3', '4 x ← y', '5 y ← z', '6 z ← x', '7 yとzの値をこの順にコンマ区切りで出力する', ], en: [], },
        answerOptions: { ja: [ { label: 'ア', value: '1,2' }, { label: 'イ', value: '1,3' }, { label: 'ウ', value: '2,1' }, { label: 'エ', value: '2,3' }, { label: 'オ', value: '3,1' }, { label: 'カ', value: '3,2' }, ], en: [], },
        correctAnswer: '3,2',
        explanationText: { ja: `xは1、yは2、zは3で初期化されています。まずxにyの値である2が代入され、x=2, y=2, z=3となります。次にyにzの値である3が代入され、x=2, y=3, z=3となります。最後にzにxの値である2が代入され、x=2, y=3, z=2となります。したがって、yとzの値は「3,2」です。`, en: `` },
        initialVariables: { x: null, y: null, z: null },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    {
        id: '2',
        logicType: 'FIZZ_BUZZ',
        title: { ja: "サンプル問題 [科目B] 問2", en: "Sample Problem [Subject B] Q2" },
        description: { ja: "次のプログラム中の a ~ c に入れる正しい答えの組み合わせを、解答群の中から選べ。関数 fizzBuzz は、引数で与えられた値が、3で割り切れて5で割り切れない場合は\"3で割り切れる\"を、5で割り切れて3で割り切れない場合は\"5で割り切れる\"を、3と5で割り切れる場合は\"3と5で割り切れる\"を返します。それ以外の場合は\"3でも5でも割り切れない\"を返します。", en: "" },
        programLines: { ja: [ ' 1: ○文字列型: fizzBuzz(整数型: num)', ' 2: 　文字列型: result', ' 3: 　if (num が 3と5 で割り切れる)', ' 4: 　　result ← "3と5で割り切れる"', ' 5: 　elseif (num が 3 で割り切れる)', ' 6: 　　result ← "3で割り切れる"', ' 7: 　elseif (num が 5 で割り切れる)', ' 8: 　　result ← "5で割り切れる"', ' 9: 　else', '10: 　　result ← "3でも5でも割り切れない"', '11: 　endif', '12: 　return result', ], en: [], },
        answerOptions: { ja: [ { label: 'ア', value: 'a:3, b:3と5, c:5' }, { label: 'イ', value: 'a:3, b:5, c:3と5' }, { label: 'ウ', value: 'a:3と5, b:3, c:5' }, { label: 'エ', value: 'a:5, b:3, c:3と5' }, { label: 'オ', value: 'a:5, b:3と5, c:3' }, ], en: [], },
        correctAnswer: 'a:3と5, b:3, c:5',
        explanationText: { ja: `if-elseif-else構文では、条件は上から順に評価され、最初に真(true)になったブロックだけが実行されます。3と5の両方で割り切れる数（例: 15）は3でも5でも割り切れるため、最も限定的な「3と5で割り切れる」という条件を最初に評価する必要があります。`, en: `` },
        initialVariables: { num: null, result: null },
        traceOptions: { presets: [3, 5, 15, 7] },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    {
        id: '3',
        logicType: 'ARRAY_SUM',
        title: { ja: "サンプル問題 [科目B] 問3", en: "Sample Problem [Subject B] Q3" },
        description: { ja: "配列の要素番号は1から始まる。関数 makeNewArray は、要素数2以上の整数型の配列を引数にとり、整数型の配列を返す関数である。関数 makeNewArray を makeNewArray({3, 2, 1, 6, 5, 4})として呼び出したとき、戻り値の配列の要素番号5の値は[ ]となる。", en: "", },
        programLines: { ja: [ ' 1: ○整数型の配列: makeNewArray(整数型の配列: in)', ' 2: 　整数型の配列: out ← {}', ' 3: 　整数型: i, tail', ' 4: 　outの末尾に in[1] の値 を追加する', ' 5: 　for (i を 2 から inの要素数 まで 1 ずつ増やす)', ' 6: 　　tail ← out[outの要素数]', ' 7: 　　outの末尾に (tail + in[i]) の結果を追加する', ' 8: 　endfor', ' 9: 　return out', ], en: [], },
        answerOptions: { ja: [ { label: 'ア', value: '5' }, { label: 'イ', value: '6' }, { label: 'ウ', value: '9' }, { label: 'エ', value: '11' }, { label: 'オ', value: '12' }, { label: 'カ', value: '17' }, { label: 'キ', value: '21' }, ], en: [], },
        correctAnswer: '17',
        explanationText: { ja: `makeNewArray({3, 2, 1, 6, 5, 4})を呼び出したときの処理の流れをトレースしていきます...\n`, en: ``},
        initialVariables: { in: [3, 2, 1, 6, 5, 4], out: [], i: null, tail: null },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    {
        id: '4',
        logicType: 'GCD_SUBTRACTION',
        title: { ja: "サンプル問題 [科目B] 問4", en: "Sample Problem [Subject B] Q4" },
        description: { ja: "次のプログラム中の a ～ c に入れる正しい答えの組合せを，解答群の中から選べ。\n\n関数 gcd は，引数で与えられた二つの正の整数 num1 と num2 の最大公約数を，次の(1)～(3)の性質を利用して求める。\n(1) num1 と num2 が等しいとき，num1 と num2 の最大公約数は num1 である。\n(2) num1 が num2 より大きいとき，num1 と num2 の最大公約数は，(num1 - num2) と num2 の最大公約数と等しい。\n(3) num2 が num1 より大きいとき，num1 と num2 の最大公約数は，num1 と (num2 - num1) の最大公約数と等しい。", en: "Select the correct combination for a, b, and c in the following program from the answer choices. The function gcd finds the greatest common divisor (GCD) of two positive integers, num1 and num2, using properties (1) to (3)." },
        programLines: { ja: [ ' 1: ○整数型: gcd(整数型: num1, 整数型: num2)', ' 2: 　整数型: x ← num1', ' 3: 　整数型: y ← num2', ' 4: 　[   a   ]', ' 5: 　　if ( [   b   ] )', ' 6: 　　　x ← x - y', ' 7: 　　else', ' 8: 　　　y ← y - x', ' 9: 　　endif', '10: 　[   c   ]', '11: 　return x', ], en: [ ' 1: ○function gcd(integer: num1, integer: num2) -> integer', ' 2: 　integer: x ← num1', ' 3: 　integer: y ← num2', ' 4: 　[   a   ]', ' 5: 　　if ( [   b   ] )', ' 6: 　　　x ← x - y', ' 7: 　　else', ' 8: 　　　y ← y - x', ' 9: 　　endif', '10: 　[   c   ]', '11: 　return x', ], },
        answerOptions: { ja: [ { label: 'ア', value: 'a: if (x ≠ y), b: x < y, c: endif' }, { label: 'イ', value: 'a: if (x ≠ y), b: x > y, c: endif' }, { label: 'ウ', value: 'a: while (x ≠ y), b: x < y, c: endwhile' }, { label: 'エ', value: 'a: while (x ≠ y), b: x > y, c: endwhile' }, ], en: [ { label: 'A', value: 'a: if (x ≠ y), b: x < y, c: endif' }, { label: 'B', value: 'a: if (x ≠ y), b: x > y, c: endif' }, { label: 'C', value: 'a: while (x ≠ y), b: x < y, c: endwhile' }, { label: 'D', value: 'a: while (x ≠ y), b: x > y, c: endwhile' }, ], },
        correctAnswer: 'a: while (x ≠ y), b: x > y, c: endwhile',
        explanationText: { ja: "まず、a と c に入る制御文ですが、(1)の説明に「最大公約数が num1 と num2 が等しくなったときの num1 の値である」という説明があります。2つの正の整数について、(2)または(3)の処理を1回行っただけでは num1 と num2 が等しくなるとは限らず、両者が等しくなるまで(2)または(3)の処理を繰り返す必要があるので、繰返し処理を行うwhile文が当てはまります。よって、正解肢は「ウ」または「エ」に絞られます。\n\n次に b ですが、条件に合致するときに x ← x - y、つまり、num1 に num1 - num2 を代入する処理を行っています。(2)の説明より、この処理を行うのは num1 が num2 より大きいときですから、x > y が当てはまるとわかります。\n\n逆に x < y のときにこの処理を行ってしまうと、x の値は負数となり、それ以後 x < y ⇒ x ← x - y が永遠に繰り返されることにより、繰返し処理が終了しなくなってしまいます。また、2つの正の整数の最大公約数が負数ということはありません。よって、x < y を入れるのは不適切です。\n\nしたがって、while文と x > y の組合せである「エ」が適切です。", en: "First, for the control statements in a and c, property (1) states that the GCD is the value of num1 when num1 and num2 become equal. Since one application of property (2) or (3) does not guarantee equality, a loop is needed to repeat the process. Therefore, a 'while' statement is appropriate, narrowing the choices to C or D.\n\nNext, for b, the operation 'x ← x - y' corresponds to property (2), which applies when num1 > num2. Thus, the condition must be 'x > y'.\n\nIf we were to use 'x < y', 'x' would become negative, leading to an infinite loop. The GCD of positive integers cannot be negative. Therefore, 'x < y' is incorrect.\n\nConsequently, the correct combination is 'while' and 'x > y', which is choice D." },
        initialVariables: { num1: 36, num2: 60, x: null, y: null },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    {
        id: '5',
        logicType: 'EXPRESSION_EVAL',
        title: { ja: "サンプル問題 [科目B] 問5", en: "Sample Problem [Subject B] Q5" },
        description: { ja: "次のプログラム中の□に入れる正しい答えを、解答群の中から選べ。\n\n関数 calc は、正の実数 x と y を受け取り、√x²+y² の計算結果を返す。関数 calc が使う関数 pow は、第1引数として正の実数 a を、第2引数として実数 b を受け取り、a の b 乗の値を実数型で返す。", en: "Select the correct answer for the blank in the program from the answer choices.\n\nThe function calc takes two positive real numbers, x and y, and returns the result of √x²+y². The function pow, used by calc, takes a positive real number a as the first argument and a real number b as the second argument, and returns the value of a to the power of b as a real number." },
        programLines: { ja: [ '○実数型: calc(実数型: x, 実数型: y)', '  return [                      ]', ], en: [ '○function calc(real: x, real: y) -> real', '  return [                      ]', ] },
        answerOptions: { ja: [ { label: 'ア', value: '(pow(x, 2) + pow(y, 2)) ÷ pow(2, 0.5)' }, { label: 'イ', value: '(pow(x, 2) + pow(y, 2)) ÷ pow(x, y)' }, { label: 'ウ', value: 'pow(2, pow(x, 0.5)) + pow(2, pow(y, 0.5))' }, { label: 'エ', value: 'pow(pow(pow(2, x), y), 0.5)' }, { label: 'オ', value: 'pow(pow(x, 2) + pow(y, 2), 0.5)' }, { label: 'カ', value: 'pow(x, 2) × pow(y, 2) ÷ pow(x, y)' }, { label: 'キ', value: 'pow(x, y) ÷ pow(2, 0.5)' }, ], en: [ { label: 'A', value: '(pow(x, 2) + pow(y, 2)) ÷ pow(2, 0.5)' }, { label: 'B', value: '(pow(x, 2) + pow(y, 2)) ÷ pow(x, y)' }, { label: 'C', value: 'pow(2, pow(x, 0.5)) + pow(2, pow(y, 0.5))' }, { label: 'D', value: 'pow(pow(pow(2, x), y), 0.5)' }, { label: 'E', value: 'pow(pow(x, 2) + pow(y, 2), 0.5)' }, { label: 'F', value: 'pow(x, 2) × pow(y, 2) ÷ pow(x, y)' }, { label: 'G', value: 'pow(x, y) ÷ pow(2, 0.5)' }, ], },
        correctAnswer: 'pow(pow(x, 2) + pow(y, 2), 0.5)',
        explanationText: { ja: "関数 pow() は第1引数に値、第2引数にべき指数(累乗の指数)を指定します。√x (xの平方根)は、xの1/2乗 = 0.5乗であることがポイントです。\n\nx² = pow(x, 2)\ny² = pow(y, 2)\nx² + y² = pow(x, 2) + pow(y, 2)\n\n√x²+y² は x²+y² の結果を1/2乗したものなので、pow() の第1引数に pow(x, 2) + pow(y, 2)、第2引数に 0.5 を指定することになります。\n\nしたがって「オ」の pow(pow(x, 2) + pow(y, 2), 0.5) が適切です。", en: "The pow() function takes a value as the first argument and the exponent as the second argument. The key point is that √x (the square root of x) is equivalent to x to the power of 1/2, or 0.5.\n\nx² = pow(x, 2)\ny² = pow(y, 2)\nx² + y² = pow(x, 2) + pow(y, 2)\n\nSince √x²+y² is the result of x²+y² raised to the power of 1/2, the first argument to pow() should be pow(x, 2) + pow(y, 2), and the second argument should be 0.5.\n\nTherefore, option 'E', pow(pow(x, 2) + pow(y, 2), 0.5), is the correct choice." },
        initialVariables: { x: 3, y: 4, result: null },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    {
        id: '6',
        logicType: 'BIT_REVERSE',
        title: { ja: "サンプル問題 [科目B] 問6", en: "Sample Problem [Subject B] Q6" },
        description: { ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。\n\n関数 rev は8ビット型の引数 byte を受け取り，ビットの並びを逆にした値を返す。例えば，関数 rev を rev(01001011) として呼び出すと，戻り値は11010010となる。\nなお，演算子∧はビット単位の論理積，演算子∨はビット単位の論理和，演算子>>は論理右シフト，演算子<<は論理左シフトを表す。例えば，value >> n は value の値を n ビットだけ右に論理シフトし，value << n は value の値を n ビットだけ左に論理シフトする。", en: "Select the correct answer for the blank in the program from the answer choices. The function rev takes an 8-bit argument 'byte' and returns a value with the bit order reversed. For example, calling rev(01001011) returns 11010010. The operator ∧ is bitwise AND, ∨ is bitwise OR, >> is logical right shift, and << is logical left shift." },
        programLines: { ja: [ '1: ○8ビット型: rev(8ビット型: byte)', '2:   8ビット型: rbyte ← byte', '3:   8ビット型: r ← 00000000', '4:   整数型: i', '5:   for (i を 1 から 8 まで 1 ずつ増やす)', '6:     [                                          ]', '7:   endfor', '8:   return r', ], en: [ '1: ○function rev(byte: 8bit) -> 8bit', '2:   8bit: rbyte ← byte', '3:   8bit: r ← 00000000', '4:   integer: i', '5:   for (i from 1 to 8 step 1)', '6:     [                                          ]', '7:   endfor', '8:   return r', ], },
        answerOptions: { ja: [ { label: 'ア', value: 'r ← (r << 1) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 1' }, { label: 'イ', value: 'r ← (r << 7) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 7' }, { label: 'ウ', value: 'r ← (rbyte << 1) ∨ (rbyte >> 7)\nrbyte ← r' }, { label: 'エ', value: 'r ← (rbyte >> 1) ∨ (rbyte << 7)\nrbyte ← r' }, ], en: [ { label: 'A', value: 'r ← (r << 1) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 1' }, { label: 'B', value: 'r ← (r << 7) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 7' }, { label: 'C', value: 'r ← (rbyte << 1) ∨ (rbyte >> 7)\nrbyte ← r' }, { label: 'D', value: 'r ← (rbyte >> 1) ∨ (rbyte << 7)\nrbyte ← r' }, ] },
        correctAnswer: 'r ← (r << 1) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 1',
        explanationText: { ja: "この問題は、入力されたバイト(`rbyte`)のビットを1つずつ右端（最下位ビット）から取り出し、結果を格納するバイト(`r`)の左端（最上位ビット）から詰めていくことで、ビットの並びを反転させます。\n\n1. `r ← (r << 1) ...`: まず、結果`r`を1ビット左にシフトします。これにより、新しいビットを右端に挿入するためのスペースが作られます。\n2. `... ∨ (rbyte ∧ 00000001)`: `rbyte ∧ 00000001`は、`rbyte`の最下位ビットだけを取り出す操作です（マスク処理）。結果は`00000001`または`00000000`になります。これを左シフトした`r`と論理和(∨)を取ることで、取り出したビットを`r`の最下位ビットに設定します。\n3. `rbyte ← rbyte >> 1`: 処理済みの最下位ビットを`rbyte`から捨てるため、`rbyte`全体を1ビット右にシフトします。これにより、次のループでは、その隣のビットが最下位ビットになります。\n\nこの3つの処理を8回繰り返すことで、`rbyte`のビットが逆順で`r`に格納されます。したがって、「ア」が正解です。", en: "This problem reverses the bit order by taking bits one by one from the right end (LSB) of the input byte (`rbyte`) and placing them into the left end (MSB) of the result byte (`r`).\n\n1. `r ← (r << 1) ...`: First, the result `r` is shifted left by one bit. This makes space to insert a new bit at the right end.\n2. `... ∨ (rbyte ∧ 00000001)`: `rbyte ∧ 00000001` is an operation to extract only the least significant bit of `rbyte` (a masking operation). The result will be `00000001` or `00000000`. Taking a bitwise OR (∨) with the left-shifted `r` sets the extracted bit as the new LSB of `r`.\n3. `rbyte ← rbyte >> 1`: To discard the processed LSB from `rbyte`, `rbyte` is shifted right by one bit. This makes the next bit the new LSB for the next loop iteration.\n\nBy repeating these three steps eight times, the bits of `rbyte` are stored in `r` in reverse order. Therefore, 'A' is the correct answer." },
        initialVariables: { byte: '01001011', rbyte: null, r: null, i: null, },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    {
        id: '7',
        logicType: 'RECURSIVE_FACTORIAL',
        title: { ja: "サンプル問題 [科目B] 問7", en: "Sample Problem [Subject B] Q7" },
        description: { ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。\n\n関数 factorial は非負の整数 n を引数にとり，その階乗を返す関数である。非負の整数 n の階乗は n が0のときに1になり，それ以外の場合は1からnまでの整数を全て掛け合わせた数となる。", en: "Select the correct answer for the blank in the program from the answer choices. The function factorial takes a non-negative integer n as an argument and returns its factorial. The factorial of a non-negative integer n is 1 when n is 0, and the product of all integers from 1 to n otherwise." },
        programLines: { ja: [ '1: ○整数型: factorial(整数型: n)', '2:   if (n = 0)', '3:     return 1', '4:   endif', '5:   return [                      ]', ], en: [ '1: ○function factorial(integer: n) -> integer', '2:   if (n = 0)', '3:     return 1', '4:   endif', '5:   return [                      ]', ] },
        answerOptions: { ja: [ { label: 'ア', value: '(n - 1) * factorial(n)' }, { label: 'イ', value: 'factorial(n - 1)' }, { label: 'ウ', value: 'n' }, { label: 'エ', value: 'n * (n - 1)' }, { label: 'オ', value: 'n * factorial(1)' }, { label: 'カ', value: 'n * factorial(n - 1)' }, ], en: [ { label: 'A', value: '(n - 1) * factorial(n)' }, { label: 'B', value: 'factorial(n - 1)' }, { label: 'C', value: 'n' }, { label: 'D', value: 'n * (n - 1)' }, { label: 'E', value: 'n * factorial(1)' }, { label: 'F', value: 'n * factorial(n - 1)' }, ] },
        correctAnswer: 'n * factorial(n - 1)',
        explanationText: { ja: "この関数は再帰呼び出しによって階乗を計算します。\n\n・ベースケース: `n`が0の場合、再帰を停止し、1を返します。これは階乗の定義(0! = 1)です。\n・再帰ステップ: `n`が0でない場合、`n`と`factorial(n - 1)`の結果を掛け合わせます。これにより、`n * (n-1) * (n-2) * ... * 1`という計算が実現されます。\n\n例えば`factorial(4)`を呼び出すと、内部では`4 * factorial(3)`、さらに`4 * 3 * factorial(2)`...と展開され、最終的に`4 * 3 * 2 * 1 * factorial(0)`となります。`factorial(0)`が1を返すことで、全体の計算結果24が求まります。\n\nしたがって、正しい再帰の式は「カ」の`n * factorial(n - 1)`です。", en: "This function calculates the factorial using recursion.\n\n- Base Case: When `n` is 0, the recursion stops and returns 1. This is the definition of factorial (0! = 1).\n- Recursive Step: When `n` is not 0, it multiplies `n` by the result of `factorial(n - 1)`. This achieves the calculation `n * (n-1) * (n-2) * ... * 1`.\n\nFor example, calling `factorial(4)` internally expands to `4 * factorial(3)`, then `4 * 3 * factorial(2)`, and so on, eventually becoming `4 * 3 * 2 * 1 * factorial(0)`. Since `factorial(0)` returns 1, the final result of 24 is calculated.\n\nTherefore, the correct recursive formula is 'F', `n * factorial(n - 1)`." },
        initialVariables: { n: 4, current_n: 4, result: 1, },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    {
        id: '8',
        logicType: 'PRIORITY_QUEUE',
        title: { ja: "サンプル問題 [科目B] 問8", en: "Sample Problem [Subject B] Q8" },
        description: { ja: "次の記述中の□に入れる正しい答えを，解答群の中から選べ。\n\n優先度付きキューを操作するプログラムである。優先度付きキューとは扱う要素に優先度を付けたキューであり，要素を取り出す際には優先度の高いものから順番に取り出される。クラス PrioQueue は優先度付きキューを表すクラスである。クラス PrioQueue の説明を図に示す。ここで，優先度は整数型の値1，2，3のいずれかであり，小さい値ほど優先度が高いものとする。\n\n手続 prioSched を呼び出したとき，出力は□の順となる。", en: "Select the correct answer for the blank in the following description from the answer choices. This is a program that operates on a priority queue. A priority queue is a queue where each element has a priority, and elements are dequeued in order of highest priority. The class PrioQueue represents a priority queue. The description of the PrioQueue class is shown in the figure. Here, the priority is one of the integer values 1, 2, or 3, with smaller values indicating higher priority. When the procedure prioSched is called, the output will be in the order of [ ]." },
        programLines: { ja: [ ' 1: ○prioSched()', ' 2:   prioQueue: PrioQueue ← PrioQueue()', ' 3:   prioQueue.enqueue("A", 1)', ' 4:   prioQueue.enqueue("B", 2)', ' 5:   prioQueue.enqueue("C", 2)', ' 6:   prioQueue.enqueue("D", 3)', ' 7:   prioQueue.dequeue() /* 戻り値は使用しない */', ' 8:   prioQueue.dequeue() /* 戻り値は使用しない */', ' 9:   prioQueue.enqueue("D", 3)', '10:   prioQueue.enqueue("B", 2)', '11:   prioQueue.dequeue() /* 戻り値は使用しない */', '12:   prioQueue.dequeue() /* 戻り値は使用しない */', '13:   prioQueue.enqueue("C", 2)', '14:   prioQueue.enqueue("A", 1)', '15:   while (prioQueue.size() が 0 と等しくない)', '16:     prioQueue.dequeue() の戻り値を出力', '17:   endwhile', ], en: [ ' 1: ○procedure prioSched()', ' 2:   prioQueue: PrioQueue ← new PrioQueue()', ' 3:   prioQueue.enqueue("A", 1)', ' 4:   prioQueue.enqueue("B", 2)', ' 5:   prioQueue.enqueue("C", 2)', ' 6:   prioQueue.enqueue("D", 3)', ' 7:   prioQueue.dequeue() /* return value not used */', ' 8:   prioQueue.dequeue() /* return value not used */', ' 9:   prioQueue.enqueue("D", 3)', '10:   prioQueue.enqueue("B", 2)', '11:   prioQueue.dequeue() /* return value not used */', '12:   prioQueue.dequeue() /* return value not used */', '13:   prioQueue.enqueue("C", 2)', '14:   prioQueue.enqueue("A", 1)', '15:   while (prioQueue.size() is not equal to 0)', '16:     output the return value of prioQueue.dequeue()', '17:   endwhile', ] },
        answerOptions: { ja: [ { label: 'ア', value: '"A", "B", "C", "D"' }, { label: 'イ', value: '"A", "B", "D", "D"' }, { label: 'ウ', value: '"A", "C", "C", "D"' }, { label: 'エ', value: '"A", "C", "D", "D"' }, ], en: [ { label: 'A', value: '"A", "B", "C", "D"' }, { label: 'B', value: '"A", "B", "D", "D"' }, { label: 'C', value: '"A", "C", "C", "D"' }, { label: 'D', value: '"A", "C", "D", "D"' }, ] },
        correctAnswer: '"A", "C", "D", "D"',
        explanationText: { ja: "enqueueはキューに要素を追加し、dequeueは優先度が最も高い(数値が小さい)要素を取り出します。同じ優先度の場合は先に追加されたものが先に取り出されます(FIFO)。\n\n1. enqueue(\"A\",1): [(\"A\",1)]\n2. enqueue(\"B\",2): [(\"A\",1),(\"B\",2)]\n3. enqueue(\"C\",2): [(\"A\",1),(\"B\",2),(\"C\",2)]\n4. enqueue(\"D\",3): [(\"A\",1),(\"B\",2),(\"C\",2),(\"D\",3)]\n5. dequeue(): \"A\"を取り出す → [(\"B\",2),(\"C\",2),(\"D\",3)]\n6. dequeue(): \"B\"を取り出す → [(\"C\",2),(\"D\",3)]\n7. enqueue(\"D\",3): [(\"C\",2),(\"D\",3),(\"D\",3)]\n8. enqueue(\"B\",2): [(\"C\",2),(\"D\",3),(\"D\",3),(\"B\",2)]\n9. dequeue(): \"C\"を取り出す → [(\"D\",3),(\"D\",3),(\"B\",2)]\n10. dequeue(): \"B\"を取り出す → [(\"D\",3),(\"D\",3)]\n11. enqueue(\"C\",2): [(\"D\",3),(\"D\",3),(\"C\",2)]\n12. enqueue(\"A\",1): [(\"D\",3),(\"D\",3),(\"C\",2),(\"A\",1)]\n\n最終的なキューの状態は [(\"D\",3), (\"D\",3), (\"C\",2), (\"A\",1)] です。ここからwhileループで全てを取り出すと、優先度順に「A」→「C」→「D」→「D」と出力されます。したがって、「エ」が正解です。", en: "enqueue adds an element to the queue, and dequeue removes the element with the highest priority (smallest number). If priorities are the same, the one added first is removed (FIFO).\n\n1. enqueue(\"A\",1): [(\"A\",1)]\n2. enqueue(\"B\",2): [(\"A\",1),(\"B\",2)]\n3. enqueue(\"C\",2): [(\"A\",1),(\"B\",2),(\"C\",2)]\n4. enqueue(\"D\",3): [(\"A\",1),(\"B\",2),(\"C\",2),(\"D\",3)]\n5. dequeue(): Removes \"A\" → [(\"B\",2),(\"C\",2),(\"D\",3)]\n6. dequeue(): Removes \"B\" → [(\"C\",2),(\"D\",3)]\n7. enqueue(\"D\",3): [(\"C\",2),(\"D\",3),(\"D\",3)]\n8. enqueue(\"B\",2): [(\"C\",2),(\"D\",3),(\"D\",3),(\"B\",2)]\n9. dequeue(): Removes \"C\" → [(\"D\",3),(\"D\",3),(\"B\",2)]\n10. dequeue(): Removes \"B\" → [(\"D\",3),(\"D\",3)]\n11. enqueue(\"C\",2): [(\"D\",3),(\"D\",3),(\"C\",2)]\n12. enqueue(\"A\",1): [(\"D\",3),(\"D\",3),(\"C\",2),(\"A\",1)]\n\nThe final state of the queue is [(\"D\",3), (\"D\",3), (\"C\",2), (\"A\",1)]. Dequeuing all elements from this state in the while loop results in the output \"A\" → \"C\" → \"D\" → \"D\" in order of priority. Therefore, 'D' is the correct answer." },
        initialVariables: { queue: [], output: [], },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問9: 2分木の走査 ---
    // =================================================================================
    {
        id: '9',
        logicType: 'BINARY_TREE_TRAVERSAL',
        title: { ja: "サンプル問題 [科目B] 問9", en: "Sample Problem [Subject B] Q9" },
        description: {
            ja: "次の記述中の□に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n手続 order は，図の2分木の，引数で指定した節を根とする部分木をたどりながら，全ての節番号を出力する。大域の配列 tree が図の2分木を表している。配列 tree の要素は，対応する節の子の節番号を，左の子，右の子の順に格納した配列である。例えば，配列 tree の要素番号1の要素は，節番号1の子の節番号から成る配列であり，左の子の節番号2，右の子の節番号3を配列 {2, 3} として格納する。手続 order を order(1) として呼び出すと，□の順に出力される。",
            en: "Select the correct answer for the blank from the answer choices. Array indices start from 1. The procedure 'order' traverses a subtree rooted at the node specified by the argument and outputs all node numbers. The global array 'tree' represents the binary tree shown. Each element of 'tree' is an array containing the node numbers of its children, left then right. For example, element 1 of 'tree' is {2, 3}, representing the children of node 1. When 'order' is called as order(1), the output is in the order of [ ]."
        },
        programLines: {
            ja: [
                ' 1: 大域: 整数型配列の配列: tree ← {{2, 3}, {4, 5}, {6, 7}, {8, 9},',
                ' 2:                             {10, 11}, {12, 13}, {14}, {}, {},',
                ' 3:                             {}, {}, {}, {}} // {}は要素数0の配列',
                ' 4: ',
                ' 5: ○order(整数型: n)',
                ' 6:   if (tree[n]の要素数 が 2 と等しい)',
                ' 7:     order(tree[n][1])',
                ' 8:     nを出力',
                ' 9:     order(tree[n][2])',
                '10:   elseif (tree[n]の要素数 が 1 と等しい)',
                '11:     order(tree[n][1])',
                '12:     nを出力',
                '13:   else',
                '14:     nを出力',
                '15:   endif',
            ],
            en: [
                ' 1: global: array of integer arrays: tree ← {{2, 3}, {4, 5}, ...}',
                ' 2: ',
                ' 3: ',
                ' 4: ',
                ' 5: ○procedure order(integer: n)',
                ' 6:   if (length of tree[n] is 2)',
                ' 7:     order(tree[n][1])',
                ' 8:     output n',
                ' 9:     order(tree[n][2])',
                '10:   elseif (length of tree[n] is 1)',
                '11:     order(tree[n][1])',
                '12:     output n',
                '13:   else',
                '14:     output n',
                '15:   endif',
            ]
        },
        answerOptions: {
            ja: [
              { label: 'ア', value: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14' },
              { label: 'イ', value: '1, 2, 4, 8, 9, 5, 10, 11, 3, 6, 12, 13, 7, 14' },
              { label: 'ウ', value: '8, 4, 9, 2, 10, 5, 11, 1, 12, 6, 13, 3, 14, 7' },
              { label: 'エ', value: '8, 9, 4, 10, 11, 5, 2, 12, 13, 6, 14, 7, 3, 1' },
            ],
            en: [
              { label: 'A', value: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14' },
              { label: 'B', value: '1, 2, 4, 8, 9, 5, 10, 11, 3, 6, 12, 13, 7, 14' },
              { label: 'C', value: '8, 4, 9, 2, 10, 5, 11, 1, 12, 6, 13, 3, 14, 7' },
              { label: 'D', value: '8, 9, 4, 10, 11, 5, 2, 12, 13, 6, 14, 7, 3, 1' },
            ]
        },
        correctAnswer: '8, 4, 9, 2, 10, 5, 11, 1, 12, 6, 13, 3, 14, 7',
        explanationText: {
            ja: "このプログラムは、2分木を「通りがけ順（in-order）」で巡回します。通りがけ順の基本的な動作は「左の子を訪問 → 自分自身を訪問（出力）→ 右の子を訪問」です。\n\n1. `order(1)`が呼ばれる。\n2. 節1には左の子2がいるので、`order(2)`を呼ぶ。\n3. 節2には左の子4がいるので、`order(4)`を呼ぶ。\n4. 節4には左の子8がいるので、`order(8)`を呼ぶ。\n5. 節8には子がいないので、「8」を出力。\n6. `order(4)`に戻り、自分自身「4」を出力。次に右の子9を訪れるため`order(9)`を呼ぶ。\n7. 節9には子がいないので、「9」を出力。\n8. `order(2)`に戻り、自分自身「2」を出力。次に右の子5を訪れるため`order(5)`を呼ぶ。\n...という流れを木全体で繰り返します。\n\n最終的に、左の葉から順にたどり、根に戻り、右をたどる、という動きを繰り返すことで、「ウ」の`8, 4, 9, 2, 10, 5, 11, 1, 12, 6, 13, 3, 14, 7`という出力順になります。",
            en: "This program performs an in-order traversal of the binary tree. The basic steps of an in-order traversal are: visit the left child, visit the node itself (output), and then visit the right child.\n\n1. `order(1)` is called.\n2. Node 1 has a left child (2), so `order(2)` is called.\n3. Node 2 has a left child (4), so `order(4)` is called.\n4. Node 4 has a left child (8), so `order(8)` is called.\n5. Node 8 has no children, so '8' is output.\n6. Return to `order(4)`, output '4', then call `order(9)` for the right child.\n7. Node 9 has no children, so '9' is output.\n8. Return to `order(2)`, output '2', then call `order(5)` for the right child.\nThis process continues for the entire tree, resulting in the output sequence 'C'."
        },
        initialVariables: {
            tree: [
                [2, 3], [4, 5], [6, 7], [8, 9], 
                [10, 11], [12, 13], [14], [], [],
                [], [], [], [], []
            ],
            processStack: [1],
            currentNode: null,
            output: [],
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問10: 単方向リストの要素削除 ---
    // =================================================================================
    {
        id: '10',
        logicType: 'LINKED_LIST_DELETE',
        title: { ja: "サンプル問題 [科目B] 問10", en: "Sample Problem [Subject B] Q10" },
        description: {
            ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。\n\n手続 delNode は，単方向リストから，引数 pos で指定された位置の要素を削除する手続である。引数 pos は，リストの要素数以下の正の整数とする。リストの先頭の位置を1とする。\nクラス ListElement は，単方向リストの要素を表す。クラス ListElement のメンバ変数の説明を表に示す。ListElement 型の変数はクラス ListElement のインスタンスの参照を格納するものとする。大域変数 listHead には，リストの先頭要素の参照があらかじめ格納されている。",
            en: "Select the correct answer for the blank in the program from the answer choices. The procedure 'delNode' deletes an element at the position specified by the argument 'pos' from a singly linked list. The argument 'pos' is a positive integer less than or equal to the number of elements in the list. The position of the head of the list is 1. Class ListElement represents an element of the singly linked list. The member variables of the ListElement class are shown in the table. A variable of type ListElement stores a reference to an instance of the ListElement class. The global variable listHead stores a reference to the head element of the list."
        },
        programLines: {
            ja: [
                ' 1: 大域: ListElement: listHead // リストの先頭要素が格納されている',
                ' 2: ',
                ' 3: ○delNode(整数型: pos) /* posは, リストの要素数以下の正の整数 */',
                ' 4:   ListElement: prev',
                ' 5:   整数型: i',
                ' 6:   if (pos が 1 と等しい)',
                ' 7:     listHead ← listHead.next',
                ' 8:   else',
                ' 9:     prev ← listHead',
                '10:    /* posが2等しいときは繰返し処理を実行しない */',
                '11:    for (i を 2 から pos - 1 まで 1 ずつ増やす)',
                '12:      prev ← prev.next',
                '13:    endfor',
                '14:    prev.next ← [                   ]',
                '15:   endif',
            ],
            en: [
                ' 1: global: ListElement: listHead',
                ' 2: ',
                ' 3: ○procedure delNode(integer: pos)',
                ' 4:   ListElement: prev',
                ' 5:   integer: i',
                ' 6:   if (pos is equal to 1)',
                ' 7:     listHead ← listHead.next',
                ' 8:   else',
                ' 9:     prev ← listHead',
                '10:    /* loop is not executed if pos is 2 */',
                '11:    for (i from 2 to pos - 1)',
                '12:      prev ← prev.next',
                '13:    endfor',
                '14:    prev.next ← [                   ]',
                '15:   endif',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'listHead' },
                { label: 'イ', value: 'listHead.next' },
                { label: 'ウ', value: 'listHead.next.next' },
                { label: 'エ', value: 'prev' },
                { label: 'オ', value: 'prev.next' },
                { label: 'カ', value: 'prev.next.next' },
            ],
            en: [
                { label: 'A', value: 'listHead' },
                { label: 'B', value: 'listHead.next' },
                { label: 'C', value: 'listHead.next.next' },
                { label: 'D', value: 'prev' },
                { label: 'E', value: 'prev.next' },
                { label: 'F', value: 'prev.next.next' },
            ]
        },
        correctAnswer: 'prev.next.next',
        explanationText: {
            ja: "リスト構造では、要素を削除する際に、削除する要素の1つ前の要素と、1つ後ろの要素をつなぎ変える必要があります。\n\n・`pos = 1` の場合: 先頭要素を削除します。これは、`listHead` を現在の2番目の要素 (`listHead.next`) に更新することで実現できます。\n\n・`pos > 1` の場合: まずforループで、削除対象の1つ前の要素まで `prev` ポインタを進めます。例えば `pos = 3` (3番目を削除) の場合、ループを1回実行し、`prev` は2番目の要素を指します。\n次に、`prev` の `next` ポインタを、削除対象の `next` が指している要素、つまり `prev.next.next` に付け替えます。これにより、削除対象の要素がリストの連結から外れ、削除が完了します。\n\nしたがって、空欄には「カ」の `prev.next.next` が入ります。",
            en: "In a list structure, deleting an element requires re-linking the element before the one being deleted to the one after it.\n\n- If `pos = 1`: The head element is deleted. This is achieved by updating `listHead` to point to the current second element (`listHead.next`).\n\n- If `pos > 1`: The `for` loop advances the `prev` pointer to the element just before the target element. For example, if `pos = 3` (deleting the 3rd element), the loop runs once, making `prev` point to the 2nd element.\nNext, the `next` pointer of `prev` is re-linked to the element that the target's `next` was pointing to, which is `prev.next.next`. This removes the target element from the list's linkage.\n\nTherefore, the correct answer for the blank is 'F', `prev.next.next`."
        },
        initialVariables: {
            pos: 3, // 3番目の要素'C'を削除するケース
            i: null,
            prev: null,
            // listData と listHead はロジック側で初期化
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問11: ビンソート ---
    // =================================================================================
    {
        id: '11',
        logicType: 'BIN_SORT',
        title: { ja: "サンプル問題 [科目B] 問11", en: "Sample Problem [Subject B] Q11" },
        description: {
            ja: "次の記述中の□に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n関数 binSort を binSort(□) として呼び出すと，戻り値の配列には未定義の要素は含まれておらず，値は昇順に並んでいる。",
            en: "Select the correct answer for the blank from the answer choices. Array indices start from 1. When the function binSort is called as binSort([ ]), the returned array contains no undefined elements and the values are sorted in ascending order."
        },
        programLines: {
            ja: [
                '1: ○整数型の配列: binSort(整数型の配列: data)',
                '2:   整数型: n ← dataの要素数',
                '3:   整数型の配列: bins ← {n個の未定義の値}',
                '4:   整数型: i',
                '5:   for (i を 1 から n まで 1 ずつ増やす)',
                '6:     bins[data[i]] ← data[i]',
                '7:   endfor',
                '8:   return bins',
            ],
            en: [
                '1: ○function binSort(array data: integer) -> array integer',
                '2:   integer: n ← length of data',
                '3:   array integer: bins ← {n undefined values}',
                '4:   integer: i',
                '5:   for (i from 1 to n)',
                '6:     bins[data[i]] ← data[i]',
                '7:   endfor',
                '8:   return bins',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '{2, 6, 3, 1, 4, 5}' },
                { label: 'イ', value: '{3, 1, 4, 4, 5, 2}' },
                { label: 'ウ', value: '{4, 2, 1, 5, 6, 2}' },
                { label: 'エ', value: '{5, 3, 4, 3, 2, 6}' },
            ],
            en: [
                { label: 'A', value: '{2, 6, 3, 1, 4, 5}' },
                { label: 'B', value: '{3, 1, 4, 4, 5, 2}' },
                { label: 'C', value: '{4, 2, 1, 5, 6, 2}' },
                { label: 'D', value: '{5, 3, 4, 3, 2, 6}' },
            ]
        },
        correctAnswer: '{2, 6, 3, 1, 4, 5}',
        explanationText: {
            ja: "このプログラムは、値がnである要素をn番目に格納することで昇順の整列を行う「ビンソート」です。\nこの方法では、格納位置が値によって一意に決まるため、同じ値が複数あると、同じ箇所に重複して代入されてしまい、不足している数字を添字とする要素が未定義のままになります。\n例えば、選択肢「イ」の {3, 1, 4, 4, 5, 2} を引数にすると、`bins[4]` に4が代入された後、再び4が代入される（上書き）だけで、`bins[6]` に対応する値6がないため、`bins[6]` は未定義となります。\n\nこのように、戻り値の配列に未定義の要素が含まれるのは、引数に値の重複がある場合です。選択肢を見ると、「イ」は\"4\"、「ウ」は\"2\"、「エ」は\"3\"が重複しています。\nしたがって、未定義の要素が含まれないのは、値の重複がない「ア」だけです。",
            en: "This program performs a 'bin sort' by placing the element with value 'n' into the nth position to sort in ascending order. In this method, the storage location is uniquely determined by the value. If there are duplicate values, they will be assigned to the same location, overwriting each other, and the elements corresponding to missing numbers will remain undefined. For example, with input {3, 1, 4, 4, 5, 2}, 4 is written to bins[4], and then overwritten by another 4. Since there is no value 6, bins[6] remains undefined.\n\nThe returned array will contain undefined elements if the input argument has duplicate values. Looking at the choices, 'B' has duplicate '4', 'C' has duplicate '2', and 'D' has duplicate '3'. Therefore, only 'A', which has no duplicate values, will result in an array with no undefined elements."
        },
        initialVariables: {
            data: null,
            n: null,
            bins: null,
            i: null,
        },
        traceOptions: {
            presets_array: [
                { label: 'ア: {2, 6, 3, 1, 4, 5}', value: { data: [2, 6, 3, 1, 4, 5] } },
                { label: 'イ: {3, 1, 4, 4, 5, 2}', value: { data: [3, 1, 4, 4, 5, 2] } },
                { label: 'ウ: {4, 2, 1, 5, 6, 2}', value: { data: [4, 2, 1, 5, 6, 2] } },
                { label: 'エ: {5, 3, 4, 3, 2, 6}', value: { data: [5, 3, 4, 3, 2, 6] } },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問12: 配列の類似度計算 ---
    // =================================================================================
    {
        id: '12',
        logicType: 'SIMILARITY_RATIO',
        title: { ja: "サンプル問題 [科目B] 問12", en: "Sample Problem [Subject B] Q12" },
        description: {
            ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n関数 simRatio は，引数として与えられた要素数1以上の二つの文字列の配列 s1 と s2 を比較し，要素数が等しい場合は，配列の並びがどの程度似ているかの指標として，(要素番号が同じ要素の文字列同士が一致する要素の組みの個数 ÷ s1の要素数)を実数型で返す。例えば，配列の全ての要素が一致する場合の戻り値は1，いずれの要素も一致しない場合の戻り値は0である。\n\nなお，二つの配列の要素数が等しくない場合は，-1を返す。関数 simRatio に与える s1，s2 及び戻り値の例を表に示す。プログラムでは，配列の領域外を参照してはならないものとする。",
            en: "Select the correct answer for the blank in the program. Array indices start from 1. The function simRatio compares two character arrays, s1 and s2, of one or more elements. If the element counts are equal, it returns a similarity index as a real number: (number of matching character pairs at the same index) / (number of elements in s1). For example, if all elements match, the return value is 1, and if no elements match, it is 0. If the element counts are not equal, it returns -1. The table shows examples of s1, s2, and the return values. The program must not access outside the array bounds."
        },
        programLines: {
            ja: [
                ' 1: ○実数型: simRatio(文字列型の配列: s1, 文字列型の配列: s2)',
                ' 2:   整数型: i, cnt ← 0',
                ' 3:   if (s1の要素数 ≠ s2の要素数)',
                ' 4:     return -1',
                ' 5:   endif',
                ' 6:   for (i を 1 から s1の要素数 まで 1 ずつ増やす)',
                ' 7:     if (□)',
                ' 8:       cnt ← cnt + 1',
                ' 9:     endif',
                '10:   endfor',
                '11:   return cnt ÷ s1の要素数 /* 実数として計算する */',
            ],
            en: [
                ' 1: ○function simRatio(array s1: string, array s2: string) -> real',
                ' 2:   integer: i, cnt ← 0',
                ' 3:   if (length of s1 ≠ length of s2)',
                ' 4:     return -1',
                ' 5:   endif',
                ' 6:   for (i from 1 to length of s1)',
                ' 7:     if ([ ])',
                ' 8:       cnt ← cnt + 1',
                ' 9:     endif',
                '10:   endfor',
                '11:   return cnt / length of s1 /* calculate as real */',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 's1[i] ≠ s2[cnt]' },
                { label: 'イ', value: 's1[i] ≠ s2[i]' },
                { label: 'ウ', value: 's1[i] = s2[cnt]' },
                { label: 'エ', value: 's1[i] = s2[i]' },
            ],
            en: [
                { label: 'A', value: 's1[i] ≠ s2[cnt]' },
                { label: 'B', value: 's1[i] ≠ s2[i]' },
                { label: 'C', value: 's1[i] = s2[cnt]' },
                { label: 'D', value: 's1[i] = s2[i]' },
            ]
        },
        correctAnswer: 's1[i] = s2[i]',
        explanationText: {
            ja: "問題文において、このプログラムの戻り値は「要素番号が同じ要素の文字列同士が一致する要素の組みの個数 ÷ s1の要素数」と説明されています。プログラムの最後で `cnt ÷ s1の要素数` を戻り値としていることから、cnt は問題文でいう「要素番号が同じ要素の文字列同士が一致する要素の組みの個数」を格納する変数であることがわかります。\n\nif文では条件式がtrueのときに cnt をインクリメント (+1) しているので、空欄には「引数 s1 と s2 の同じ位置の文字が等しい」という意味の式を入れることになります。同じ要素番号の文字を比較したいのですから、s1[i] と比較すべきは s2[i] となります。\n\nしたがって s1[i] = s2[i] の式が当てはまります。",
            en: "The problem description states that the return value is '(number of matching character pairs at the same index) / (number of elements in s1)'. Since the program returns `cnt / length of s1`, 'cnt' must be the variable storing the count of matching pairs at the same index.\n\nThe if statement increments 'cnt' when the condition is true. Therefore, the blank should contain an expression meaning 'the characters at the same position in s1 and s2 are equal'. To compare characters at the same index, s1[i] should be compared with s2[i].\n\nThus, the expression s1[i] = s2[i] is correct."
        },
        initialVariables: {
            s1: ["a", "p", "p", "l", "e"], // 表の2番目の例
            s2: ["a", "p", "p", "r", "l"],
            i: null,
            cnt: null,
            result: null,
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問13: 2分探索法 (バグあり) ---
    // =================================================================================
    {
        id: '13',
        logicType: 'BINARY_SEARCH',
        title: { ja: "サンプル問題 [科目B] 問13", en: "Sample Problem [Subject B] Q13" },
        description: {
            ja: "次の記述中の□に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n関数 search は，引数 data で指定された配列に，引数 target で指定された値が含まれていればその要素番号を返し，含まれていなければ-1を返す。data は昇順に整列されており，値に重複はない。\n\n関数 search には不具合がある。例えば，data の□場合は，無限ループになる。",
            en: "Select the correct answer for the blank from the answer choices. Array indices start from 1.\n\nThe function 'search' returns the index of the value specified by 'target' in the array 'data', or -1 if not found. 'data' is sorted in ascending order with no duplicate values.\n\nThere is a bug in the 'search' function. For example, in the case of [ ], the function enters an infinite loop."
        },
        programLines: {
            ja: [
                ' 1: ○整数型: search(整数型の配列: data, 整数型: target)',
                ' 2:   整数型: low, high, middle',
                ' 3: ',
                ' 4:   low ← 1',
                ' 5:   high ← dataの要素数',
                ' 6: ',
                ' 7:   while (low <= high)',
                ' 8:     middle ← (low + high) ÷ 2 の商',
                ' 9:     if (data[middle] < target)',
                '10:       low ← middle',
                '11:     elseif (data[middle] > target)',
                '12:       high ← middle',
                '13:     else',
                '14:       return middle',
                '15:     endif',
                '16:   endwhile',
                '17: ',
                '18:   return -1',
            ],
            en: [
                ' 1: ○function search(array data: integer, integer: target) -> integer',
                ' 2:   integer: low, high, middle',
                ' 3: ',
                ' 4:   low ← 1',
                ' 5:   high ← length of data',
                ' 6: ',
                ' 7:   while (low <= high)',
                ' 8:     middle ← floor((low + high) / 2)',
                ' 9:     if (data[middle] < target)',
                '10:       low ← middle',
                '11:     elseif (data[middle] > target)',
                '12:       high ← middle',
                '13:     else',
                '14:       return middle',
                '15:     endif',
                '16:   endwhile',
                '17: ',
                '18:   return -1',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '要素数が1で, target がその要素の値と等しい' },
                { label: 'イ', value: '要素数が2で, target が data の先頭要素の値と等しい' },
                { label: 'ウ', value: '要素数が2で, target が data の末尾要素の値と等しい' },
                { label: 'エ', value: '要素に -1が含まれている' },
            ],
            en: [
                { label: 'A', value: 'Number of elements is 1, and target equals its value' },
                { label: 'B', value: 'Number of elements is 2, and target equals the first element' },
                { label: 'C', value: 'Number of elements is 2, and target equals the last element' },
                { label: 'D', value: 'The element -1 is included' },
            ]
        },
        correctAnswer: '要素数が2で, target が data の末尾要素の値と等しい',
        explanationText: {
            ja: "2分探索法は、探索範囲を半分に絞り込むことを繰り返して目的のデータを探すアルゴリズムです。正しく実装するには、`low ← middle + 1` や `high ← middle - 1` のように、探索済の中央値を除外する必要があります。\n\n本問のプログラムでは、`low ← middle` や `high ← middle` となっているため、探索範囲が狭まらないケースがあり、無限ループが発生します。\n\n「ウ」のケースを考えます。`data = {10, 20}`、`target = 20` とすると、\n1. `low=1`, `high=2` でループ開始。\n2. `middle = (1+2)÷2 = 1`。\n3. `data[1]`(10) < `target`(20) なので、`low ← middle` が実行され `low` は `1` のまま。\n\n以降、`low=1, high=2` の状態が延々と繰り返され、無限ループになります。",
            en: "Binary search is an algorithm that repeatedly divides the search interval in half to find the target data. For correct implementation, it's necessary to exclude the checked middle value, such as `low = middle + 1` or `high = middle - 1`.\n\nIn this program, the assignments are `low = middle` and `high = middle`, which can fail to narrow the search range, causing an infinite loop.\n\nConsider case 'C'. If `data = {10, 20}` and `target = 20`:\n1. The loop starts with `low=1`, `high=2`.\n2. `middle = floor((1+2)/2) = 1`.\n3. Since `data[1]`(10) < `target`(20), `low = middle` is executed, and `low` remains `1`.\n\nThe state `low=1, high=2` repeats indefinitely, resulting in an infinite loop."
        },
        // ✅【修正点】ユーザーが選択するまで変数をnullに設定
        initialVariables: {
            data: null,
            target: null,
            low: null,
            high: null,
            middle: null,
            result: null,
            initialized: false, // トレースロジックで使う初期化フラグ
        },
        // ✅【修正点】ユーザーがトレースするデータを選択できるようにプリセットを追加
        traceOptions: {
            presets_array: [
                { label: 'ア: data:{10}, target:10', value: { data: [10], target: 10 } },
                { label: 'イ: data:{10,20}, target:10', value: { data: [10, 20], target: 10 } },
                { label: 'ウ: data:{10,20}, target:20', value: { data: [10, 20], target: 20 } },
                { label: 'エ: data:{10,20,30,40}, target:30', value: { data: [10, 20, 30, 40], target: 30 } }
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問14: 5数要約 ---
    // =================================================================================
    {
        id: '14',
        logicType: 'FIVE_NUMBER_SUMMARY',
        title: { ja: "サンプル問題 [科目B] 問14", en: "Sample Problem [Subject B] Q14" },
        description: {
            ja: "次の記述中の□に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n要素数が1以上で，昇順に整列済みの配列を基に，配列を特徴づける五つの値を返すプログラムである。\n\n関数 summarize を summarize({0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1}) として呼び出すと，戻り値は□である。",
            en: "Select the correct answer for the blank. Array indices start at 1. This program returns five characteristic values based on a sorted array with one or more elements. When summarize({0.1, 0.2, ... , 1}) is called, the return value is [ ]."
        },
        programLines: {
            ja: [
                ' 1: ○実数型: findRank(実数型の配列: sortedData, 実数型: p)',
                ' 2:   整数型: i',
                ' 3:   i ← (sortedDataの要素数 - 1) × p の小数点以下を切り上げた値',
                ' 4:   return sortedData[i + 1]',
                ' 5: ',
                ' 6: ○実数型の配列: summarize(実数型の配列: sortedData)',
                ' 7:   実数型の配列: rankData ← {}',
                ' 8:   実数型の配列: p ← {0, 0.25, 0.5, 0.75, 1}',
                ' 9:   整数型: i',
                '10:   for (i を 1 から pの要素数 まで 1 ずつ増やす)',
                '11:     rankDataの末尾に findRank(sortedData, p[i])の戻り値 を追加する',
                '12:   endfor',
                '13:   return rankData',
            ],
            en: [
                ' 1: ○function findRank(array sortedData: real, p: real) -> real',
                ' 2:   integer: i',
                ' 3:   i ← ceil((length of sortedData - 1) * p)',
                ' 4:   return sortedData[i + 1]',
                ' 5: ',
                ' 6: ○function summarize(array sortedData: real) -> array real',
                ' 7:   array real: rankData ← {}',
                ' 8:   array real: p ← {0, 0.25, 0.5, 0.75, 1}',
                ' 9:   integer: i',
                '10:   for (i from 1 to length of p)',
                '11:     append result of findRank(sortedData, p[i]) to rankData',
                '12:   endfor',
                '13:   return rankData',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '{0.1, 0.3, 0.5, 0.7, 1}' },
                { label: 'イ', value: '{0.1, 0.3, 0.5, 0.8, 1}' },
                { label: 'ウ', value: '{0.1, 0.3, 0.6, 0.7, 1}' },
                { label: 'エ', value: '{0.1, 0.3, 0.6, 0.8, 1}' },
                { label: 'オ', value: '{0.1, 0.4, 0.5, 0.7, 1}' },
                { label: 'カ', value: '{0.1, 0.4, 0.5, 0.8, 1}' },
                { label: 'キ', value: '{0.1, 0.4, 0.6, 0.7, 1}' },
                { label: 'ク', value: '{0.1, 0.4, 0.6, 0.8, 1}' },
            ],
            en: [ /* ... English options ... */ ]
        },
        correctAnswer: '{0.1, 0.4, 0.6, 0.8, 1}',
        explanationText: {
            ja: "関数 summarize では、for文を使って配列 p の要素ひとつずつに対して、サブルーチンである関数 findRank を呼出し、その結果を戻り値の配列である rankData に追加しています。\n\n配列 p は{0, 0.25, 0.5, 0.75, 1}なので、rankData には、以下の5つの結果が格納されることになります。ここで、sortedDataの要素数は10なので、関数 findRank 内で使われている\"sortedDataの要素数 - 1\"は9となります。\n\nfindRank(sortedData, 0)\ni ← (0 × 9) = 0 を切り上げた値 ⇒ 0\nreturn sortedData[1] = 0.1\n\nfindRank(sortedData, 0.25)\ni ← (0.25 × 9) = 2.25 を切り上げた値 ⇒ 3\nreturn sortedData[4] = 0.4\n\nfindRank(sortedData, 0.5)\ni ← (0.5 × 9) = 4.5 を切り上げた値 ⇒ 5\nreturn sortedData[6] = 0.6\n\nfindRank(sortedData, 0.75)\ni ← (0.75 × 9) = 6.75 を切り上げた値 ⇒ 7\nreturn sortedData[8] = 0.8\n\nfindRank(sortedData, 1)\ni ← (1 × 9) = 9 を切り上げた値 ⇒ 9\nreturn sortedData[10] = 1\n\n戻り値 rankData の内容は{0.1, 0.4, 0.6, 0.8, 1}になっています。したがって「ク」が正解です。",
            en: "In the 'summarize' function, a for loop iterates through each element of the array 'p', calling the 'findRank' subroutine for each. The result is appended to the 'rankData' array.\n\nSince 'p' is {0, 0.25, 0.5, 0.75, 1}, five results are stored in 'rankData'. With 'sortedData' having 10 elements, 'length of sortedData - 1' becomes 9.\n- findRank(sortedData, 0): i ← ceil(0*9)=0. returns sortedData[1]=0.1.\n- findRank(sortedData, 0.25): i ← ceil(0.25*9)=3. returns sortedData[4]=0.4.\n- findRank(sortedData, 0.5): i ← ceil(0.5*9)=5. returns sortedData[6]=0.6.\n- findRank(sortedData, 0.75): i ← ceil(0.75*9)=7. returns sortedData[8]=0.8.\n- findRank(sortedData, 1): i ← ceil(1*9)=9. returns sortedData[10]=1.\n\nThe final 'rankData' is {0.1, 0.4, 0.6, 0.8, 1}, making 'ク' the correct answer."
        },
        initialVariables: {
            sortedData: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
            rankData: [],
            p_values: [0, 0.25, 0.5, 0.75, 1],
            i: null, // summarize関数のループカウンタ
            current_p: null, // findRankに渡されるpの値
            findRank_i: null, // findRank内のi
            callStack: [], // 呼び出しスタック
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問15: ミニマックス法 ---
    // =================================================================================
    {
        id: '15',
        logicType: 'MINIMAX',
        title: { ja: "サンプル問題 [科目B] 問15", en: "Sample Problem [Subject B] Q15" },
        description: {
            ja: "次の記述中の a と b に入れる正しい答えの組合せを，解答群の中から選べ。\n\n三目並べにおいて自分が勝利する可能性が最も高い手を決定する。次の手順で，ゲームの状態遷移を木構造として表現し，根以外の各節の評価値を求める。その結果，根の子の中で最も評価値が高い手を，最も勝利する可能性が高い手とする。自分が選択した手を〇で表し，相手が選択した手を×で表す。\n\n〔手順〕\n(1) 現在の盤面の状態を根とし，勝敗がつくか，引き分けとなるまでの考えられる全ての手を木構造で表現する。\n(2) 葉の状態を次のように評価する。\n    ① 自分が勝ちの場合は10\n    ② 自分が負けの場合は－10\n    ③ 引き分けの場合は0\n(3) 葉以外の節の評価値は，その節の全ての子の評価値を基に決定する。\n    ① 自分の手番の節である場合，子の評価値で最大の評価値を節の評価値とする。\n    ② 相手の手番の節である場合，子の評価値で最小の評価値を節の評価値とする。\n\nゲームが図の最上部にある根の状態のとき，自分が選択できる手は三つある。そのうちAが指す子の評価値は a であり，Bが指す子の評価値は b である。",
            en: "Select the correct combination for a and b. In Tic-Tac-Toe, determine the move with the highest probability of winning. Represent the game's state transitions as a tree and find the evaluation value for each node other than the root. The move with the highest evaluation value among the children of the root is considered the best move. Your moves are O, opponent's are X. [Procedures] (1) ... (2) Leaf nodes are evaluated: win=10, lose=-10, draw=0. (3) Non-leaf nodes: For your turn, take the max of children's values. For the opponent's turn, take the min. When the game is at the root state, what are the evaluation values for the children pointed to by A (value a) and B (value b)?"
        },
        programLines: { // この問題にはプログラムがないため、手順を記載
            ja: [
                '【評価手順のトレース】',
                '1. Aが指す子の評価値を計算する',
                '  - さらにその子(孫)の評価値を確認 (0 と 10)',
                '  - 「相手の手番」なので、最小値を選択 → 0',
                '2. Bが指す子の評価値を計算する',
                '  - さらにその子(孫)の評価値を確認 (-10 と 0)',
                '  - 「相手の手番」なので、最小値を選択 → -10',
                '3. 計算完了'
            ],
            en: []
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'a:0, b:-10' },
                { label: 'イ', value: 'a:0, b:0' },
                { label: 'ウ', value: 'a:10, b:-10' },
                { label: 'エ', value: 'a:10, b:0' },
            ],
            en: [
                { label: 'A', value: 'a:0, b:-10' },
                { label: 'B', value: 'a:0, b:0' },
                { label: 'C', value: 'a:10, b:-10' },
                { label: 'D', value: 'a:10, b:0' },
            ]
        },
        correctAnswer: 'a:0, b:-10',
        explanationText: {
            ja: "設問の手順に従って、葉から節に遡る形で評価値を決めていきます。\n\n【Aが指す子の評価値】\n葉の一つ上の節は、一つしか子を持たないので葉の評価値そのままが節の評価値となります(左側の節は0、右側の節は10)。その一つ上の節は、相手の手番なので、評価値0と10を比較して小さいほうの0が評価値となります。\n\n【Bが指す子の評価値】\n葉の一つ上の右側の節は、一つしか子を持たないので葉の評価値そのままが節の評価値となります(左側の節は-10、右側の節は0)。その一つ上の節は、相手の手番なので、評価値-10と0とを比較して小さいほうの-10が評価値となります。\n\nしたがって、A=0、B=-10の組合せが適切です。",
            en: "Following the instructions, we determine the evaluation values by working up from the leaves.\n\n[Evaluation of child A]\nThe nodes directly above the leaves take on the leaf's value (0 on the left, 10 on the right). The node above them is an opponent's turn, so we take the minimum of 0 and 10, which is 0.\n\n[Evaluation of child B]\nSimilarly, the nodes above the leaves are -10 and 0. The node above them is an opponent's turn, so we take the minimum of -10 and 0, which is -10.\n\nTherefore, the correct combination is A=0, B=-10."
        },
        initialVariables: {
            "a (Aの子の評価値)": null,
            "b (Bの子の評価値)": null,
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問16: UTF-8 エンコード ---
    // =================================================================================
    {
        id: '16',
        logicType: 'UTF8_ENCODE',
        title: { ja: "サンプル問題 [科目B] 問16", en: "Sample Problem [Subject B] Q16" },
        description: {
            ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。二つの□には，同じ答えが入る。ここで，配列の要素番号は1から始まる。\n\nUnicodeの符号位置を，UTF-8の符号に変換するプログラムである。本問で数値の後ろに\"(16)\"と記載した場合は，その数値が16進数であることを表す。\nUnicodeの各文字には，符号位置と呼ばれる整数値が与えられている。UTF-8は，Unicodeの文字を符号化する方式の一つであり，符号位置が 800(16) 以上 FFFF(16) 以下の文字は，次のように3バイトの値に符号化する。\n3バイトの長さのビットパターンを 1110xxxx 10xxxxxx 10xxxxxx とする。ビットパターンの下線の付いた\"x\"の箇所に，符号位置を2進数で表した値を右詰めで格納し，余った\"x\"の箇所に，0を格納する。この3バイトの値がUTF-8の符号である。\n例えば，ひらがなの\"あ\"の符号位置である 3042(16) を2進数で表すと 11000001000010 である。これを，上に示したビットパターンの\"x\"の箇所に右詰めで格納すると，1110xx11 10000001 10000010 となる。余った二つの\"x\"の箇所に0を格納すると，\"あ\"のUTF-8の符号 11100011 10000001 10000010 が得られる。\n\n関数 encode は，引数で渡されたUnicodeの符号位置をUTF-8の符号に変換し，先頭から順に1バイトずつ要素に格納した整数型の配列を返す。encode には，引数として，800(16) 以上 FFFF(16) 以下の整数値だけが渡されるものとする。",
            en: "Select the correct answer for the blanks. Both blanks take the same answer. Array indices start at 1.\n\nThis program converts a Unicode code point to its UTF-8 representation..."
        },
        programLines: {
            ja: [
                ' 1: ○整数型の配列: encode(整数型: codePoint)',
                ' 2: /* utf8Bytesの初期値は, ビットパターンの “x” を全て0に置き換え,',
                ' 3:    8桁ごとに区切って, それぞれを2進数とみなしたときの値 */',
                ' 4: 整数型の配列: utf8Bytes ← {224, 128, 128}',
                ' 5: 整数型: cp ← codePoint',
                ' 6: 整数型: i',
                ' 7: for (i を utf8Bytesの要素数 から 1 まで 1 ずつ減らす)',
                ' 8:   utf8Bytes[i] ← utf8Bytes[i] + (cp ÷ □ の余り)',
                ' 9:   cp ← cp ÷ □ の商',
                '10: endfor',
                '11: return utf8Bytes'
            ],
            en: [ /* English lines */ ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '((4-i) × 2)' },
                { label: 'イ', value: '(2の (4-i)乗)' },
                { label: 'ウ', value: '(2の i乗)' },
                { label: 'エ', value: '(i × 2)' },
                { label: 'オ', value: '2' },
                { label: 'カ', value: '6' },
                { label: 'キ', value: '16' },
                { label: 'ク', value: '64' },
                { label: 'ケ', value: '256' },
            ],
            en: [ /* English options */ ]
        },
        correctAnswer: '64',
        explanationText: {
            ja: "符号位置は800(16)以上FFFF(16)とあります。\n800(16) = 1000 0000 0000(2)\nFFFF(16) = 1111 1111 1111 1111(2)\nですから、引数 codePoint のビット長は12ビット以上16ビット以下ということになります。また、変数 utf8Bytes の値はそれぞれ\nutf8Bytes[1] = 224(10) = 11100000(2)\nutf8Bytes[2] = 128(10) = 10000000(2)\nutf8Bytes[3] = 128(10) = 10000000(2)\nとなっていて、下線の部分に codePoint から切り出したビット列をコピーすることになります。\n\nfor文ではループ変数 i をデクリメント(－1)しながら3回繰返しますが、各回で行うべき処理は以下のとおりです。\n1. 1回目 … utf8Bytes[3] に codePoint の下位6ビットをコピー\n2. 2回目 … utf8Bytes[2] に codePoint の下位7ビット目から12ビット目までの6ビットをコピー\n3. 3回目 … utf8Bytes[1] に codePoint の残りの部分をコピー\n\n変数 cp から下位6ビットを取得する方法についてですが、10進数の整数で下位3桁を取得したいときに「10³ = 1,000」で割った余りを求めるのと同じで、2進数で下位6桁を取得するときには「2⁶ = 64」で割ることになります。今回は下位6ビットを取得したいので「2⁶ = 64」を使うのが適切です。したがって「ク」が正解です。",
            en: "The code point is between 800(16) and FFFF(16)... To get the lower 6 bits of a binary number, we need to divide by 2^6 = 64. Thus 'ク' is the correct answer."
        },
        initialVariables: {
            codePoint: 64, // "あ" のコードポイント 3042(16)
            utf8Bytes: null,
            cp: null,
            i: null
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問17: セキュリティ（責任分界点） ---
    // =================================================================================
    {
        id: '17',
        logicType: 'STATIC_QA', // トレース機能がないことを示す
        title: { ja: "サンプル問題 [科目B] 問17", en: "Sample Problem [Subject B] Q17" },
        description: {
            ja: "製造業のA社では，ECサイト（以下，A社のECサイトをAサイトという）を使用し，個人向けの製品販売を行っている。Aサイトは，A社の製品やサービスが検索可能で，ログイン機能を有しており，あらかじめAサイトに利用登録した個人（以下，会員という）の氏名やメールアドレスといった情報（以下，会員情報という）を管理している。Aサイトは，B社のPaaSで稼働しており，PaaS上のDBMSとアプリケーションサーバを利用している。\nA社は，Aサイトの開発，運用をC社に委託している。A社とC社との間の委託契約では，Webアプリケーションプログラムの脆弱性対策は，C社が実施するとしている。\n最近，A社の同業他社が運営しているWebサイトで脆弱性が悪用され，個人情報が漏えいするという事件が発生した。そこでA社は，セキュリティ診断サービスを行っているD社に，Aサイトの脆弱性診断を依頼した。脆弱性診断の結果，対策が必要なセキュリティ上の脆弱性が複数指摘された。図1にD社からの指摘事項を示す。\n\n項番1 Aサイトで利用しているアプリケーションサーバのOSに既知の脆弱性があり，脆弱性を悪用した攻撃を受けるおそれがある。\n項番2 Aサイトにクロスサイトスクリプティングの脆弱性があり，会員情報を不正に取得されるおそれがある。\n項番3 Aサイトで利用しているDBMSに既知の脆弱性があり，脆弱性を悪用した攻撃を受けるおそれがある。\n\n【設問】図1中の各項番それぞれに対処する組織の適切な組合せを，解答群の中から選べ。",
            en: "Company A, a manufacturer, operates an e-commerce site (Site A) for direct-to-consumer sales..."
        },
        programLines: { ja: [], en: [] }, // プログラムはないので空
        answerOptions: {
            ja: [
                { label: 'ア', value: '項番1:A社, 項番2:A社, 項番3:A社' },
                { label: 'イ', value: '項番1:A社, 項番2:A社, 項番3:C社' },
                { label: 'ウ', value: '項番1:A社, 項番2:B社, 項番3:B社' },
                { label: 'エ', value: '項番1:B社, 項番2:B社, 項番3:B社' },
                { label: 'オ', value: '項番1:B社, 項番2:B社, 項番3:C社' },
                { label: 'カ', value: '項番1:B社, 項番2:C社, 項番3:B社' },
                { label: 'キ', value: '項番1:B社, 項番2:C社, 項番3:C社' },
                { label: 'ク', value: '項番1:C社, 項番2:B社, 項番3:B社' },
                { label: 'ケ', value: '項番1:C社, 項番2:B社, 項番3:C社' },
                { label: 'コ', value: '項番1:C社, 項番2:C社, 項番3:B社' },
            ],
            en: [ /* English options */ ]
        },
        correctAnswer: '項番1:B社, 項番2:C社, 項番3:B社',
        explanationText: {
            ja: "・項番1（APサーバOSの脆弱性）: アプリケーションサーバのOSは、B社が提供するPaaSに含まれます。PaaSのサービスモデルでは、OSやミドルウェアの管理責任はサービス提供者であるB社が負います。\n\n・項番2（クロスサイトスクリプティング）: これはWebアプリケーション自体の脆弱性です。問題文に「Webアプリケーションプログラムの脆弱性対策は，C社が実施する」と明記されているため、責任はC社にあります。\n\n・項番3（DBMSの脆弱性）: DBMSもB社が提供するPaaSに含まれるミドルウェアです。したがって、管理責任はB社が負います。\n\n以上から、項番1がB社、項番2がC社、項番3がB社となる「カ」が正解です。",
            en: "Item 1 (AP Server OS): Responsibility of PaaS provider B. Item 2 (XSS): Responsibility of application developer C as stated. Item 3 (DBMS): Responsibility of PaaS provider B. Therefore, the correct combination is B, C, B, which corresponds to 'カ'."
        },
        initialVariables: {}, // トレース変数は不要
        traceLogic: [],
    },
    // =================================================================================
    // --- 問18: セキュリティ（BYODのリスク） ---
    // =================================================================================
    {
        id: '18',
        logicType: 'STATIC_QA', // トレース機能がないことを示す
        title: { ja: "サンプル問題 [科目B] 問18", en: "Sample Problem [Subject B] Q18" },
        description: {
            ja: "A社はIT開発を行っている従業員1,000名の企業である。総務部50名，営業部50名で，ほかは開発部に所属している。開発部員の9割は客先に常駐している。現在，A社におけるPCの利用状況は図1のとおりである。\n\n【図1 A社におけるPCの利用状況】\n1 A社のPC\n・総務部員，営業部員及びA社オフィスに勤務する開発部員には，会社が用意したPC(以下，A社PCという)を一人1台ずつ貸与している。\n・客先常駐開発部員には，A社PCを貸与していないが，代わりに客先常駐開発部員がA社オフィスに出社したときに利用するための共用PCを用意している。\n2 客先常駐開発部員の業務システム利用\n・客先常駐開発部員が休暇申請，経費精算などで業務システムを利用するためには共用PCを使う必要がある。\n3 A社のVPN利用\n・A社には，VPNサーバが設置されており，営業部員が出張時にA社PCからインターネット経由で社内ネットワークにVPN接続し，業務システムを利用できるようになっている。規則で，VPN接続にはA社PCを利用すると定められている。\n\nA社では，客先常駐開発部員が業務システムを使うためだけにA社オフィスに出社するのは非効率的であると考え，客先常駐開発部員に対して個人所有PCの業務用利用(BYOD)とVPN接続の許可を検討することにした。\n\n【設問】\n客先常駐開発部員に，個人所有PCからのVPN接続を許可した場合に，増加する又は新たに生じると考えられるリスクを二つ挙げた組合せは，次のうちどれか。解答群のうち，最も適切なものを選べ。\n\n(一) VPN接続が増加し，可用性が損なわれるリスク\n(二) 客先常駐開発部員がA社PCを紛失するリスク\n(三) 客先常駐開発部員がフィッシングメールのURLをクリックして個人PCがマルウェアに感染するリスク\n(四) 総務部員が個人所有PCをVPN接続するリスク\n(五) マルウェアに感染した個人所有PCが社内ネットワークにVPN接続され，マルウェアが社内ネットワークに拡散するリスク",
            en: "Company A, an IT development firm with 1,000 employees, is considering allowing off-site developers to use personal PCs (BYOD) with VPN access..."
        },
        programLines: { ja: [], en: [] }, // プログラムはないので空
        answerOptions: {
            ja: [
                { label: 'ア', value: '(一), (二)' },
                { label: 'イ', value: '(一), (三)' },
                { label: 'ウ', value: '(一), (四)' },
                { label: 'エ', value: '(一), (五)' },
                { label: 'オ', value: '(二), (三)' },
                { label: 'カ', value: '(二), (四)' },
                { label: 'キ', value: '(二), (五)' },
                { label: 'ク', value: '(三), (四)' },
                { label: 'ケ', value: '(三), (五)' },
                { label: 'コ', value: '(四), (五)' },
            ],
            en: [ /* English options */ ]
        },
        correctAnswer: '(一), (五)',
        explanationText: {
            ja: "（一）VPN接続が増加し，可用性が損なわれるリスク\n正しい。最大で客先に常駐する「900人×9割＝810人」の客先常駐開発部員が個人所有PCでVPN接続をすることになるので、これまでよりA社オフィスのインターネット回線やVPN装置の負荷が増すことになります。負荷増大に伴う通信遅延や応答速度の低下によって、可用性が損なわれるリスクがあります。\n\n（二）“客先常駐開発部員がA社PCを紛失するリスク”\n誤り。客先常駐開発部員にはA社PCが貸与されないので、A社PCを紛失するリスクはありません。\n\n（三）“客先常駐開発部員がフィッシングメールのURLをクリックして個人PCがマルウェアに感染するリスク”\n誤り。フィッシングメールによる攻撃を受けるリスクは、BYOD導入前と後で変わりません。\n\n（四）“総務部員が個人所有PCをVPN接続するリスク”\n誤り。個人所有PCの業務利用は、客先常駐開発部員だけに認められます。VPN接続の際には認証が行われるので、総務部員が個人所有PCでVPN接続するリスクはありません。\n\n（五）“マルウェアに感染した個人所有PCが社内ネットワークにVPN接続され，マルウェアが社内ネットワークに拡散するリスク”\n正しい。新たに個人所有PCが社内ネットワークと通信を行うことになるので、その通信を介してマルウェアが社内ネットワークに侵入するリスクがあります。\n\nしたがって適切な組合せは「エ」です。",
            en: "Risk (I) is valid as VPN usage will increase significantly, straining network resources. Risk (V) is also valid as personal, potentially insecure PCs will now connect to the internal network, introducing a new vector for malware propagation. The other risks are not newly introduced or increased by this change. Therefore, the correct combination is 'エ'."
        },
        initialVariables: {}, // トレース変数は不要
        traceLogic: [],
    },
    // =================================================================================
    // --- 問19: 職務の分離と最小権限 ---
    // =================================================================================
    {
        id: '19',
        logicType: 'STATIC_QA', // トレース機能がないことを示す
        title: { ja: "サンプル問題 [科目B] 問19", en: "Sample Problem [Subject B] Q19" },
        description: {
            ja: "A社は従業員200名の通信販売業者である。一般消費者向けに生活雑貨，ギフト商品などの販売を手掛けている。取扱商品の一つである商品Zは，Z販売課が担当している。\n\n〔Z販売課の業務〕\n現在，Z販売課の要員は，商品Zについての受注管理業務及び問合せ対応業務を行っている。商品Zについての受注管理業務の手順を図1に示す。\n\n【図1 受注管理業務の手順】\n商品Zの顧客からの注文は電子メールで届く。\n(1) 入力\n    販売担当者は，届いた注文(変更，キャンセルを含む)の内容を受注管理システム1)(以下，Jシステムという)に入力し，販売責任者2)に承認を依頼する。\n(2) 承認\n    販売責任者は，注文の内容とJシステムへの入力結果を突き合わせて確認し，問題がなければ承認する。問題があれば差し戻す。\n注1) A社情報システム部が運用している。利用者は，販売責任者，販売担当者などである。\n注2) Z販売課の課長1名だけである。\n\n〔Jシステムの操作権限〕\nZ販売課では，Jシステムについて，次の利用方針を定めている。\n〔方針1〕ある利用者が入力した情報は，別の利用者が承認する。\n〔方針2〕販売責任者は，Z販売課の全業務の情報を閲覧できる。\n\nJシステムでは，業務上必要な操作権限を利用者に与える機能が実装されている。\nこの度，商品Zの受注管理業務が受注増によって増えていることから，B社に一部を委託することにした(以下，商品Zの受注管理業務の入力作業を行うB社従業員を商品ZのB社販売担当者といい，商品ZのB社販売担当者の入力結果を閲覧して，不備があればA社に口頭で差戻しを依頼するB社従業員を商品ZのB社販売責任者という)。\n\n委託に当たって，Z販売課は情報システム部にJシステムに関する次の要求事項を伝えた。\n［要求1］B社が入力した場合は，A社が承認する。\n［要求2］A社の販売担当者が入力した場合は，現状どおりにA社の販売責任者が承認する。\n\n上記を踏まえ，情報システム部は今後の各利用者に付与される操作権限を表1にまとめ，Z販売課の情報セキュリティリーダーであるCさんに確認をしてもらった。\n\n【表1 操作権限案】\n利用者 (省略)\nZ販売課の販売担当者 (省略)\na1 (空欄)\na2 (空欄)\n(注記 ○は、操作権限が付与されることを示す。)\n\n【設問】\n表1中の a1， a2 に入れる字句の適切な組合せを，aに関する解答群の中から選べ。",
            en: "Company A, a mail-order business, has outsourced some of its order management tasks for Product Z to Company B..."
        },
        programLines: { ja: [], en: [] }, // プログラムはないので空
        answerOptions: {
            ja: [
                { label: 'ア', value: 'a1:Z販売課の販売責任者, a2:商品ZのB社販売責任者' },
                { label: 'イ', value: 'a1:Z販売課の販売責任者, a2:商品ZのB社販売担当者' },
                { label: 'ウ', value: 'a1:商品ZのB社販売責任者, a2:Z販売課の販売責任者' },
                { label: 'エ', value: 'a1:商品ZのB社販売責任者, a2:商品ZのB社販売担当者' },
                { label: 'オ', value: 'a1:商品ZのB社販売担当者, a2:Z販売課の販売責任者' },
            ],
            en: [ /* English options */ ]
        },
        correctAnswer: 'a1:商品ZのB社販売責任者, a2:商品ZのB社販売担当者',
        explanationText: {
            ja: "業務のロール(役割)に応じて適切な権限設定が問われています。ポイントは［方針1］ある利用者が入力した情報は別の利用者が承認する「職務の分離」と、業務上必要な操作権限を利用者に与える「最小権限の原則」を考慮することです。\n\n［要求1］の「B社が入力した場合は，A社が承認する」、［要求2］の「A社の販売担当者が入力した場合は，現状どおりにA社の販売責任者が承認する」より、承認権限が付与される（省略）のロールはZ販売課の販売責任者であることがわかります。そうなると空欄に入るのは、B社販売責任者とB社販売担当者のいずれかになります。\n\nB社販売担当者は入力作業を行うので、Jシステムに対する入力権限と閲覧権限が必要です。一方、B社販売責任者の役割は、B社販売担当者の入力結果を閲覧することなので、最小権限の原則より閲覧権限のみ与えるのが適切です。\n\nしたがって「エ」の組合せが適切です。",
            en: "This question is about setting appropriate permissions based on job roles, considering the 'separation of duties' and the 'principle of least privilege'. Based on the requirements, the approval role is the Z Sales Section Manager. The B Company Sales Representative needs input and view permissions, while the B Company Sales Manager only needs view permissions according to the principle of least privilege. Therefore, combination 'エ' is appropriate."
        },
        initialVariables: {}, // トレース変数は不要
        traceLogic: [],
    },
    // =================================================================================
    // --- 問20: 情報システム運用 ---
    // =================================================================================
    {
        id: '20',
        logicType: 'STATIC_QA', // トレース機能がないことを示す
        title: { ja: "サンプル問題 [科目B] 問20", en: "Sample Problem [Subject B] Q20" },
        description: {
            ja: " A社は栄養補助食品を扱う従業員500名の企業である。A社のサーバ及びファイアウォール (以下、FWという)を含む情報システムの運用は情報システム部が担当している。ある日、内部監査部の監査があり、FWの運用状況について情報システム部の日部長が図1 のとおり説明したところ、表1に示す指摘を受けた。・FWを含め、情報システムの運用は、情報システム部の運用チームに所属する6名の運用担当者が担当している。FWの運用には、FWルールの編集、操作ログの確認、並びに編集後のFWルールの確認及び操作の承認(以下、 編集後のFWルールの確認及び操作の承認を操作承認というの三つがある。 FWルールの編集は事前に作成された操作指示書に従って行う。FWの機能には、FWルールの編集、操作ログの確認、及び操作承認の三つがある。FWルールの変更には、FWルールの編集と操作承認の両方が必要である。操作承認の前に操作ログの確認を行う。FWの利用者IDは各運用担当者に個別に発行されており、利用者IDの共用はしていない。FWでは、機能を利用する権限を運用担当者の利用者のごとに付与できる。現在は、6名の運用担当者とも全権限を付与されており、運用担当者はFWのルールの編集後、編集を行った運用担当者が操作に誤りがないことを確認し、操作承認をしている。FWへのログインにはパスワードを利用している。パスワードは文字の英数字である。・FWの運用では、運用担当者の利用者ごとに、ネットワークを経由せずコンソールでログインできるかどうか、ネットワークを経由してリモートからログインできるかどうかを設定できる。・FWは、ネットワークを経由せずコンソールでログインした場合でも、ネットワークを経由してリモートからログインした場合でも、同一の機能を利用できる。FWはサーバパレームに設置されており、サーバルームにはほかに数種類のサーバも設置されている。運用担当者だけがサーバルームへの入退室を許可されている。FWの運用の作業の中で、職務が適切に分離されていない。B部長は表1の指摘に対する改善策を検討することにした。設問表1中の指摘1について、FWルールの誤った変更を防ぐための改善策はどれか。解答群のうち、最も適切なものを選べ。",
            en: "Company A, a mail-order business, has outsourced some of its order management tasks for Product Z to Company B..."
        },
        programLines: { ja: [], en: [] }, // プログラムはないので空
        answerOptions: {
            ja: [
                { label: 'ア', value: 'Endpoint Detection and Response (EDR) をコンソールに導入し、監視を強化する。' },
                { label: 'イ', value: 'FWでの適用担当者のログインにはパスワード認証の代わりに多要素認証を導入する。' },
                { label: 'ウ', value: 'FWのアクセス制御機能を使って、運用担当者をコンソールからログインできる者。 リモートからログインできる者に分ける。' },
                { label: 'エ', value: 'FWの運用担当者を1人に限定する。' },
                { label: 'オ', value: '運用担当者の一部を操作ログの確認だけをする者とし、それらの者には操作ログの確認権限だけを付与する。' },
                { label: 'カ', value: '運用担当者を,FWルールの編集を行う者、操作ログを確認し、操作承認をする者に分け、それぞれに必要最小限の権限を付与する。' },
                { label: 'キ', value: '作業を行う運用担当者を、曜日ごとに割り当てる。' },
            ],
            en: [ /* English options */ ]
        },
        correctAnswer: '運用担当者を,FWルールの編集を行う者、操作ログを確認し、操作承認をする者に分け、それぞれに必要最小限の権限を付与する。',
        explanationText: {
            ja: "業務のロール(役割)に応じて適切な権限設定が問われています。ポイントは［方針1］ある利用者が入力した情報は別の利用者が承認する「職務の分離」と、業務上必要な操作権限を利用者に与える「最小権限の原則」を考慮することです。\n\n［要求1］の「B社が入力した場合は，A社が承認する」、［要求2］の「A社の販売担当者が入力した場合は，現状どおりにA社の販売責任者が承認する」より、承認権限が付与される（省略）のロールはZ販売課の販売責任者であることがわかります。そうなると空欄に入るのは、B社販売責任者とB社販売担当者のいずれかになります。\n\nB社販売担当者は入力作業を行うので、Jシステムに対する入力権限と閲覧権限が必要です。一方、B社販売責任者の役割は、B社販売担当者の入力結果を閲覧することなので、最小権限の原則より閲覧権限のみ与えるのが適切です。\n\nしたがって「エ」の組合せが適切です。",
            en: "This question is about setting appropriate permissions based on job roles, considering the 'separation of duties' and the 'principle of least privilege'. Based on the requirements, the approval role is the Z Sales Section Manager. The B Company Sales Representative needs input and view permissions, while the B Company Sales Manager only needs view permissions according to the principle of least privilege. Therefore, combination 'エ' is appropriate."
        },
        initialVariables: {}, // トレース変数は不要
        traceLogic: [],
    },
    // =================================================================================
    // --- 問21: プログラムの条件分岐 ---
    // =================================================================================
    {
        id: '21',
        logicType: 'ADMISSION_FEE',
        title: { ja: "基本情報技術者試験 科目B 問21", en: "Fundamental Information Technology Engineer Examination, Subject B, Question 21" },
        description: {
            ja: "次のプログラム中の□に入れる正しい答えを、解答群の中から選べ。\n\nある施設の入場料は、0歳から3歳までは100円、4歳から9歳までは300円、10歳以上は500円である。関数 fee は、年齢を表す0以上の整数(num)を引数として受け取り、入場料を返す。",
            en: "Select the correct answer for the blank in the following program from the answer choices.\n\nThe admission fee for a certain facility is 100 yen for ages 0 to 3, 300 yen for ages 4 to 9, and 500 yen for ages 10 and over. The function 'fee' takes a non-negative integer representing age(num) as an argument and returns the admission fee."
        },
        programLines: {
            ja: [
                ' 1: ○整数型: fee(整数型: num)',
                ' 2:   整数型: ret',
                ' 3:   if (num が 3 以下)',
                ' 4:     ret ← 100',
                ' 5:   elseif (            )',
                ' 6:     ret ← 300',
                ' 7:   else',
                ' 8:     ret ← 500',
                ' 9:   endif',
                '10:   return ret',
            ],
            en: [
                ' 1: ○function fee(integer: num) -> integer',
                ' 2:   integer: ret',
                ' 3:   if (num <= 3)',
                ' 4:     ret ← 100',
                ' 5:   elseif (            )',
                ' 6:     ret ← 300',
                ' 7:   else',
                ' 8:     ret ← 500',
                ' 9:   endif',
                '10:   return ret',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '(numが4以上) and (numが9より小さい)' },
                { label: 'イ', value: '(numが4と等しい) or (numが9と等しい)' },
                { label: 'ウ', value: '(numが4より大きい) and (numが9以下)' },
                { label: 'エ', value: 'numが4以上' },
                { label: 'オ', value: 'numが4より大きい' },
                { label: 'カ', value: 'numが9以下' },
                { label: 'キ', value: 'numが9より小さい' },
            ],
            en: [
                { label: 'A', value: '(num >= 4) and (num < 9)' },
                { label: 'B', value: '(num == 4) or (num == 9)' },
                { label: 'C', value: '(num > 4) and (num <= 9)' },
                { label: 'D', value: 'num >= 4' },
                { label: 'E', value: 'num > 4' },
                { label: 'F', value: 'num <= 9' },
                { label: 'G', value: 'num < 9' },
            ]
        },
        correctAnswer: 'numが9以下',
        explanationText: {
            ja: "設問のプログラムの分岐処理は、if-elseif-else構文で構成されています。この構文では、条件は上から順に評価され、最初に真(true)になったブロックだけが実行されます。\n\n1. `if (num が 3 以下)`: まず、年齢(num)が3歳以下かどうかを判定します。真の場合、料金は100円となり、処理は終了します。\n2. `elseif (num が 9 以下)`: 上の条件が偽の場合（つまり、年齢(num)が4歳以上の場合）に、この条件が評価されます。ここで料金を300円に設定したい対象は4歳から9歳です。年齢(num)が既に4歳以上であることは確定しているため、「9歳以下である」という条件だけで十分です。\n3. `else`: 上の`elseif`の条件も偽の場合（つまり、10歳以上の場合）に、このブロックが実行され、料金は500円となります。\n\nしたがって、空欄には「カ」の `numが9以下` を入れるのが最も適切です。",
            en: "The program's branching logic uses an if-elseif-else structure. Conditions are evaluated from top to bottom, and only the block of the first true condition is executed.\n\n1. `if (num <= 3)`: First, it checks if the age(num) is 3 or less. If true, the fee is 100, and the process ends.\n2. `elseif (num <= 9)`: This condition is evaluated if the above is false (i.e., the age(num) is 4 or greater). The target for the 300 yen fee is ages 4 to 9. Since it's already established that the age(num) is 4 or greater, the condition 'is 9 or less' is sufficient.\n3. `else`: If the `elseif` condition is also false (i.e., the age(num) is 10 or greater), this block is executed, and the fee becomes 500.\n\nTherefore, the most appropriate choice for the blank is 'F', `num <= 9`."
        },
        initialVariables: { num: null, ret: null },
        traceOptions: {
            presets: [2, 4, 9, 11]
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 【★ここから追加】問22: 配列の要素の逆順化 ---
    // =================================================================================
    {
        id: '22',
        logicType: 'ARRAY_REVERSE',
        title: { ja: "基本情報技術者試験 科目B 問22", en: "Subject B Sample Problem Q22" },
        description: {
            ja: "次のプログラム中の a と b に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n次のプログラムは，整数型の配列 array の要素の並びを逆順にする。",
            en: "Select the correct combination for a and b in the following program from the answer choices. Here, array indices start from 1.\n\nThe following program reverses the order of elements in an integer array 'array'."
        },
        programLines: {
            ja: [
                '1: 整数型の配列: array ← {1, 2, 3, 4, 5}',
                '2: 整数型: right, left',
                '3: 整数型: tmp',
                '4: ',
                '5: for (left を 1 から (arrayの要素数 ÷ 2の商) まで 1 ずつ増やす)',
                '6:   right ← [      a      ]',
                '7:   tmp ← array[right]',
                '8:   array[right] ← array[left]',
                '9:   [      b      ] ← tmp',
                '10: endfor',
            ],
            en: [ /* ... */ ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'a: arrayの要素数 - left, b: array[left]' },
                { label: 'イ', value: 'a: arrayの要素数 - left, b: array[right]' },
                { label: 'ウ', value: 'a: arrayの要素数 - left + 1, b: array[left]' },
                { label: 'エ', value: 'a: arrayの要素数 - left + 1, b: array[right]' },
            ],
            en: [ /* ... */ ]
        },
        correctAnswer: 'a: arrayの要素数 - left + 1, b: array[left]',
        explanationText: {
            ja: "このプログラムは、配列の先頭 (`left`) と末尾 (`right`) の要素を順番に入れ替えていくことで、配列全体を逆順にします。`for`ループは配列の中央まで実行されます。\n\n`left`が1のとき、`right`は末尾の要素番号である5を指す必要があります。同様に`left`が2のときは`right`は4を指す必要があります。この関係は `right = (配列の要素数) - left + 1` と表せます。これにより、`a`には `arrayの要素数 - left + 1` が入ります。\n\n次に、要素の交換処理を見てみましょう。\n`tmp ← array[right]` で末尾の値を一時的に保存します。\n`array[right] ← array[left]` で先頭の値を末尾に代入します。\n最後に、一時的に保存した元の末尾の値を、先頭に代入する必要があります。したがって、`b` には `array[left]` が入り、`array[left] ← tmp` となります。\n\nよって、正しい組み合わせは「ウ」です。",
            en: "This program reverses an array by swapping elements from the beginning (`left`) and the end (`right`), moving towards the center. The `for` loop runs up to the middle of the array..."
        },
        initialVariables: {
            array: null,
            left: null,
            right: null,
            tmp: null,
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
    // =================================================================================
    // --- 問23: 単方向リストへの要素追加 ---
    // =================================================================================
    {
        id: '23',
        logicType: 'LINKED_LIST_APPEND',
        title: { ja: "科目B サンプル問題 問23", en: "Subject B Sample Problem Q23" },
        description: {
            ja: "次のプログラム中の a と b に入れる正しい答えの組合せを，解答群の中から選べ。\n\n手続 append は，引数で与えられた文字を単方向リストに追加する手続である。...",
            en: "Select the correct combination for a and b from the answer choices. The procedure 'append' adds a character given as an argument to a singly linked list..."
        },
        programLines: {
            ja: [
                ' 1: 大域: ListElement: listHead ← 未定義の値',
                ' 2: ',
                ' 3: ○append(文字列型: qVal)',
                ' 4:   ListElement: prev, curr',
                ' 5:   curr ← ListElement(qVal)',
                ' 6:   if (listHead が 未定義)',
                ' 7:     listHead ← curr',
                ' 8:   else',
                ' 9:     prev ← listHead',
                '10:     while (prev.next が 未定義でない)',
                '11:       prev ← prev.next',
                '12:     endwhile',
                '13:     prev.next ← curr',
                '14:   endif',
            ],
            en: [ /* ... */ ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'a: 未定義, b: curr' },
                { label: 'イ', value: 'a: 未定義, b: curr.next' },
                { label: 'ウ', value: 'a: 未定義, b: listHead' },
                { label: 'エ', value: 'a: 未定義でない, b: curr' },
                { label: 'オ', value: 'a: 未定義でない, b: curr.next' },
                { label: 'カ', value: 'a: 未定義でない, b: listHead' },
            ],
            en: [ /* ... */ ]
        },
        correctAnswer: 'a: 未定義, b: curr',
        explanationText: {
            ja: "【aについて】\nこのif文は、リストが空かどうかを判断し、処理を分岐させるためのものです。問題文に「リストが空のときは，listHead は未定義である」とあるため、`listHead`が「未定義」かどうかで判定するのが適切です。`listHead`が未定義の場合、新しく作成した要素`curr`をリストの先頭`listHead`に設定します。\n\n【bについて】\nelse節は、リストに1つ以上の要素が既に存在する場合の処理です。`while`ループでリストの末尾の要素までたどり、ループを抜けた時点で変数`prev`が末尾の要素を指しています。この末尾要素の`next`参照（`prev.next`）に、新しく追加する要素`curr`を設定することで、リストの末尾に新しい要素を連結できます。\n\nしたがって、正しい組み合わせは「ア」です。",
            en: "Regarding 'a': This if statement checks if the list is empty..."
        },
        initialVariables: {
            listData: null,
            listHead: null,
            qVal: null,
            prev: null,
            curr: null,
        },
        traceOptions: {
            presets_array: [
                {
                    label: 'Case1: 空のリストに "A" を追加',
                    value: {
                        listData: [],
                        listHead: null,
                        qVal: 'A',
                        prev: null,
                        curr: null,
                    }
                },
                {
                    label: 'Case2: 既存リストに "D" を追加',
                    value: {
                        listData: [{val: 'A', next: 1}, {val: 'B', next: 2}, {val: 'C', next: null}],
                        listHead: 0,
                        qVal: 'D',
                        prev: null,
                        curr: null,
                    }
                },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
    },
];

/**
 * IDを指定して問題データを取得するヘルパー関数
 * @param id 取得したい問題のID文字列
 * @returns {Problem | undefined} 対応する問題オブジェクト、または見つからない場合はundefined
 */
export const getProblemById = (id: string): Problem | undefined => {
  return problems.find(p => p.id === id);
}
