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
  id: string;                                   // 問題をURLなどで一意に識別するためのID (例: "1", "2")
  title: { ja: string; en: string };            // 問題のタイトル (日本語/英語)
  description: { ja: string; en: string };      // 問題文
  programLines: { ja: string[]; en: string[] };  // 擬似言語プログラムの各行
  answerOptions: { ja: AnswerOption[]; en: AnswerOption[] }; // 解答群の選択肢
  correctAnswer: string;                        // この問題の正解の値
  explanationText: { ja: string; en: string };  // 解答後に表示される解説文
  initialVariables: VariablesState;             // トレース開始時の変数の初期状態
  traceLogic: TraceStep[];                      // プログラムの各行に対応するトレース処理の配列
  logicType: string;
  
  // --- 以下は特定の種類の問題でのみ使用するオプションのプロパティです ---
  
  /**
   * @property {object} [traceOptions] - トレースの特別な設定（FizzBuzz問題などで使用）
   * @property {number[]} presets - ユーザーが選択できるトレース開始時のプリセット値 (例: [3, 5, 15, 7])
   */
  traceOptions?: {
    presets?: number[];
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
            data: null, // 正解の選択肢「ア」
            n: null,
            bins: null,
            i: null,
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
    }
];

/**
 * IDを指定して問題データを取得するヘルパー関数
 * @param id 取得したい問題のID文字列
 * @returns {Problem | undefined} 対応する問題オブジェクト、または見つからない場合はundefined
 */
export const getProblemById = (id: string): Problem | undefined => {
  return problems.find(p => p.id === id);
}
