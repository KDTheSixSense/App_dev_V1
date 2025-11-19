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
  answerOptions?: { ja: AnswerOption[]; en: AnswerOption[] }; // 解答群の選択肢
  correctAnswer: string;                        // この問題の正解の値
  explanationText: { ja: string; en: string };  // 解答後に表示される解説文
  initialVariables: VariablesState;             // トレース開始時の変数の初期状態
  traceLogic: TraceStep[];                      // プログラムの各行に対応するトレース処理の配列
  logicType: string;
  difficultyId: number;
  
  // --- 以下は特定の種類の問題でのみ使用するオプションのプロパティです ---
  
  /**
   * @property {object} [traceOptions] - トレースの特別な設定（FizzBuzz問題などで使用）
   * @property {number[]} presets - ユーザーが選択できるトレース開始時のプリセット値 (例: [3, 5, 15, 7])
   */
  traceOptions?: {
    presets?: number[];
    presets_array?: { label: string; value: any }[];
    presets_case?: { label: string; value: any }[];
    logicVariants?: { id: string; label: string }[];
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
        title: { ja: "サンプル問題 [科目B] 型，変数，代入のプログラム", en: "Sample Problem [Subject B] Q1" },
        description: { ja: "次の記述中の□に入れる正しい答えを、解答群の中から選べ。プログラムを実行すると'　　'と出力される。", en: "What are the values of y and z after executing the following program?" },
        programLines: { ja: [ '1 整数型: x ← 1', '2 整数型: y ← 2', '3 整数型: z ← 3', '4 x ← y', '5 y ← z', '6 z ← x', '7 yとzの値をこの順にコンマ区切りで出力する', ], en: [], },
        answerOptions: { ja: [ { label: 'ア', value: '1,2' }, { label: 'イ', value: '1,3' }, { label: 'ウ', value: '2,1' }, { label: 'エ', value: '2,3' }, { label: 'オ', value: '3,1' }, { label: 'カ', value: '3,2' }, ], en: [], },
        correctAnswer: '3,2',
        explanationText: { ja: `xは1、yは2、zは3で初期化されています。まずxにyの値である2が代入され、x=2, y=2, z=3となります。次にyにzの値である3が代入され、x=2, y=3, z=3となります。最後にzにxの値である2が代入され、x=2, y=3, z=2となります。したがって、yとzの値は「3,2」です。`, en: `` },
        initialVariables: { x: null, y: null, z: null },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    {
        id: '2',
        logicType: 'FIZZ_BUZZ',
        title: { ja: "サンプル問題 [科目B] 比較演算と選択処理のプログラム", en: "Sample Problem [Subject B] Q2" },
        description: { ja: "次のプログラム中の a ~ c に入れる正しい答えの組み合わせを、解答群の中から選べ。関数 fizzBuzz は、引数で与えられた値が、3で割り切れて5で割り切れない場合は\"3で割り切れる\"を、5で割り切れて3で割り切れない場合は\"5で割り切れる\"を、3と5で割り切れる場合は\"3と5で割り切れる\"を返します。それ以外の場合は\"3でも5でも割り切れない\"を返します。", en: "" },
        programLines: { ja: [ ' 1: ○文字列型: fizzBuzz(整数型: num)', ' 2: 　文字列型: result', ' 3: 　if (num が 3と5 で割り切れる)', ' 4: 　　result ← "3と5で割り切れる"', ' 5: 　elseif (num が 3 で割り切れる)', ' 6: 　　result ← "3で割り切れる"', ' 7: 　elseif (num が 5 で割り切れる)', ' 8: 　　result ← "5で割り切れる"', ' 9: 　else', '10: 　　result ← "3でも5でも割り切れない"', '11: 　endif', '12: 　return result', ], en: [], },
        answerOptions: { ja: [ { label: 'ア', value: 'a:3, b:3と5, c:5' }, { label: 'イ', value: 'a:3, b:5, c:3と5' }, { label: 'ウ', value: 'a:3と5, b:3, c:5' }, { label: 'エ', value: 'a:5, b:3, c:3と5' }, { label: 'オ', value: 'a:5, b:3と5, c:3' }, ], en: [], },
        correctAnswer: 'a:3と5, b:3, c:5',
        explanationText: { ja: `if-elseif-else構文では、条件は上から順に評価され、最初に真(true)になったブロックだけが実行されます。3と5の両方で割り切れる数（例: 15）は3でも5でも割り切れるため、最も限定的な「3と5で割り切れる」という条件を最初に評価する必要があります。`, en: `` },
        initialVariables: { num: null, result: null },
        traceOptions: { presets: [3, 5, 15, 7] },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    {
        id: '3',
        logicType: 'ARRAY_SUM',
        title: { ja: "サンプル問題 [科目B] 配列を処理するプログラム", en: "Sample Problem [Subject B] Q3" },
        description: { ja: "配列の要素番号は1から始まる。関数 makeNewArray は、要素数2以上の整数型の配列を引数にとり、整数型の配列を返す関数である。関数 makeNewArray を makeNewArray({3, 2, 1, 6, 5, 4})として呼び出したとき、戻り値の配列の要素番号5の値は[ ]となる。", en: "", },
        programLines: { ja: [ ' 1: ○整数型の配列: makeNewArray(整数型の配列: in)', ' 2: 　整数型の配列: out ← {}', ' 3: 　整数型: i, tail', ' 4: 　outの末尾に in[1] の値 を追加する', ' 5: 　for (i を 2 から inの要素数 まで 1 ずつ増やす)', ' 6: 　　tail ← out[outの要素数]', ' 7: 　　outの末尾に (tail + in[i]) の結果を追加する', ' 8: 　endfor', ' 9: 　return out', ], en: [], },
        answerOptions: { ja: [ { label: 'ア', value: '5' }, { label: 'イ', value: '6' }, { label: 'ウ', value: '9' }, { label: 'エ', value: '11' }, { label: 'オ', value: '12' }, { label: 'カ', value: '17' }, { label: 'キ', value: '21' }, ], en: [], },
        correctAnswer: '17',
        explanationText: { ja: `makeNewArray({3, 2, 1, 6, 5, 4})を呼び出したときの処理の流れをトレースしていきます...\n`, en: ``},
        initialVariables: { in: [3, 2, 1, 6, 5, 4], out: [], i: null, tail: null },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    {
        id: '4',
        logicType: 'GCD_SUBTRACTION',
        title: { ja: "サンプル問題 [科目B] 最大公約数を求めるプログラム", en: "Sample Problem [Subject B] Q4" },
        description: { ja: "次のプログラム中の a ～ c に入れる正しい答えの組合せを，解答群の中から選べ。\n\n関数 gcd は，引数で与えられた二つの正の整数 num1 と num2 の最大公約数を，次の(1)～(3)の性質を利用して求める。\n(1) num1 と num2 が等しいとき，num1 と num2 の最大公約数は num1 である。\n(2) num1 が num2 より大きいとき，num1 と num2 の最大公約数は，(num1 - num2) と num2 の最大公約数と等しい。\n(3) num2 が num1 より大きいとき，num1 と num2 の最大公約数は，num1 と (num2 - num1) の最大公約数と等しい。", en: "Select the correct combination for a, b, and c in the following program from the answer choices. The function gcd finds the greatest common divisor (GCD) of two positive integers, num1 and num2, using properties (1) to (3)." },
        programLines: { ja: [ ' 1: ○整数型: gcd(整数型: num1, 整数型: num2)', ' 2: 　整数型: x ← num1', ' 3: 　整数型: y ← num2', ' 4: 　[   a   ]', ' 5: 　　if ( [   b   ] )', ' 6: 　　　x ← x - y', ' 7: 　　else', ' 8: 　　　y ← y - x', ' 9: 　　endif', '10: 　[   c   ]', '11: 　return x', ], en: [ ' 1: ○function gcd(integer: num1, integer: num2) -> integer', ' 2: 　integer: x ← num1', ' 3: 　integer: y ← num2', ' 4: 　[   a   ]', ' 5: 　　if ( [   b   ] )', ' 6: 　　　x ← x - y', ' 7: 　　else', ' 8: 　　　y ← y - x', ' 9: 　　endif', '10: 　[   c   ]', '11: 　return x', ], },
        answerOptions: { ja: [ { label: 'ア', value: 'a: if (x ≠ y), b: x < y, c: endif' }, { label: 'イ', value: 'a: if (x ≠ y), b: x > y, c: endif' }, { label: 'ウ', value: 'a: while (x ≠ y), b: x < y, c: endwhile' }, { label: 'エ', value: 'a: while (x ≠ y), b: x > y, c: endwhile' }, ], en: [ { label: 'A', value: 'a: if (x ≠ y), b: x < y, c: endif' }, { label: 'B', value: 'a: if (x ≠ y), b: x > y, c: endif' }, { label: 'C', value: 'a: while (x ≠ y), b: x < y, c: endwhile' }, { label: 'D', value: 'a: while (x ≠ y), b: x > y, c: endwhile' }, ], },
        correctAnswer: 'a: while (x ≠ y), b: x > y, c: endwhile',
        explanationText: { ja: "まず、a と c に入る制御文ですが、(1)の説明に「最大公約数が num1 と num2 が等しくなったときの num1 の値である」という説明があります。2つの正の整数について、(2)または(3)の処理を1回行っただけでは num1 と num2 が等しくなるとは限らず、両者が等しくなるまで(2)または(3)の処理を繰り返す必要があるので、繰返し処理を行うwhile文が当てはまります。よって、正解肢は「ウ」または「エ」に絞られます。\n\n次に b ですが、条件に合致するときに x ← x - y、つまり、num1 に num1 - num2 を代入する処理を行っています。(2)の説明より、この処理を行うのは num1 が num2 より大きいときですから、x > y が当てはまるとわかります。\n\n逆に x < y のときにこの処理を行ってしまうと、x の値は負数となり、それ以後 x < y ⇒ x ← x - y が永遠に繰り返されることにより、繰返し処理が終了しなくなってしまいます。また、2つの正の整数の最大公約数が負数ということはありません。よって、x < y を入れるのは不適切です。\n\nしたがって、while文と x > y の組合せである「エ」が適切です。", en: "First, for the control statements in a and c, property (1) states that the GCD is the value of num1 when num1 and num2 become equal. Since one application of property (2) or (3) does not guarantee equality, a loop is needed to repeat the process. Therefore, a 'while' statement is appropriate, narrowing the choices to C or D.\n\nNext, for b, the operation 'x ← x - y' corresponds to property (2), which applies when num1 > num2. Thus, the condition must be 'x > y'.\n\nIf we were to use 'x < y', 'x' would become negative, leading to an infinite loop. The GCD of positive integers cannot be negative. Therefore, 'x < y' is incorrect.\n\nConsequently, the correct combination is 'while' and 'x > y', which is choice D." },
        initialVariables: { num1: 36, num2: 60, x: null, y: null },
        traceOptions: {
        logicVariants: [
            { id: 'ア', label: 'ア: a: if (x ≠ y), b: x < y, c: endif' },
            { id: 'イ', label: 'イ: a: if (x ≠ y), b: x > y, c: endif' },
            { id: 'ウ', label: 'ウ: a: while (x ≠ y), b: x < y, c: endwhile' },
            { id: 'エ', label: 'エ: a: while (x ≠ y), b: x > y, c: endwhile' }
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    {
        id: '5',
        logicType: 'EXPRESSION_EVAL',
        title: { ja: "サンプル問題 [科目B] 斜辺の長さを求めるプログラム", en: "Sample Problem [Subject B] Q5" },
        description: { ja: "次のプログラム中の□に入れる正しい答えを、解答群の中から選べ。\n\n関数 calc は、正の実数 x と y を受け取り、√x²+y² の計算結果を返す。関数 calc が使う関数 pow は、第1引数として正の実数 a を、第2引数として実数 b を受け取り、a の b 乗の値を実数型で返す。", en: "Select the correct answer for the blank in the program from the answer choices.\n\nThe function calc takes two positive real numbers, x and y, and returns the result of √x²+y². The function pow, used by calc, takes a positive real number a as the first argument and a real number b as the second argument, and returns the value of a to the power of b as a real number." },
        programLines: { ja: [ '○実数型: calc(実数型: x, 実数型: y)', '  return [                      ]', ], en: [ '○function calc(real: x, real: y) -> real', '  return [                      ]', ] },
        answerOptions: { ja: [ { label: 'ア', value: '(pow(x, 2) + pow(y, 2)) ÷ pow(2, 0.5)' }, { label: 'イ', value: '(pow(x, 2) + pow(y, 2)) ÷ pow(x, y)' }, { label: 'ウ', value: 'pow(2, pow(x, 0.5)) + pow(2, pow(y, 0.5))' }, { label: 'エ', value: 'pow(pow(pow(2, x), y), 0.5)' }, { label: 'オ', value: 'pow(pow(x, 2) + pow(y, 2), 0.5)' }, { label: 'カ', value: 'pow(x, 2) × pow(y, 2) ÷ pow(x, y)' }, { label: 'キ', value: 'pow(x, y) ÷ pow(2, 0.5)' }, ], en: [ { label: 'A', value: '(pow(x, 2) + pow(y, 2)) ÷ pow(2, 0.5)' }, { label: 'B', value: '(pow(x, 2) + pow(y, 2)) ÷ pow(x, y)' }, { label: 'C', value: 'pow(2, pow(x, 0.5)) + pow(2, pow(y, 0.5))' }, { label: 'D', value: 'pow(pow(pow(2, x), y), 0.5)' }, { label: 'E', value: 'pow(pow(x, 2) + pow(y, 2), 0.5)' }, { label: 'F', value: 'pow(x, 2) × pow(y, 2) ÷ pow(x, y)' }, { label: 'G', value: 'pow(x, y) ÷ pow(2, 0.5)' }, ], },
        correctAnswer: 'pow(pow(x, 2) + pow(y, 2), 0.5)',
        explanationText: { ja: "関数 pow() は第1引数に値、第2引数にべき指数(累乗の指数)を指定します。√x (xの平方根)は、xの1/2乗 = 0.5乗であることがポイントです。\n\nx² = pow(x, 2)\ny² = pow(y, 2)\nx² + y² = pow(x, 2) + pow(y, 2)\n\n√x²+y² は x²+y² の結果を1/2乗したものなので、pow() の第1引数に pow(x, 2) + pow(y, 2)、第2引数に 0.5 を指定することになります。\n\nしたがって「オ」の pow(pow(x, 2) + pow(y, 2), 0.5) が適切です。", en: "The pow() function takes a value as the first argument and the exponent as the second argument. The key point is that √x (the square root of x) is equivalent to x to the power of 1/2, or 0.5.\n\nx² = pow(x, 2)\ny² = pow(y, 2)\nx² + y² = pow(x, 2) + pow(y, 2)\n\nSince √x²+y² is the result of x²+y² raised to the power of 1/2, the first argument to pow() should be pow(x, 2) + pow(y, 2), and the second argument should be 0.5.\n\nTherefore, option 'E', pow(pow(x, 2) + pow(y, 2), 0.5), is the correct choice." },
        initialVariables: { x: 3, y: 4, result: null },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    {
        id: '6',
        logicType: 'BIT_REVERSE',
        title: { ja: "サンプル問題 [科目B] 論理演算を用いたプログラム", en: "Sample Problem [Subject B] Q6" },
        description: { ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。\n\n関数 rev は8ビット型の引数 byte を受け取り，ビットの並びを逆にした値を返す。例えば，関数 rev を rev(01001011) として呼び出すと，戻り値は11010010となる。\nなお，演算子∧はビット単位の論理積，演算子∨はビット単位の論理和，演算子>>は論理右シフト，演算子<<は論理左シフトを表す。例えば，value >> n は value の値を n ビットだけ右に論理シフトし，value << n は value の値を n ビットだけ左に論理シフトする。", en: "Select the correct answer for the blank in the program from the answer choices. The function rev takes an 8-bit argument 'byte' and returns a value with the bit order reversed. For example, calling rev(01001011) returns 11010010. The operator ∧ is bitwise AND, ∨ is bitwise OR, >> is logical right shift, and << is logical left shift." },
        programLines: { ja: [ '1: ○8ビット型: rev(8ビット型: byte)', '2:   8ビット型: rbyte ← byte', '3:   8ビット型: r ← 00000000', '4:   整数型: i', '5:   for (i を 1 から 8 まで 1 ずつ増やす)', '6:     [                                          ]', '7:   endfor', '8:   return r', ], en: [ '1: ○function rev(byte: 8bit) -> 8bit', '2:   8bit: rbyte ← byte', '3:   8bit: r ← 00000000', '4:   integer: i', '5:   for (i from 1 to 8 step 1)', '6:     [                                          ]', '7:   endfor', '8:   return r', ], },
        answerOptions: { ja: [ { label: 'ア', value: 'r ← (r << 1) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 1' }, { label: 'イ', value: 'r ← (r << 7) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 7' }, { label: 'ウ', value: 'r ← (rbyte << 1) ∨ (rbyte >> 7)\nrbyte ← r' }, { label: 'エ', value: 'r ← (rbyte >> 1) ∨ (rbyte << 7)\nrbyte ← r' }, ], en: [ { label: 'A', value: 'r ← (r << 1) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 1' }, { label: 'B', value: 'r ← (r << 7) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 7' }, { label: 'C', value: 'r ← (rbyte << 1) ∨ (rbyte >> 7)\nrbyte ← r' }, { label: 'D', value: 'r ← (rbyte >> 1) ∨ (rbyte << 7)\nrbyte ← r' }, ] },
        correctAnswer: 'r ← (r << 1) ∨ (rbyte ∧ 00000001)\nrbyte ← rbyte >> 1',
        explanationText: { ja: "この問題は、入力されたバイト(`rbyte`)のビットを1つずつ右端（最下位ビット）から取り出し、結果を格納するバイト(`r`)の左端（最上位ビット）から詰めていくことで、ビットの並びを反転させます。\n\n1. `r ← (r << 1) ...`: まず、結果`r`を1ビット左にシフトします。これにより、新しいビットを右端に挿入するためのスペースが作られます。\n2. `... ∨ (rbyte ∧ 00000001)`: `rbyte ∧ 00000001`は、`rbyte`の最下位ビットだけを取り出す操作です（マスク処理）。結果は`00000001`または`00000000`になります。これを左シフトした`r`と論理和(∨)を取ることで、取り出したビットを`r`の最下位ビットに設定します。\n3. `rbyte ← rbyte >> 1`: 処理済みの最下位ビットを`rbyte`から捨てるため、`rbyte`全体を1ビット右にシフトします。これにより、次のループでは、その隣のビットが最下位ビットになります。\n\nこの3つの処理を8回繰り返すことで、`rbyte`のビットが逆順で`r`に格納されます。したがって、「ア」が正解です。", en: "This problem reverses the bit order by taking bits one by one from the right end (LSB) of the input byte (`rbyte`) and placing them into the left end (MSB) of the result byte (`r`).\n\n1. `r ← (r << 1) ...`: First, the result `r` is shifted left by one bit. This makes space to insert a new bit at the right end.\n2. `... ∨ (rbyte ∧ 00000001)`: `rbyte ∧ 00000001` is an operation to extract only the least significant bit of `rbyte` (a masking operation). The result will be `00000001` or `00000000`. Taking a bitwise OR (∨) with the left-shifted `r` sets the extracted bit as the new LSB of `r`.\n3. `rbyte ← rbyte >> 1`: To discard the processed LSB from `rbyte`, `rbyte` is shifted right by one bit. This makes the next bit the new LSB for the next loop iteration.\n\nBy repeating these three steps eight times, the bits of `rbyte` are stored in `r` in reverse order. Therefore, 'A' is the correct answer." },
        initialVariables: { byte: '01001011', rbyte: null, r: null, i: null, },
        // ユーザーが選択するロジックの選択肢を定義
        traceOptions: {
          logicVariants: [
            { id: 'ア', label: 'ア: r ← (r << 1) ∨ (rbyte ∧ 1)\nrbyte ← rbyte >> 1' },
            { id: 'イ', label: 'イ: r ← (r << 7) ∨ (rbyte ∧ 1)\nrbyte ← rbyte >> 7' },
            { id: 'ウ', label: 'ウ: r ← (rbyte << 1) ∨ (rbyte >> 7)\nrbyte ← r' },
            { id: 'エ', label: 'エ: r ← (rbyte >> 1) ∨ (rbyte << 7)\nrbyte ← r' },
          ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    {
        id: '7',
        logicType: 'RECURSIVE_FACTORIAL',
        title: { ja: "サンプル問題 [科目B] 再帰関数のプログラム", en: "Sample Problem [Subject B] Q7" },
        description: { ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。\n\n関数 factorial は非負の整数 n を引数にとり，その階乗を返す関数である。非負の整数 n の階乗は n が0のときに1になり，それ以外の場合は1からnまでの整数を全て掛け合わせた数となる。", en: "Select the correct answer for the blank in the program from the answer choices. The function factorial takes a non-negative integer n as an argument and returns its factorial. The factorial of a non-negative integer n is 1 when n is 0, and the product of all integers from 1 to n otherwise." },
        programLines: { ja: [ '1: ○整数型: factorial(整数型: n)', '2:   if (n = 0)', '3:     return 1', '4:   endif', '5:   return [                      ]', ], en: [ '1: ○function factorial(integer: n) -> integer', '2:   if (n = 0)', '3:     return 1', '4:   endif', '5:   return [                      ]', ] },
        answerOptions: { ja: [ { label: 'ア', value: '(n - 1) * factorial(n)' }, { label: 'イ', value: 'factorial(n - 1)' }, { label: 'ウ', value: 'n' }, { label: 'エ', value: 'n * (n - 1)' }, { label: 'オ', value: 'n * factorial(1)' }, { label: 'カ', value: 'n * factorial(n - 1)' }, ], en: [ { label: 'A', value: '(n - 1) * factorial(n)' }, { label: 'B', value: 'factorial(n - 1)' }, { label: 'C', value: 'n' }, { label: 'D', value: 'n * (n - 1)' }, { label: 'E', value: 'n * factorial(1)' }, { label: 'F', value: 'n * factorial(n - 1)' }, ] },
        correctAnswer: 'n * factorial(n - 1)',
        explanationText: { ja: "この関数は再帰呼び出しによって階乗を計算します。\n\n・ベースケース: `n`が0の場合、再帰を停止し、1を返します。これは階乗の定義(0! = 1)です。\n・再帰ステップ: `n`が0でない場合、`n`と`factorial(n - 1)`の結果を掛け合わせます。これにより、`n * (n-1) * (n-2) * ... * 1`という計算が実現されます。\n\n例えば`factorial(4)`を呼び出すと、内部では`4 * factorial(3)`、さらに`4 * 3 * factorial(2)`...と展開され、最終的に`4 * 3 * 2 * 1 * factorial(0)`となります。`factorial(0)`が1を返すことで、全体の計算結果24が求まります。\n\nしたがって、正しい再帰の式は「カ」の`n * factorial(n - 1)`です。", en: "This function calculates the factorial using recursion.\n\n- Base Case: When `n` is 0, the recursion stops and returns 1. This is the definition of factorial (0! = 1).\n- Recursive Step: When `n` is not 0, it multiplies `n` by the result of `factorial(n - 1)`. This achieves the calculation `n * (n-1) * (n-2) * ... * 1`.\n\nFor example, calling `factorial(4)` internally expands to `4 * factorial(3)`, then `4 * 3 * factorial(2)`, and so on, eventually becoming `4 * 3 * 2 * 1 * factorial(0)`. Since `factorial(0)` returns 1, the final result of 24 is calculated.\n\nTherefore, the correct recursive formula is 'F', `n * factorial(n - 1)`." },
        initialVariables: { n: 4, current_n: 4, result: 1, },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    {
        id: '8',
        logicType: 'PRIORITY_QUEUE',
        title: { ja: "サンプル問題 [科目B] 優先度付きキューを操作するプログラム", en: "Sample Problem [Subject B] Q8" },
        description: { ja: "次の記述中の□に入れる正しい答えを，解答群の中から選べ。\n\n優先度付きキューを操作するプログラムである。優先度付きキューとは扱う要素に優先度を付けたキューであり，要素を取り出す際には優先度の高いものから順番に取り出される。クラス PrioQueue は優先度付きキューを表すクラスである。クラス PrioQueue の説明を図に示す。ここで，優先度は整数型の値1，2，3のいずれかであり，小さい値ほど優先度が高いものとする。\n\n手続 prioSched を呼び出したとき，出力は□の順となる。", en: "Select the correct answer for the blank in the following description from the answer choices. This is a program that operates on a priority queue. A priority queue is a queue where each element has a priority, and elements are dequeued in order of highest priority. The class PrioQueue represents a priority queue. The description of the PrioQueue class is shown in the figure. Here, the priority is one of the integer values 1, 2, or 3, with smaller values indicating higher priority. When the procedure prioSched is called, the output will be in the order of [ ]." },
        programLines: { ja: [ ' 1: ○prioSched()', ' 2:   prioQueue: PrioQueue ← PrioQueue()', ' 3:   prioQueue.enqueue("A", 1)', ' 4:   prioQueue.enqueue("B", 2)', ' 5:   prioQueue.enqueue("C", 2)', ' 6:   prioQueue.enqueue("D", 3)', ' 7:   prioQueue.dequeue() /* 戻り値は使用しない */', ' 8:   prioQueue.dequeue() /* 戻り値は使用しない */', ' 9:   prioQueue.enqueue("D", 3)', '10:   prioQueue.enqueue("B", 2)', '11:   prioQueue.dequeue() /* 戻り値は使用しない */', '12:   prioQueue.dequeue() /* 戻り値は使用しない */', '13:   prioQueue.enqueue("C", 2)', '14:   prioQueue.enqueue("A", 1)', '15:   while (prioQueue.size() が 0 と等しくない)', '16:     prioQueue.dequeue() の戻り値を出力', '17:   endwhile', ], en: [ ' 1: ○procedure prioSched()', ' 2:   prioQueue: PrioQueue ← new PrioQueue()', ' 3:   prioQueue.enqueue("A", 1)', ' 4:   prioQueue.enqueue("B", 2)', ' 5:   prioQueue.enqueue("C", 2)', ' 6:   prioQueue.enqueue("D", 3)', ' 7:   prioQueue.dequeue() /* return value not used */', ' 8:   prioQueue.dequeue() /* return value not used */', ' 9:   prioQueue.enqueue("D", 3)', '10:   prioQueue.enqueue("B", 2)', '11:   prioQueue.dequeue() /* return value not used */', '12:   prioQueue.dequeue() /* return value not used */', '13:   prioQueue.enqueue("C", 2)', '14:   prioQueue.enqueue("A", 1)', '15:   while (prioQueue.size() is not equal to 0)', '16:     output the return value of prioQueue.dequeue()', '17:   endwhile', ] },
        answerOptions: { ja: [ { label: 'ア', value: '"A", "B", "C", "D"' }, { label: 'イ', value: '"A", "B", "D", "D"' }, { label: 'ウ', value: '"A", "C", "C", "D"' }, { label: 'エ', value: '"A", "C", "D", "D"' }, ], en: [ { label: 'A', value: '"A", "B", "C", "D"' }, { label: 'B', value: '"A", "B", "D", "D"' }, { label: 'C', value: '"A", "C", "C", "D"' }, { label: 'D', value: '"A", "C", "D", "D"' }, ] },
        correctAnswer: '"A", "C", "D", "D"',
        explanationText: { ja: "enqueueはキューに要素を追加し、dequeueは優先度が最も高い(数値が小さい)要素を取り出します。同じ優先度の場合は先に追加されたものが先に取り出されます(FIFO)。\n\n1. enqueue(\"A\",1): [(\"A\",1)]\n2. enqueue(\"B\",2): [(\"A\",1),(\"B\",2)]\n3. enqueue(\"C\",2): [(\"A\",1),(\"B\",2),(\"C\",2)]\n4. enqueue(\"D\",3): [(\"A\",1),(\"B\",2),(\"C\",2),(\"D\",3)]\n5. dequeue(): \"A\"を取り出す → [(\"B\",2),(\"C\",2),(\"D\",3)]\n6. dequeue(): \"B\"を取り出す → [(\"C\",2),(\"D\",3)]\n7. enqueue(\"D\",3): [(\"C\",2),(\"D\",3),(\"D\",3)]\n8. enqueue(\"B\",2): [(\"C\",2),(\"D\",3),(\"D\",3),(\"B\",2)]\n9. dequeue(): \"C\"を取り出す → [(\"D\",3),(\"D\",3),(\"B\",2)]\n10. dequeue(): \"B\"を取り出す → [(\"D\",3),(\"D\",3)]\n11. enqueue(\"C\",2): [(\"D\",3),(\"D\",3),(\"C\",2)]\n12. enqueue(\"A\",1): [(\"D\",3),(\"D\",3),(\"C\",2),(\"A\",1)]\n\n最終的なキューの状態は [(\"D\",3), (\"D\",3), (\"C\",2), (\"A\",1)] です。ここからwhileループで全てを取り出すと、優先度順に「A」→「C」→「D」→「D」と出力されます。したがって、「エ」が正解です。", en: "enqueue adds an element to the queue, and dequeue removes the element with the highest priority (smallest number). If priorities are the same, the one added first is removed (FIFO).\n\n1. enqueue(\"A\",1): [(\"A\",1)]\n2. enqueue(\"B\",2): [(\"A\",1),(\"B\",2)]\n3. enqueue(\"C\",2): [(\"A\",1),(\"B\",2),(\"C\",2)]\n4. enqueue(\"D\",3): [(\"A\",1),(\"B\",2),(\"C\",2),(\"D\",3)]\n5. dequeue(): Removes \"A\" → [(\"B\",2),(\"C\",2),(\"D\",3)]\n6. dequeue(): Removes \"B\" → [(\"C\",2),(\"D\",3)]\n7. enqueue(\"D\",3): [(\"C\",2),(\"D\",3),(\"D\",3)]\n8. enqueue(\"B\",2): [(\"C\",2),(\"D\",3),(\"D\",3),(\"B\",2)]\n9. dequeue(): Removes \"C\" → [(\"D\",3),(\"D\",3),(\"B\",2)]\n10. dequeue(): Removes \"B\" → [(\"D\",3),(\"D\",3)]\n11. enqueue(\"C\",2): [(\"D\",3),(\"D\",3),(\"C\",2)]\n12. enqueue(\"A\",1): [(\"D\",3),(\"D\",3),(\"C\",2),(\"A\",1)]\n\nThe final state of the queue is [(\"D\",3), (\"D\",3), (\"C\",2), (\"A\",1)]. Dequeuing all elements from this state in the while loop results in the output \"A\" → \"C\" → \"D\" → \"D\" in order of priority. Therefore, 'D' is the correct answer." },
        initialVariables: { queue: [], output: [], },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問9: 2分木の走査 ---
    // =================================================================================
    {
        id: '9',
        logicType: 'BINARY_TREE_TRAVERSAL',
        title: { ja: "サンプル問題 [科目B] 木構造を走査するプログラム", en: "Sample Problem [Subject B] Q9" },
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
        difficultyId: 8
    },
    // =================================================================================
    // --- 問10: 単方向リストの要素削除 ---
    // =================================================================================
    {
        id: '10',
        logicType: 'LINKED_LIST_DELETE',
        title: { ja: "サンプル問題 [科目B] リストの要素を削除するプログラム", en: "Sample Problem [Subject B] Q10" },
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
        // initialVariables を null にリセット
        initialVariables: {
            listData: null,
            listHead: null,
            pos: null, 
            i: null,
            prev: null,
            initialized: false, // トレースロジックで使用
        },
        // presets と logicVariants を追加
        traceOptions: {
            presets_array: [
                { 
                    label: 'Case 1: pos = 1 (先頭を削除)', 
                    value: { 
                        pos: 1, 
                        listData: [{ val: 'A', next: 1 }, { val: 'B', next: 2 }, { val: 'C', next: null }],
                        listHead: 0
                    } 
                },
                { 
                    label: 'Case 2: pos = 3 (3番目を削除)', 
                    value: { 
                        pos: 3,
                        listData: [{ val: 'A', next: 1 }, { val: 'B', next: 2 }, { val: 'C', next: 3 }, { val: 'D', next: null }],
                        listHead: 0
                    }
                },
                { 
                    label: 'Case 3: pos = 2 (2番目を削除)', 
                    value: { 
                        pos: 2,
                        listData: [{ val: 'A', next: 1 }, { val: 'B', next: 2 }, { val: 'C', next: null }],
                        listHead: 0
                    }
                },
            ],
            logicVariants: [
                { id: 'ア', label: 'ア: prev.next ← listHead' },
                { id: 'イ', label: 'イ: prev.next ← listHead.next' },
                { id: 'ウ', label: 'ウ: prev.next ← listHead.next.next' },
                { id: 'エ', label: 'エ: prev.next ← prev' },
                { id: 'オ', label: 'オ: prev.next ← prev.next' },
                { id: 'カ', label: 'カ: prev.next ← prev.next.next' },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 8
    },
    // =================================================================================
    // --- 問11: ビンソート ---
    // =================================================================================
    {
        id: '11',
        logicType: 'BIN_SORT',
        title: { ja: "サンプル問題 [科目B] 整列プログラム", en: "Sample Problem [Subject B] Q11" },
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
        difficultyId: 8
    },
    // =================================================================================
    // --- 問12: 配列の類似度計算 ---
    // =================================================================================
    {
        id: '12',
        logicType: 'SIMILARITY_RATIO',
        title: { ja: "サンプル問題 [科目B] 文字列同士の類似度を求めるプログラム", en: "Sample Problem [Subject B] Q12" },
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
        difficultyId: 8
    },
    // =================================================================================
    // --- 問13: 2分探索法 (バグあり) ---
    // =================================================================================
    {
        id: '13',
        logicType: 'BINARY_SEARCH',
        title: { ja: "サンプル問題 [科目B] 探索プログラム", en: "Sample Problem [Subject B] Q13" },
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
        // ユーザーが選択するまで変数をnullに設定
        initialVariables: {
            data: null,
            target: null,
            low: null,
            high: null,
            middle: null,
            result: null,
            initialized: false, // トレースロジックで使う初期化フラグ
        },
        // ユーザーがトレースするデータを選択できるようにプリセットを追加
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
        difficultyId: 8
    },
    // =================================================================================
    // --- 問14: 5数要約 ---
    // =================================================================================
    {
        id: '14',
        logicType: 'FIVE_NUMBER_SUMMARY',
        title: { ja: "サンプル問題 [科目B] 配列の特徴値を返すプログラム", en: "Sample Problem [Subject B] Q14" },
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
        difficultyId: 8
    },
    // =================================================================================
    // --- 問15: ミニマックス法 ---
    // =================================================================================
    {
        id: '15',
        logicType: 'MINIMAX',
        title: { ja: "サンプル問題 [科目B] 三目並べのプログラム", en: "Sample Problem [Subject B] Q15" },
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
        difficultyId: 8
    },
    // =================================================================================
    // --- 問16: UTF-8 エンコード ---
    // =================================================================================
    {
        id: '16',
        logicType: 'UTF8_ENCODE',
        title: { ja: "サンプル問題 [科目B] 文字列処理のプログラム", en: "Sample Problem [Subject B] Q16" },
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
        difficultyId: 7
    },
    // =================================================================================
    // --- 問17: セキュリティ（責任分界点） ---
    // =================================================================================
    {
        id: '17',
        logicType: 'STATIC_QA', // トレース機能がないことを示す
        title: { ja: "サンプル問題 [科目B] 脆弱性診断", en: "Sample Problem [Subject B] Q17" },
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
        difficultyId: 7
    },
    // =================================================================================
    // --- 問18: セキュリティ（BYODのリスク） ---
    // =================================================================================
    {
        id: '18',
        logicType: 'STATIC_QA', // トレース機能がないことを示す
        title: { ja: "サンプル問題 [科目B] 問18 セキュリティリスクの洗い出し", en: "Sample Problem [Subject B] Q18" },
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
        difficultyId: 7
    },
    // =================================================================================
    // --- 問19: 職務の分離と最小権限 ---
    // =================================================================================
    {
        id: '19',
        logicType: 'STATIC_QA', // トレース機能がないことを示す
        title: { ja: "サンプル問題 [科目B] アクセス管理", en: "Sample Problem [Subject B] Q19" },
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
        difficultyId: 7
    },
    // =================================================================================
    // --- 問20: 情報システム運用 ---
    // =================================================================================
    {
        id: '20',
        logicType: 'STATIC_QA', // トレース機能がないことを示す
        title: { ja: "サンプル問題 [科目B] 情報セキュリティ監査", en: "Sample Problem [Subject B] Q20" },
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
        difficultyId: 7
    },
    // =================================================================================
    // --- 問21: プログラムの条件分岐 ---
    // =================================================================================
    {
        id: '21',
        logicType: 'ADMISSION_FEE',
        title: { ja: "基本情報技術者試験 科目B プログラムの条件分岐", en: "Fundamental Information Technology Engineer Examination, Subject B, Question 21" },
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
        difficultyId: 7
    },
    // =================================================================================
    // --- 問22: 配列の要素の逆順化 ---
    // =================================================================================
    {
        id: '22',
        logicType: 'ARRAY_REVERSE',
        title: { ja: "基本情報技術者試験 科目B 配列の要素の逆順化", en: "Subject B Sample Problem Q22" },
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
        //logicVariants を追加
        traceOptions: {
            logicVariants: [
              { id: 'ア', label: 'ア: a: arrayの要素数 - left, b: array[left]' },
              { id: 'イ', label: 'イ: a: arrayの要素数 - left, b: array[right]' },
              { id: 'ウ', label: 'ウ: a: arrayの要素数 - left + 1, b: array[left]' },
              { id: 'エ', label: 'エ: a: arrayの要素数 - left + 1, b: array[right]' },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問23: 単方向リストへの要素追加 ---　動いていない
    // =================================================================================
    {
        id: '23',
        logicType: 'LINKED_LIST_APPEND',
        title: { ja: "基本情報技術者試験 科目B 単方向リストへの要素追加", en: "Subject B Sample Problem Q23" },
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
        difficultyId: 7
    },
    // =================================================================================
    // --- 問24: スパースマトリックスへの変換 ---
    // =================================================================================
    {
        id: '24',
        logicType: 'SPARSE_MATRIX',
        title: { ja: "基本情報技術者試験 科目B スパースマトリックスへの変換", en: "Subject B Sample Problem Q24" },
        description: {
            ja: "次の記述中の a 〜 c に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n要素の多くが0の行列を疎行列という。次のプログラムは，二次元配列に格納された行列のデータ量を削減するために，疎行列の格納に適したデータ構造に変換する。関数 transformSparseMatrix は，引数 matrix で二次元配列として与えられた行列を，整数型配列の配列に変換して返す。関数 transformSparseMatrix を transformSparseMatrix({{3, 0, 0, 0, 0}, {0, 2, 2, 0, 0}, {0, 0, 0, 1, 3}, {0, 0, 0, 2, 0}, {0, 0, 0, 0, 1}})として呼び出したときの戻り値は，{{ a }, { b }, { c }} である。",
            en: "Select the correct combination for a, b, and c from the answer choices. Array indices start from 1. A matrix where most elements are zero is called a sparse matrix. The following program converts a matrix stored in a 2D array into a data structure suitable for storing a sparse matrix to reduce data volume. The function transformSparseMatrix converts a matrix given as a 2D array in the argument matrix and returns it as an array of integer arrays. When called as transformSparseMatrix(...), the return value is {{a}, {b}, {c}}."
        },
        programLines: {
            ja: [
                ' 1: ○整数型配列の配列: transformSparseMatrix(整数型の二次元配列: matrix)',
                ' 2:   整数型: i, j',
                ' 3:   整数型配列の配列: sparseMatrix',
                ' 4:   sparseMatrix ← {{}, {}, {}}',
                ' 5:   for (i を 1 から matrixの行数 まで 1 ずつ増やす)',
                ' 6:     for (j を 1 から matrixの列数 まで 1 ずつ増やす)',
                ' 7:       if (matrix[i, j] が 0 でない)',
                ' 8:         sparseMatrix[1]の末尾に iの値 を追加する',
                ' 9:         sparseMatrix[2]の末尾に jの値 を追加する',
                '10:         sparseMatrix[3]の末尾に matrix[i, j]の値 を追加する',
                '11:       endif',
                '12:     endfor',
                '13:   endfor',
                '14:   return sparseMatrix',
            ],
            en: [ /* ... */ ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'a:{1,2,2,3,3,4,5}, b:{1,2,3,4,5,4,5}, c:{3,2,2,1,2,3,1}' },
                { label: 'イ', value: 'a:{1,2,2,3,3,4,5}, b:{1,2,3,4,5,4,5}, c:{3,2,2,1,3,2,1}' },
                { label: 'ウ', value: 'a:{1,2,3,4,5,4,5}, b:{1,2,2,3,3,4,5}, c:{3,2,2,1,3,2,1}' },
                { label: 'エ', value: 'a:{1,2,3,4,5,4,5}, b:{1,2,2,3,3,4,5}, c:{3,2,2,1,2,3,1}' },
            ],
            en: [ /* ... */ ]
        },
        correctAnswer: 'a:{1,2,2,3,3,4,5}, b:{1,2,3,4,5,4,5}, c:{3,2,2,1,3,2,1}',
        explanationText: {
            ja: "このプログラムは、二次元配列`matrix`を左上から右下に向かって全探索し、値が0でない要素を見つけるたびに、その要素の「行番号(i)」「列番号(j)」「値」をそれぞれ`sparseMatrix`の1番目、2番目、3番目の配列に格納していくものです。\n\n1. (1,1)の要素`3`が見つかる → sparseMatrixは {{1},{1},{3}} となる\n2. (2,2)の要素`2`が見つかる → sparseMatrixは {{1,2},{1,2},{3,2}} となる\n3. (2,3)の要素`2`が見つかる → sparseMatrixは {{1,2,2},{1,2,3},{3,2,2}} となる\n4. (3,4)の要素`1`が見つかる → sparseMatrixは {{1,2,2,3},{1,2,3,4},{3,2,2,1}} となる\n5. (3,5)の要素`3`が見つかる → sparseMatrixは {{1,2,2,3,3},{1,2,3,4,5},{3,2,2,1,3}} となる\n6. (4,4)の要素`2`が見つかる → sparseMatrixは {{1,2,2,3,3,4},{1,2,3,4,5,4},{3,2,2,1,3,2}} となる\n7. (5,5)の要素`1`が見つかる → sparseMatrixは {{1,2,2,3,3,4,5},{1,2,3,4,5,4,5},{3,2,2,1,3,2,1}} となる\n\n最終的に得られる3つの配列は、選択肢「イ」と一致します。",
            en: "This program iterates through the 2D array `matrix` from top-left to bottom-right. Whenever it finds a non-zero element, it stores its 'row index (i)', 'column index (j)', and 'value' into the first, second, and third arrays of `sparseMatrix`, respectively. The final resulting arrays match option 'イ'."
        },
        initialVariables: {
            matrix: [
                [3, 0, 0, 0, 0], 
                [0, 2, 2, 0, 0], 
                [0, 0, 0, 1, 3], 
                [0, 0, 0, 2, 0], 
                [0, 0, 0, 0, 1]
            ],
            i: null,
            j: null,
            sparseMatrix: null,
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問25: 条件付き確率の計算 --- 動いていない
    // =================================================================================
    {
        id: '25',
        logicType: 'CONDITIONAL_PROBABILITY',
        title: { 
            ja: "基本情報技術者試験 科目B 条件付き確率の計算", 
            en: "Subject B Sample Problem Q25" 
        },
        description: {
            ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。\n\n任意の異なる2文字をc1, c2とするとき，英単語群に含まれる英単語において，c1の次にc2が出現する割合を求めるプログラムである。英単語は，英小文字だけから成る。英単語の末尾の文字がc1である場合，その箇所は割合の計算に含めない。例えば，図に示す4語の英単語から成る英単語群において，c1を\"n\", c2を\"f\"とすると，英単語の末尾の文字以外に\"n\"は五つあり，そのうち次の文字が\"f\"であるものは二つである。したがって，求める割合は，2÷5＝0.4である。c1とc2の並びが一度も出現しない場合，c1の出現回数によらず割合を0と定義する。\n\nプログラムにおいて，英単語群は Words 型の大域変数 words に格納されている。クラス Words のメソッドの説明を，表に示す。本問において，文字列に対する演算子\"+\"は，文字列の連結を表す。また，整数に対する演算子\"÷\"は，実数として計算する。",
            en: "Select the correct answer for the blank in the following program from the answer choices.\n\nGiven any two different characters c1 and c2, this is a program that calculates the proportion at which c2 appears after c1 in a corpus of English words. The English words consist only of lowercase letters. If c1 is the last character of a word, that instance is not included in the calculation. For example, in the given corpus of four English words, if c1 is 'n' and c2 is 'f', there are five instances of 'n' that are not at the end of a word, and of those, two are followed by 'f'. Therefore, the desired proportion is 2 ÷ 5 = 0.4. If the sequence c1 followed by c2 never appears, the proportion is defined as 0, regardless of the number of occurrences of c1.\n\nIn the program, the corpus of English words is stored in a global variable 'words' of type Words. The methods of the Words class are described in the table. In this problem, the '+' operator on strings represents string concatenation, and the '÷' operator on integers represents real number division."
        },
        programLines: {
            ja: [
                '1: /* c1の次にc2が出現する割合を返す */',
                '2: ○実数型: prob(文字型: c1, 文字型: c2)',
                '3:   文字列型: s1 ← c1の1文字だけから成る文字列',
                '4:   文字列型: s2 ← c2の1文字だけから成る文字列',
                '5:   if (words.freq(s1 + s2) が 0 より大きい)',
                '6:     return [                                                  ]',
                '7:   else',
                '8:     return 0',
                '9:   endif'
            ],
            en: [
                '1: /* Returns the probability of c2 appearing after c1 */',
                '2: ○function prob(char: c1, char: c2) -> real',
                '3:   string: s1 ← string consisting of the single character c1',
                '4:   string: s2 ← string consisting of the single character c2',
                '5:   if (words.freq(s1 + s2) > 0)',
                '6:     return [                                                  ]',
                '7:   else',
                '8:     return 0',
                '9:   endif'
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '(words.freq(s1) - words.freqE(s1)) ÷ words.freq(s1 + s2)' },
                { label: 'イ', value: '(words.freq(s2) - words.freqE(s2)) ÷ words.freq(s1 + s2)' },
                { label: 'ウ', value: 'words.freq(s1 + s2) ÷ (words.freq(s1) - words.freqE(s1))' },
                { label: 'エ', value: 'words.freq(s1 + s2) ÷ (words.freq(s2) - words.freqE(s2))' },
            ],
            en: [
                { label: 'A', value: '(words.freq(s1) - words.freqE(s1)) / words.freq(s1 + s2)' },
                { label: 'B', value: '(words.freq(s2) - words.freqE(s2)) / words.freq(s1 + s2)' },
                { label: 'C', value: 'words.freq(s1 + s2) / (words.freq(s1) - words.freqE(s1))' },
                { label: 'D', value: 'words.freq(s1 + s2) / (words.freq(s2) - words.freqE(s2))' },
            ]
        },
        correctAnswer: 'words.freq(s1 + s2) ÷ (words.freq(s1) - words.freqE(s1))',
        explanationText: {
            ja: "求める割合は「c1の次にc2が出現する数」を「c1が単語の末尾以外で出現する数」で割ることで計算できます。\n\n1. 【分子】 c1の次にc2が出現する数:\nこれは、文字列`s1 + s2`（例: `\"nf\"`）が全体で出現する回数に等しいです。プログラムでは `words.freq(s1 + s2)` で表されます。\n\n2. 【分母】 c1が単語の末尾以外で出現する数:\nこれは、c1の総出現数から、c1が末尾で出現する数を引けば求まります。\n・c1の総出現数: `words.freq(s1)`\n・c1が末尾で出現する数: `words.freqE(s1)`\nしたがって、分母は `words.freq(s1) - words.freqE(s1)` となります。\n\nよって、これらを組み合わせた「ウ」の式が適切です。",
            en: "The desired proportion can be calculated by dividing 'the number of times c2 appears after c1' by 'the number of times c1 appears, excluding at the end of a word'.\n\n1. [Numerator] Number of times c2 appears after c1:\nThis is equal to the total number of occurrences of the string `s1 + s2` (e.g., `\"nf\"`). In the program, this is represented by `words.freq(s1 + s2)`.\n\n2. [Denominator] Number of times c1 appears, excluding at the end of a word:\nThis can be found by subtracting the number of times c1 appears at the end of a word from the total number of occurrences of c1.\n- Total occurrences of c1: `words.freq(s1)`\n- Occurrences of c1 at the end of a word: `words.freqE(s1)`\nTherefore, the denominator is `words.freq(s1) - words.freqE(s1)`.\n\nThus, the expression in option 'C', which combines these, is the correct choice."
        },
        initialVariables: {
            c1: null,
            c2: null,
            s1: null,
            s2: null,
            freq_s1_s2: null,
            freq_s1: null,
            freqE_s1: null,
            denominator: null,
            result: null,
        },
        traceOptions: {
            presets_array: [
                { label: 'Case1: c1="n", c2="f"', value: { c1: 'n', c2: 'f' } },
                { label: 'Case2: c1="t", c2="i"', value: { c1: 't', c2: 'i' } },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問26: 情報セキュリティ（責任分界点） ---
    // =================================================================================
    {
        id: '26',
        logicType: 'STATIC_QA',
        title: { 
            ja: "基本情報技術者試験 科目B 情報セキュリティ(責任分界点)", 
            en: "Subject B Sample Problem Q26" 
        },
        description: {
            ja: "製造業のA社では，ECサイト（以下，A社のECサイトをAサイトという）を使用し，個人向けの製品販売を行っている。Aサイトは，A社の製品やサービスが検索可能で，ログイン機能を有しており，あらかじめAサイトに利用登録した個人（以下，会員という）の氏名やメールアドレスといった情報（以下，会員情報という）を管理している。Aサイトは，B社のPaaSで稼働しており，PaaS上のDBMSとアプリケーションサーバを利用している。\nA社は，Aサイトの開発，運用をC社に委託している。A社とC社との間の委託契約では，Webアプリケーションプログラムの脆弱性対策は，C社が実施するとしている。\n\n最近，A社の同業他社が運営しているWebサイトで脆弱性が悪用され，個人情報が漏えいするという事件が発生した。そこでA社は，セキュリティ診断サービスを行っているD社に，Aサイトの脆弱性診断を依頼した。脆弱性診断の結果，対策が必要なセキュリティ上の脆弱性が複数指摘された。図1にD社からの指摘事項を示す。\n\n(一) Aサイトで利用しているDBMSに既知の脆弱性があり，脆弱性を悪用した攻撃を受けるおそれがある。\n(二) Aサイトで利用しているアプリケーションサーバのOSに既知の脆弱性があり，脆弱性を悪用した攻撃を受けるおそれがある。\n(三) ログイン機能に脆弱性があり，Aサイトのデータベースに蓄積された情報のうち，会員には非公開の情報を閲覧されるおそれがある。\n\n【設問】\n図1中の項番(一)〜(三)それぞれに対処する組織の適切な組合せを，解答群の中から選べ。",
            en: "Company A, a manufacturer, uses an e-commerce site (Site A) for B2C product sales. Site A, which allows searching for Company A's products and services and has a login function, manages member information such as names and email addresses of individuals registered on the site. Site A operates on Company B's PaaS, utilizing the DBMS and application server on the PaaS. Company A has outsourced the development and operation of Site A to Company C. The outsourcing contract between A and C states that Company C is responsible for vulnerability countermeasures for the web application program.\n\nRecently, an incident occurred where a vulnerability was exploited on a competitor's website, leading to a personal information leak. Consequently, Company A commissioned Company D, a security diagnostic service provider, to perform a vulnerability assessment of Site A. The assessment pointed out several security vulnerabilities requiring countermeasures. Figure 1 shows the findings from Company D.\n\n(1) There is a known vulnerability in the DBMS used by Site A, posing a risk of exploitation.\n(2) There is a known vulnerability in the OS of the application server used by Site A, posing a risk of exploitation.\n(3) There is a vulnerability in the login function, posing a risk that non-public member information stored in Site A's database could be viewed.\n\n[Question]\nFor each item (1) to (3) in Figure 1, select the appropriate combination of organizations responsible for addressing them from the answer choices."
        },
        programLines: { 
            ja: [], 
            en: [] 
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '項番(一):A社, 項番(二):A社, 項番(三):A社' },
                { label: 'イ', value: '項番(一):A社, 項番(二):A社, 項番(三):C社' },
                { label: 'ウ', value: '項番(一):A社, 項番(二):B社, 項番(三):B社' },
                { label: 'エ', value: '項番(一):B社, 項番(二):B社, 項番(三):B社' },
                { label: 'オ', value: '項番(一):B社, 項番(二):B社, 項番(三):C社' },
                { label: 'カ', value: '項番(一):B社, 項番(二):C社, 項番(三):B社' },
                { label: 'キ', value: '項番(一):B社, 項番(二):C社, 項番(三):C社' },
                { label: 'ク', value: '項番(一):C社, 項番(二):B社, 項番(三):B社' },
                { label: 'ケ', value: '項番(一):C社, 項番(二):B社, 項番(三):C社' },
                { label: 'コ', value: '項番(一):C社, 項番(二):C社, 項番(三):B社' }
            ],
            en: [
                { label: 'A', value: 'Item(1):Co. A, Item(2):Co. A, Item(3):Co. A' },
                { label: 'B', value: 'Item(1):Co. A, Item(2):Co. A, Item(3):Co. C' },
                { label: 'C', value: 'Item(1):Co. A, Item(2):Co. B, Item(3):Co. B' },
                { label: 'D', value: 'Item(1):Co. B, Item(2):Co. B, Item(3):Co. B' },
                { label: 'E', value: 'Item(1):Co. B, Item(2):Co. B, Item(3):Co. C' },
                { label: 'F', value: 'Item(1):Co. B, Item(2):Co. C, Item(3):Co. B' },
                { label: 'G', value: 'Item(1):Co. B, Item(2):Co. C, Item(3):Co. C' },
                { label: 'H', value: 'Item(1):Co. C, Item(2):Co. B, Item(3):Co. B' },
                { label: 'I', value: 'Item(1):Co. C, Item(2):Co. B, Item(3):Co. C' },
                { label: 'J', value: 'Item(1):Co. C, Item(2):Co. C, Item(3):Co. B' }
            ]
        },
        correctAnswer: '項番(一):B社, 項番(二):B社, 項番(三):C社',
        explanationText: {
            ja: "【項番1について】\nAサイトは、B社のPaaS上のDBMSを利用しています。PaaS (Platform as a Service) は、OSやミドルウェア（DBMSなど）を含めたプラットフォームをサービスとして提供するものです。PaaSにおいては、プラットフォームの維持管理（脆弱性管理を含む）はサービス提供者側の責任で行われるため、DBMSの脆弱性に対処するのは「B社」となります。\n\n【項番2について】\n項番1と同様に、アプリケーションサーバのOSもB社のPaaSとして提供されているプラットフォームの一部です。したがって、この脆弱性に対処するのもサービス提供者である「B社」となります。\n\n【項番3について】\nAサイトのうち検索機能やログイン機能の部分はWebアプリケーションであり、その実装上の不備が原因です。問題文の契約内容から、AサイトのWebアプリケーションの脆弱性対策は「C社」が対処すべき事案となります。\n\nしたがって「オ」の組合せが適切です。",
            en: "[Regarding Item 1]\nSite A uses the DBMS on Company B's PaaS. In a PaaS (Platform as a Service) model, the service provider is responsible for maintaining the platform, including the OS and middleware like the DBMS. Therefore, addressing the DBMS vulnerability is the responsibility of 'Company B'.\n\n[Regarding Item 2]\nSimilar to Item 1, the application server's OS is part of the platform provided as PaaS by Company B. Thus, addressing this vulnerability is also the responsibility of the service provider, 'Company B'.\n\n[Regarding Item 3]\nThe login functionality is part of the web application. The issue stems from a flaw in its implementation. According to the contract described in the problem, countermeasures for web application vulnerabilities are the responsibility of 'Company C'.\n\nTherefore, the combination in option 'E' is the correct one."
        },
        initialVariables: {},
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問27: 素数探索（試し割り法） ---
    // =================================================================================
    {
        id: '27',
        logicType: 'PRIME_NUMBER',
        title: { 
            ja: "令和5年 科目B 素数探査(試し割り法)", 
            en: "Reiwa 5, Subject B, Question 1" 
        },
        description: {
            ja: "次のプログラム中の a と b に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n関数 findPrimeNumbers は，引数で与えられた整数以下の，全ての素数だけを格納した配列を返す関数である。ここで，引数に与える整数は2以上である。",
            en: "Select the correct combination for a and b in the following program from the answer choices. Here, array indices start from 1.\n\nThe function findPrimeNumbers takes an integer as an argument and returns an array containing only all the prime numbers less than or equal to that integer. The integer given as an argument is 2 or greater."
        },
        programLines: {
            ja: [
                ' 1: ○整数型の配列: findPrimeNumbers(整数型: num)',
                ' 2:   整数型の配列: pnList ← {}',
                ' 3:   整数型: i, j',
                ' 4:   論理型: divideFlag',
                ' 5:   for (i を 2 から [   a   ] まで 1 ずつ増やす)',
                ' 6:     divideFlag ← true',
                ' 7:     /* iの正の平方根の整数部分が2未満のときは、繰返し処理を実行しない */',
                ' 8:     for (j を 2 から iの正の平方根の整数部分 まで 1 ずつ増やす) // α',
                ' 9:       if ([      b      ])',
                '10:         divideFlag ← false',
                '11:         αの行から始まる繰返し処理を終了する',
                '12:       endif',
                '13:     endfor',
                '14:     if (divideFlag が true と等しい)',
                '15:       pnListの末尾に iの値を 追加する',
                '16:     endif',
                '17:   endfor',
                '18:   return pnList',
            ],
            en: [
                ' 1: ○function findPrimeNumbers(integer: maxNum) -> array of integers',
                ' 2:   array of integers: pnList ← {}',
                ' 3:   integer: i, j',
                ' 4:   boolean: divideFlag',
                ' 5:   for (i from 2 to [   a   ] step 1)',
                ' 6:     divideFlag ← true',
                ' 7:     /* If the integer part of the square root of i is less than 2, do not execute the loop */',
                ' 8:     for (j from 2 to integer part of sqrt(i) step 1) // α',
                ' 9:       if ([      b      ])',
                '10:         divideFlag ← false',
                '11:         terminate the loop starting from line α',
                '12:       endif',
                '13:     endfor',
                '14:     if (divideFlag is equal to true)',
                '15:       append value of i to the end of pnList',
                '16:     endif',
                '17:   endfor',
                '18:   return pnList',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'a: num, b: i ÷ j の余り が 0 と等しい' }, 
                { label: 'イ', value: 'a: num, b: i ÷ j の商 が 1 と等しくない' }, 
                { label: 'ウ', value: 'a: num + 1, b: i ÷ j の余り が 0 と等しい' }, 
                { label: 'エ', value: 'a: num + 1, b: i ÷ j の商 が 1 と等しくない' },
            ],
            en: [
                { label: 'A', value: 'a: num, b: remainder of i ÷ j is 0' },
                { label: 'B', value: 'a: num, b: quotient of i ÷ j is not 1' }, 
                { label: 'C', value: 'a: num + 1, b: remainder of i ÷ j is 0' }, 
                { label: 'D', value: 'a: num + 1, b: quotient of i ÷ j is not 1' },  
            ]
        },
        correctAnswer: 'a: num, b: i ÷ j の余り が 0 と等しい',
        explanationText: {
            ja: "素数とは、1とその数自身以外に約数を持たない2以上の自然数です。このプログラムは「試し割り法」というアルゴリズムで素数判定を行っています。\n\n【aについて】\n関数は引数 `maxNum` 以下の全ての素数を探すため、外側のループは2から`maxNum`まで繰り返すのが適切です。`maxNum + 1`にすると、指定された範囲を超えてしまいます。\n\n【bについて】\n内側のループは、現在調べている数 `i` が素数かどうかを判定する部分です。`i` が `j` で割り切れる場合、`i` は素数ではありません。割り切れるとは「余りが0である」ということなので、`if`文の条件は「`i ÷ j` の余りが `0` と等しい」となります。この条件が真になると`divideFlag`が`false`になり、その後の処理で`pnList`に`i`が追加されなくなります。\n\nしたがって、正しい組み合わせは「ア」です。",
            en: "A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself. This program uses the 'trial division' algorithm to determine if a number is prime.\n\n[Regarding a]\nSince the function is intended to find all prime numbers up to `maxNum`, it is appropriate for the outer loop to iterate from 2 to `maxNum`. Using `maxNum + 1` would exceed the specified range.\n\n[Regarding b]\nThe inner loop determines whether the current number `i` is prime. If `i` is divisible by `j`, then `i` is not a prime number. Being divisible means 'the remainder is 0'. Therefore, the condition for the `if` statement is 'the remainder of `i ÷ j` is equal to `0`'. When this condition is true, `divideFlag` is set to `false`, preventing `i` from being added to `pnList` later.\n\nTherefore, the correct combination is 'A'."
        },
        initialVariables: {
            num: null, //
            pnList: null,
            i: null,
            j: null,
            divideFlag: null,
            sqrt_i: null, // 平方根の整数部分をトレースするための補助変数
        },
        traceOptions: {
            presets: [10, 30],
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 8
    },
    {
        id: '28',
        logicType: 'CALL_STACK',
        title: { 
            ja: "令和5年 科目B 関数によるコールスタック式文字出力", 
            en: "Reiwa 5, Subject B, Question 2" 
        },
        description: {
            ja: "次の記述中の□に入れる正しい答えを，解答群の中から選べ。\n\n次のプログラムにおいて，手続 proc2 を呼び出すと，□の順に出力される。",
            en: "Select the correct answer for the blank from the answer choices.\n\nIn the following program, when the procedure proc2 is called, the output is printed in the order of [ ]."
        },
        programLines: {
            ja: [
                ' 1: ○proc1()',
                ' 2:   "A" を出力する',
                ' 3:   proc3()',
                ' 4: ',
                ' 5: ○proc2()',
                ' 6:   proc3()',
                ' 7:   "B" を出力する',
                ' 8:   proc1()',
                ' 9: ',
                '10: ○proc3()',
                '11:   "C" を出力する',
            ],
            en: [
                ' 1: ○procedure proc1()',
                ' 2:   print "A"',
                ' 3:   call proc3()',
                ' 4: ',
                ' 5: ○procedure proc2()',
                ' 6:   call proc3()',
                ' 7:   print "B"',
                ' 8:   call proc1()',
                ' 9: ',
                '10: ○procedure proc3()',
                '11:   print "C"',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '"A", "B", "B", "C"' },
                { label: 'イ', value: '"A", "C"' },
                { label: 'ウ', value: '"A", "C", "B", "C"' },
                { label: 'エ', value: '"B", "A", "B", "C"' },
                { label: 'オ', value: '"B", "C", "B", "A"' },
                { label: 'カ', value: '"C", "B"' },
                { label: 'キ', value: '"C", "B", "A"' },
                { label: 'ク', value: '"C", "B", "A", "C"' },
            ],
            en: [
                { label: 'A', value: '"A", "B", "B", "C"' },
                { label: 'B', value: '"A", "C"' },
                { label: 'C', value: '"A", "C", "B", "C"' },
                { label: 'D', value: '"B", "A", "B", "C"' },
                { label: 'E', value: '"B", "C", "B", "A"' },
                { label: 'F', value: '"C", "B"' },
                { label: 'G', value: '"C", "B", "A"' },
                { label: 'H', value: '"C", "B", "A", "C"' },
            ]
        },
        correctAnswer: '"C", "B", "A", "C"',
        explanationText: {
            ja: "手続き（関数）の呼び出しは「コールスタック」という仕組みで管理されます。呼び出された手続きが終了すると、処理は呼び出し元の次の行に戻ります。この流れを追いかけます。\n\n1. `proc2` を呼び出し\n2. `proc2`が `proc3` を呼び出す\n3. `proc3`が `\"C\"` を出力し、終了。処理は`proc2`に戻る\n4. `proc2`が `\"B\"` を出力する\n5. `proc2`が `proc1` を呼び出す\n6. `proc1`が `\"A\"` を出力する\n7. `proc1`が `proc3` を呼び出す\n8. `proc3`が `\"C\"` を出力し、終了。処理は`proc1`に戻る\n9. `proc1`が終了。処理は`proc2`に戻る\n10. `proc2`が終了。\n\n出力された文字を順番に並べると「C, B, A, C」となり、「ク」が正解です。",
            en: "Procedure (function) calls are managed by a mechanism called the 'call stack'. When a called procedure finishes, execution returns to the next line of the caller. Let's trace this flow.\n\n1. Call `proc2`\n2. `proc2` calls `proc3`\n3. `proc3` prints `\"C\"` and finishes, returning to `proc2`\n4. `proc2` prints `\"B\"`\n5. `proc2` calls `proc1`\n6. `proc1` prints `\"A\"`\n7. `proc1` calls `proc3`\n8. `proc3` prints `\"C\"` and finishes, returning to `proc1`\n9. `proc1` finishes, returning to `proc2`\n10. `proc2` finishes.\n\nThe sequence of printed characters is 'C', 'B', 'A', 'C', which corresponds to option 'H'."
        },
        initialVariables: {
            output: [],
            callStack: [],
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問29: クイックソートのトレース ---
    // =================================================================================
    {
        id: '29',
        logicType: 'QUICKSORT_TRACE',
        title: { 
            ja: "令和5年 科目B クイックソートのトレース", 
            en: "Reiwa 5, Subject B, Question 3" 
        },
        description: {
            ja: "次の記述中の□に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n次の手続 sort は，大域の整数型の配列 data の，引数 first で与えられた要素番号から引数 last で与えられた要素番号までの要素を昇順に整列する。ここで，first < last とする。手続 sort を sort(1, 5) として呼び出すと，/*** α ***/ の行を最初に実行したときの出力は\"□\"となる。",
            en: "Select the correct answer for the blank from the answer choices. Here, array indices start from 1.\n\nThe following procedure 'sort' sorts the elements of a global integer array 'data' from the element number given by the argument 'first' to the element number given by 'last' in ascending order. Here, first < last. When the procedure 'sort' is called as sort(1, 5), the output when the line marked /*** α ***/ is first executed is \"[ ]\"."
        },
        programLines: {
            ja: [
                ' 1: ○sort(整数型: first, 整数型: last)',
                ' 2:   整数型: pivot, i, j',
                ' 3:   pivot ← data[(first + last) ÷ 2の商]',
                ' 4:   i ← first',
                ' 5:   j ← last',
                ' 6: ',
                ' 7:   while (true)',
                ' 8:     while (data[i] < pivot)',
                ' 9:       i ← i + 1',
                '10:     endwhile',
                '11:     while (pivot < data[j])',
                '12:       j ← j - 1',
                '13:     endwhile',
                '14:     if (i ≧ j)',
                '15:       繰返し処理を終了する',
                '16:     endif',
                '17:     data[i]とdata[j]の値を入れ替える',
                '18:     i ← i + 1',
                '19:     j ← j - 1',
                '20:   endwhile',
                '21: ',
                '22:   dataの全要素の値を要素番号の順に空白区切りで出力する /*** α ***/',
                '23: ',
                '24:   if (first < i - 1)',
                '25:     sort(first, i - 1)',
                '26:   endif',
                '27:   if (j + 1 < last)',
                '28:     sort(j + 1, last)',
                '29:   endif',
            ],
            en: [
                ' 1: ○procedure sort(integer: first, integer: last)',
                ' 2:   integer: pivot, i, j',
                ' 3:   pivot ← data[floor((first + last) / 2)]',
                ' 4:   i ← first',
                ' 5:   j ← last',
                ' 6: ',
                ' 7:   while (true)',
                ' 8:     while (data[i] < pivot)',
                ' 9:       i ← i + 1',
                '10:     endwhile',
                '11:     while (pivot < data[j])',
                '12:       j ← j - 1',
                '13:     endwhile',
                '14:     if (i >= j)',
                '15:       break from loop',
                '16:     endif',
                '17:     swap values of data[i] and data[j]',
                '18:     i ← i + 1',
                '19:     j ← j - 1',
                '20:   endwhile',
                '21: ',
                '22:   print all elements of data separated by spaces /*** α ***/',
                '23: ',
                '24:   if (first < i - 1)',
                '25:     sort(first, i - 1)',
                '26:   endif',
                '27:   if (j + 1 < last)',
                '28:     sort(j + 1, last)',
                '29:   endif',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '1 2 3 4 5' },
                { label: 'イ', value: '1 2 3 5 4' },
                { label: 'ウ', value: '2 1 3 4 5' },
                { label: 'エ', value: '2 1 3 5 4' },
            ],
            en: [
                { label: 'A', value: '1 2 3 4 5' },
                { label: 'B', value: '1 2 3 5 4' },
                { label: 'C', value: '2 1 3 4 5' },
                { label: 'D', value: '2 1 3 5 4' },
            ]
        },
        correctAnswer: '2 1 3 5 4',
        explanationText: {
            ja: "このプログラムは、クイックソートアルゴリズムを実装したものです。`sort(1, 5)`が最初に呼び出されたときの処理を追います。\n1. `data`配列は`{2, 1, 3, 5, 4}`です。\n2. `pivot`は`data[(1+5)÷2の商]`、つまり`data[3]`の値`3`に設定されます。\n3. `i`は`1`、`j`は`5`で初期化されます。\n4. 最初の`while(data[i] < pivot)`ループでは、`data[i]`が`pivot`の`3`以上になるまで`i`が増加します。`data[1]=2`, `data[2]=1`は`3`より小さいので`i`は`3`まで進みます。\n5. 次の`while(pivot < data[j])`ループでは、`data[j]`が`pivot`の`3`以下になるまで`j`が減少します。`data[5]=4`, `data[4]=5`は`3`より大きいので`j`は`3`まで戻ります。\n6. この時点で `i=3`, `j=3` となり、`if(i ≧ j)`の条件が真になります。\n7. `while(true)`ループが終了します。この時点では、要素の入れ替え(`swap`)は一度も行われていません。\n8. `/*** α ***/`の行に到達し、配列`data`の全要素が出力されます。配列は変更されていないため、初期値と同じ`{2, 1, 3, 5, 4}`が出力されます。\nしたがって、「エ」が正解です。",
            en: "This program implements the quicksort algorithm. Let's trace the execution when `sort(1, 5)` is first called.\n1. The `data` array is `{2, 1, 3, 5, 4}`.\n2. The `pivot` is set to `data[floor((1+5)/2)]`, which is `data[3]`, so `pivot = 3`.\n3. `i` is initialized to `1`, `j` to `5`.\n4. In the first `while(data[i] < pivot)` loop, `i` is incremented until `data[i]` is not less than `3`. This happens when `i` reaches `3`.\n5. In the next `while(pivot < data[j])` loop, `j` is decremented until `data[j]` is not greater than `3`. This happens when `j` reaches `3`.\n6. At this point, `i=3` and `j=3`, so the condition `if(i >= j)` becomes true.\n7. The `while(true)` loop terminates. Note that the swap operation was never executed.\n8. The line `/*** α ***/` is reached, and the elements of the `data` array are printed. Since the array has not been modified, the output is the initial sequence: `2 1 3 5 4`.\nTherefore, 'D' is the correct answer."
        },
        initialVariables: {
            data: null,
            callStack: [],
            pivot: null,
            i: null,
            j: null,
            output: null,
        },
        // presets_array を追加
        traceOptions: {
            presets_array: [
              { label: 'ア: data:{1, 2, 3, 4, 5}', value: { data: [1, 2, 3, 4, 5] } },
              { label: 'イ: data:{1, 2, 3, 5, 4}', value: { data: [1, 2, 3, 5, 4] } },
              { label: 'ウ: data:{2, 1, 3, 4, 5}', value: { data: [2, 1, 3, 4, 5] } },
              { label: 'エ: data:{2, 1, 3, 5, 4}', value: { data: [2, 1, 3, 5, 4] } },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 8
    },
    // =================================================================================
    // --- 問30: 単方向リストへの要素追加 --- 動かない
    // =================================================================================
    {
        id: '30',
        logicType: 'LINKED_LIST_APPEND',
        title: { ja: "令和5年 科目B 単方向リストへの要素追加", en: "Subject B Sample Problem Q30" },
        description: {
            ja: "次のプログラム中の a と b に入れる正しい答えの組合せを，解答群の中から選べ。\n\n手続 append は，引数で与えられた文字を単方向リストに追加する手続である。単方向リストの各要素は，クラス ListElement を用いて表現する。ListElement 型の変数はクラス ListElement のインスタンスの参照を格納するものとする。大域変数 listHead は，単方向リストの先頭の要素の参照を格納する。リストが空のときは，listHead は未定義である。",
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
        initialized: false,
        listData: null,
        listHead: null,
        qVal: null,
        prev: null,
        curr: null,
        },
        // 2: traceOptions の 'value' が実際のデータをセットするように変更
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
                        initialized: false 
                    } 
                },
                { 
                    label: 'Case2: 既存リストに "D" を追加', 
                    value: { 
                        // 既存のリストデータ (A->B->C)
                        listData: [{val: 'A', next: 1}, {val: 'B', next: 2}, {val: 'C', next: null}], 
                        listHead: 0,
                        qVal: 'D',
                        prev: null,
                        curr: null,
                        initialized: false 
                    } 
                },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 8
    },
    // =================================================================================
    // --- 問31: コサイン類似度 ---
    // =================================================================================
    {
        id: '31',
        logicType: 'COSINE_SIMILARITY',
        title: { 
            ja: "令和5年 科目B コサイン類似度", 
            en: "Reiwa 5, Subject B, Question 5" 
        },
        description: {
            ja: "次のプログラム中の a と b に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\nコサイン類似度は，二つのベクトルの向きの類似性を測る尺度である。関数 calcCosineSimilarity は，いずれも要素数が n(n≧1) である実数型の配列 vector1 と vector2 を受け取り，二つの配列のコサイン類似度を返す。配列 vector1 が {a1, a2, ... , an}，配列 vector2 が {b1, b2, ... , bn} のとき，コサイン類似度は数式で計算される。ここで，配列 vector1 と配列 vector2 のいずれも，全ての要素に0が格納されていることはないものとする。",
            en: "Select the correct combination for a and b from the answer choices. Array indices start from 1.\n\nCosine similarity is a measure of the similarity between the directions of two vectors. The function calcCosineSimilarity takes two real-valued arrays, vector1 and vector2, both of length n (n>=1), and returns their cosine similarity. If vector1 is {a1, a2, ..., an} and vector2 is {b1, b2, ..., bn}, the cosine similarity is calculated by the formula shown. It is assumed that neither vector1 nor vector2 consists entirely of zeros."
        },
        programLines: {
            ja: [
                ' 1: ○実数型: calcCosineSimilarity(実数型の配列: vector1, 実数型の配列: vector2)',
                ' 2:   実数型: similarity, numerator, denominator, temp ← 0',
                ' 3:   整数型: i',
                ' 4:   numerator ← 0',
                ' 5: ',
                ' 6:   for (i を 1 から vector1の要素数 まで 1 ずつ増やす)',
                ' 7:     numerator ← numerator + [      a      ]',
                ' 8:   endfor',
                ' 9: ',
                '10:   for (i を 1 から vector1の要素数 まで 1 ずつ増やす)',
                '11:     temp ← temp + vector1[i]の2乗',
                '12:   endfor',
                '13:   denominator ← tempの正の平方根',
                '14: ',
                '15:   temp ← 0',
                '16:   for (i を 1 から vector2の要素数 まで 1 ずつ増やす)',
                '17:     temp ← temp + vector2[i]の2乗',
                '18:   endfor',
                '19:   denominator ← [      b      ]',
                '20: ',
                '21:   similarity ← numerator ÷ denominator',
                '22:   return similarity'
            ],
            en: [
                ' 1: ○function calcCosineSimilarity(array: vector1, array: vector2) -> real',
                ' 2:   real: similarity, numerator, denominator, temp ← 0',
                ' 3:   integer: i',
                ' 4:   numerator ← 0',
                ' 5: ',
                ' 6:   for (i from 1 to length of vector1)',
                ' 7:     numerator ← numerator + [      a      ]',
                ' 8:   endfor',
                ' 9: ',
                '10:   for (i from 1 to length of vector1)',
                '11:     temp ← temp + power(vector1[i], 2)',
                '12:   endfor',
                '13:   denominator ← sqrt(temp)',
                '14: ',
                '15:   temp ← 0',
                '16:   for (i from 1 to length of vector2)',
                '17:     temp ← temp + power(vector2[i], 2)',
                '18:   endfor',
                '19:   denominator ← [      b      ]',
                '20: ',
                '21:   similarity ← numerator / denominator',
                '22:   return similarity'
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'a: (vector1[i] × vector2[i])の正の平方根, b: denominator × (tempの正の平方根)' },
                { label: 'イ', value: 'a: (vector1[i] × vector2[i])の正の平方根, b: denominator + (tempの正の平方根)' },
                { label: 'ウ', value: 'a: (vector1[i] × vector2[i])の正の平方根, b: tempの正の平方根' },
                { label: 'エ', value: 'a: vector1[i] × vector2[i], b: denominator × (tempの正の平方根)' },
                { label: 'オ', value: 'a: vector1[i] × vector2[i], b: denominator + (tempの正の平方根)' },
                { label: 'カ', value: 'a: vector1[i] × vector2[i], b: tempの正の平方根' },
                { label: 'キ', value: 'a: vector1[i]の2乗, b: denominator × (tempの正の平方根)' },
                { label: 'ク', value: 'a: vector1[i]の2乗, b: denominator + (tempの正の平方根)' },
                { label: 'ケ', value: 'a: vector1[i]の2乗, b: tempの正の平方根' },
            ],
            en: [ /* ... */ ]
        },
        correctAnswer: 'a: vector1[i] × vector2[i], b: denominator × (tempの正の平方根)',
        explanationText: {
            ja: "コサイン類似度は、ベクトルの内積（分子）を、各ベクトルの大きさ（ノルム）の積（分母）で割ることで計算されます。\n\n【aについて】\n分子はベクトルの内積、すなわち各要素の積の総和（Σa_i * b_i）です。forループの中で`numerator`に加算していくため、空欄aには`vector1[i] × vector2[i]`が入ります。\n\n【bについて】\n分母は二つのベクトルの大きさの積です。プログラムでは、まず`denominator`に`vector1`の大きさ（√Σa_i²）を計算して格納しています。次に、`temp`に`vector2`の各要素の2乗の和（Σb_i²）を計算しています。したがって、最終的な分母を求めるには、現在の`denominator`に、`vector2`の大きさである「tempの正の平方根」を掛ける必要があります。\n\nしたがって、正しい組み合わせは「エ」です。",
            en: "Cosine similarity is calculated by dividing the dot product of the vectors (numerator) by the product of the magnitudes (norms) of each vector (denominator).\n\n[Regarding a]\nThe numerator is the dot product of the vectors, which is the sum of the products of their corresponding elements (Σa_i * b_i). Inside the for loop, we add to the `numerator`, so blank a should be `vector1[i] * vector2[i]`.\n\n[Regarding b]\nThe denominator is the product of the magnitudes of the two vectors. The program first calculates the magnitude of `vector1` (sqrt(Σa_i²)) and stores it in `denominator`. Next, it calculates the sum of the squares of `vector2`'s elements (Σb_i²) and stores it in `temp`. Therefore, to get the final denominator, you must multiply the current `denominator` by the magnitude of `vector2`, which is the 'square root of temp'.\n\nThus, the correct combination is 'E'."
        },
        initialVariables: {
            vector1: [3, 4],
            vector2: [4, 3],
            similarity: null,
            numerator: null,
            denominator: null,
            temp: null,
            i: null,
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 8
    },
    // =================================================================================
    // --- 問32: 情報セキュリティ（業務委託） ---
    // =================================================================================
    {
        id: '32',
        logicType: 'STATIC_QA',
        title: { 
            ja: "令和5年 科目B 情報セキュリティ(業務委託)", 
            en: "Reiwa 5, Subject B, Question 6" 
        },
        description: {
            ja: "A社は，放送会社や運輸会社向けに広告制作ビジネスを展開している。A社は，人事事務の効率化を図るべく，人事事務の委託を検討することにした。A社が委託する業務（以下，B業務という）を図1に示す。\n\n【図1 B業務】\n採用予定者から郵送されてくる入社時の誓約書，前職の源泉徴収票などの書類をPDFファイルに変換し，ファイルサーバに格納する。（省略）\n\n委託先候補のC社は，B業務について，次のようにA社に提案した。\n・B業務だけに従事する専任の従業員を割り当てる。\n・B業務では，図2の複合機のスキャン機能を使用する。\n\n【図2 複合機のスキャン機能（抜粋）】\n・スキャン機能を使用する際は，従業員ごとに付与した利用者IDとパスワードをパネルに入力する。\n・スキャンしたデータをPDFファイルに変換する。\n・PDFファイルを従業員ごとに異なる鍵で暗号化して，電子メールに添付する。\n・スキャンを実行した本人宛てに電子メールを送信する。\n・PDFファイルが大きい場合は，PDFファイルを添付する代わりに，自社の社内ネットワーク上に設置したサーバ（以下，Bサーバという）に自動的に保存し，保存先のURLを電子メールの本文に記載して送信する。（注1）\n注1）Bサーバにアクセスする際は，従業員ごとの利用者IDとパスワードが必要になる。\n\nA社は，C社と業務委託契約を締結する前に，秘密保持契約を締結した。その後，C社に質問表を送付し，回答を受けて，業務委託での情報セキュリティリスクの評価を実施した。その結果，図3の発見があった。\n\n【図3 発見事項】\n・複合機のスキャン機能では，電子メールの差出人アドレス，件名，本文及び添付ファイル名を初期設定の状態で使用しており，誰がスキャンを実行しても同じである。\n・複合機のスキャン機能の初期設定情報はベンダーのWebサイトで公開されており，誰でも閲覧できる。\n\nそこで，A社では，初期設定の状態のままではA社にとって情報セキュリティリスクがあり，初期設定から変更するという対策が必要であると評価した。\n\n【設問】\n対策が必要であるとA社が評価した情報セキュリティリスクはどれか。解答群のうち，最も適切なものを選べ。",
            en: "Company A is in the advertising production business for broadcasting and transportation companies. To improve the efficiency of its human resources administration, Company A decided to consider outsourcing these tasks. The tasks to be outsourced by Company A (hereinafter referred to as B-Tasks) are shown in Figure 1.\n\n[Figure 1: B-Tasks]\nConvert documents such as pledge forms from prospective employees and withholding tax statements from previous jobs, sent by mail, into PDF files and store them on a file server. (Details omitted)\n\nCompany C, a potential outsourcing partner, proposed the following to Company A regarding B-Tasks:\n- Assign dedicated employees who will only engage in B-Tasks.\n- Use the scanning function of the multifunction peripheral (MFP) shown in Figure 2 for B-Tasks.\n\n[Figure 2: MFP Scan Function (Excerpt)]\n- When using the scan function, employees enter their assigned user ID and password on the panel.\n- The scanned data is converted into a PDF file.\n- The PDF file is encrypted with a different key for each employee and attached to an email.\n- An email is sent to the person who performed the scan.\n- If the PDF file is large, instead of attaching it, it is automatically saved to a server (hereinafter referred to as B-Server) on their internal network, and the URL of the storage location is included in the email body. (Note 1)\nNote 1) Accessing B-Server requires the employee's user ID and password.\n\nBefore concluding an outsourcing contract with Company C, Company A signed a non-disclosure agreement. Subsequently, Company A sent a questionnaire to Company C, received answers, and conducted an information security risk assessment for the outsourced tasks. As a result, the findings in Figure 3 were discovered.\n\n[Figure 3: Findings]\n- The MFP's scan function uses default settings for the sender's email address, subject, body, and attachment filename, which are the same regardless of who performs the scan.\n- The initial setup information for the MFP's scan function is publicly available on the vendor's website for anyone to view.\n\nTherefore, Company A assessed that leaving the settings as default poses an information security risk and that countermeasures to change them are necessary.\n\n[Question]\nWhich of the following is the information security risk that Company A determined requires countermeasures? Choose the most appropriate option from the answer choices."
        },
        programLines: { 
            ja: [], 
            en: [] 
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'B業務に従事する従業員が，攻撃者からの電子メールを複合機からのものと信じて本文中にあるURLをクリックし，フィッシングサイトに誘導される。その結果，A社の採用予定者の個人情報が漏えいする。' },
                { label: 'イ', value: 'B業務に従事する従業員が，複合機から送信される電子メールをスパムメールと誤認し，電子メールを削除する。その結果，再スキャンが必要となり，B業務が遅延する。' },
                { label: 'ウ', value: '攻撃者が，複合機から送信される電子メールを盗聴し，添付ファイルを暗号化して身代金を要求する。その結果，A社が復号鍵を受け取るために多額の身代金を支払うことになる。' },
                { label: 'エ', value: '攻撃者が，複合機から送信される電子メールを盗聴し，本文に記載されているURLを使ってBサーバにアクセスする。その結果，A社の採用予定者の個人情報が漏えいする。' }
            ],
            en: [
                { label: 'A', value: 'An employee engaged in B-Tasks receives an email from an attacker, believes it is from the MFP, clicks a URL in the body, and is led to a phishing site. As a result, the personal information of Company A\'s prospective employees is leaked.' },
                { label: 'B', value: 'An employee engaged in B-Tasks mistakes an email from the MFP for spam and deletes it. As a result, a rescan is necessary, and B-Tasks are delayed.' },
                { label: 'C', value: 'An attacker intercepts an email sent from the MFP, encrypts the attached file, and demands a ransom. As a result, Company A has to pay a large ransom to receive the decryption key.' },
                { label: 'D', value: 'An attacker intercepts an email sent from the MFP and uses the URL in the body to access the B-Server. As a result, the personal information of Company A\'s prospective employees is leaked.' }
            ]
        },
        correctAnswer: 'B業務に従事する従業員が，攻撃者からの電子メールを複合機からのものと信じて本文中にあるURLをクリックし，フィッシングサイトに誘導される。その結果，A社の採用予定者の個人情報が漏えいする。',
        explanationText: {
            ja: "複合機から送信されるメールの差出人アドレス、件名、本文が初期設定のままであり、その情報が誰でも閲覧可能であることが問題です。これにより、攻撃者は本物と見分けがつかない偽のメール（標的型攻撃メール）を容易に作成できます。\n\nア：この状況では、従業員が偽のメールを本物と信じ、記載されたURL（フィッシングサイトへのリンク）をクリックしてしまう可能性が非常に高いです。これは、発見事項から直接導かれる最も深刻なリスクです。\n\nイ：メールは業務上期待されているものであり、初期設定のままでも内容が予測できるため、スパムと誤認する可能性は低いです。\n\nウ：PDFファイルは従業員ごとに異なる鍵で暗号化されているため、攻撃者がこれを解読してさらに暗号化するのは困難です。また、元のデータはスキャンすれば再作成できるため、身代金を支払う必要性も低いです。\n\nエ：BサーバはC社の「社内ネットワーク」に設置されているため、社外の攻撃者がURLを知っていても直接アクセスすることはできません。\n\nしたがって、最も適切なリスクは「ア」です。",
            en: "The core issue is that the sender address, subject, and body of the emails from the MFP are left as default, and this information is publicly available. This makes it easy for an attacker to craft a convincing fake email (a spear-phishing attack).\n\nA: In this situation, it is highly likely that an employee will believe the fake email is genuine and click a URL (a link to a phishing site) contained within it. This is the most serious and direct risk arising from the findings.\n\nB: The email is expected as part of the workflow, so it is unlikely to be mistaken for spam.\n\nC: The PDF files are already encrypted with employee-specific keys, making it difficult for an attacker to decrypt and re-encrypt them. Also, the original data can be recreated by scanning again, reducing the need to pay a ransom.\n\nD: The B-Server is located on Company C's 'internal network,' so an external attacker cannot access it even if they know the URL.\n\nTherefore, the most appropriate risk is 'A'."
        },
        initialVariables: {},
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問33: 3つの数の最大値 ---
    // =================================================================================
    {
        id: '33',
        logicType: 'MAX_OF_THREE',
        title: { 
            ja: "令和6年 科目B 3つの数の最大値", 
            en: "Reiwa 6, Subject B, Question 1" 
        },
        description: {
            ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。\n\n関数 maximum は，異なる三つの整数を引数で受け取り，そのうちの最大値を返す。",
            en: "Select the correct answer for the blank in the following program from the answer choices.\n\nThe function 'maximum' takes three different integers as arguments and returns the largest value among them."
        },
        programLines: {
            ja: [
                '1: ○整数型: maximum(整数型: x, 整数型: y, 整数型: z)',
                '2:   if ( [      ] )',
                '3:     return x',
                '4:   elseif (y > z)',
                '5:     return y',
                '6:   else',
                '7:     return z',
                '8:   endif',
            ],
            en: [
                '1: ○function maximum(integer: x, integer: y, integer: z) -> integer',
                '2:   if ( [      ] )',
                '3:     return x',
                '4:   elseif (y > z)',
                '5:     return y',
                '6:   else',
                '7:     return z',
                '8:   endif',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'x > y' },
                { label: 'イ', value: 'x > y and x > z' },
                { label: 'ウ', value: 'x > y and y > z' },
                { label: 'エ', value: 'x > z' },
                { label: 'オ', value: 'x > z and z > y' },
                { label: 'カ', value: 'z > y' },
            ],
            en: [
                { label: 'A', value: 'x > y' },
                { label: 'B', value: 'x > y and x > z' },
                { label: 'C', value: 'x > y and y > z' },
                { label: 'D', value: 'x > z' },
                { label: 'E', value: 'x > z and z > y' },
                { label: 'F', value: 'z > y' },
            ]
        },
        correctAnswer: 'x > y and x > z',
        explanationText: {
            ja: "関数`maximum`は、3つの引数`x`, `y`, `z`のうち最大値を返すものです。プログラムの構造を見ると、最初の`if`文で`x`を返しています。したがって、この`if`文の条件は「`x`が最大値である」ことを判定するものでなければなりません。\n\n`x`が最大値となるのは、①`x`が`y`よりも大きく、かつ②`x`が`z`よりも大きい、という2つの条件を同時に満たす場合です。この「かつ」の関係は論理積（AND）で表現します。\n\nしたがって、空欄には`x > y and x > z`が入る「イ」が正解となります。",
            en: "The function `maximum` is intended to return the largest of the three arguments `x`, `y`, and `z`. Looking at the program structure, the first `if` statement returns `x`. Therefore, the condition of this `if` statement must be one that determines if 'x is the maximum value'.\n\nFor `x` to be the maximum, it must satisfy two conditions simultaneously: 1) `x` is greater than `y`, AND 2) `x` is greater than `z`. This 'and' relationship is expressed with a logical AND.\n\nTherefore, option 'B', `x > y and x > z`, is the correct answer for the blank."
        },
        initialVariables: {
            x: null,
            y: null,
            z: null,
            result: null,
        },
        traceOptions: {
            presets_array: [
                { label: 'x=10, y=5, z=1', value: { x: 10, y: 5, z: 1 } },
                { label: 'x=5, y=10, z=1', value: { x: 5, y: 10, z: 1 } },
                { label: 'x=1, y=5, z=10', value: { x: 1, y: 5, z: 10 } },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問34: 2進数から10進数への変換 ---
    // =================================================================================
    {
        id: '34',
        logicType: 'BINARY_TO_DECIMAL',
        title: { 
            ja: "令和6年 科目B 2進数から10進数への変換", 
            en: "Reiwa 6, Subject B, Question 2" 
        },
        description: {
            ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。\n\n関数 convDecimal は，引数として与えられた，\"0\"と\"1\"だけから成る，1文字以上の文字列を，符号なしの2進数と解釈したときの整数値を返す。例えば，引数として\"10010\"を与えると18が返る。\n\n関数 convDecimal が利用する関数 int は，引数で与えられた文字が\"0\"なら整数値0を返し，\"1\"なら整数値1を返す。",
            en: "Select the correct answer for the blank in the following program from the answer choices.\n\nThe function convDecimal takes a string of one or more characters consisting only of \"0\"s and \"1\"s as an argument, interprets it as an unsigned binary number, and returns its integer value. For example, given the argument \"10010\", it returns 18.\n\nThe function int, used by convDecimal, returns the integer value 0 if the given character is \"0\", and 1 if it is \"1\"."
        },
        programLines: {
            ja: [
                '1: ○整数型: convDecimal(文字列型: binary)',
                '2:   整数型: i, length, result ← 0',
                '3:   length ← binaryの文字数',
                '4:   for (i を 1 から length まで 1 ずつ増やす)',
                '5:     result ← [                                                  ]',
                '6:   endfor',
                '7:   return result',
            ],
            en: [
                '1: ○function convDecimal(string: binary) -> integer',
                '2:   integer: i, length, result ← 0',
                '3:   length ← number of characters in binary',
                '4:   for (i from 1 to length step 1)',
                '5:     result ← [                                                  ]',
                '6:   endfor',
                '7:   return result',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'result + int(binary の (length - i + 1)文字目の文字)' },
                { label: 'イ', value: 'result + int(binary の i文字目の文字)' },
                { label: 'ウ', value: 'result × 2 + int(binary の (length - i + 1)文字目の文字)' },
                { label: 'エ', value: 'result × 2 + int(binary の i文字目の文字)' },
            ],
            en: [
                { label: 'A', value: 'result + int(character at (length - i + 1) of binary)' },
                { label: 'B', value: 'result + int(character at i of binary)' },
                { label: 'C', value: 'result * 2 + int(character at (length - i + 1) of binary)' },
                { label: 'D', value: 'result * 2 + int(character at i of binary)' },
            ]
        },
        correctAnswer: 'result × 2 + int(binary の i文字目の文字)',
        explanationText: {
            ja: "このプログラムは、2進数の文字列を左の桁から順に評価して10進数に変換しています。この方法では、現在の結果を2倍して新しい桁の値を加える、という計算を繰り返します。\n\n例として、\"10010\"を考えます。\n1. `result`=0\n2. i=1 (文字は\"1\"): `result` ← 0 * 2 + 1 = 1\n3. i=2 (文字は\"0\"): `result` ← 1 * 2 + 0 = 2\n4. i=3 (文字は\"0\"): `result` ← 2 * 2 + 0 = 4\n5. i=4 (文字は\"1\"): `result` ← 4 * 2 + 1 = 9\n6. i=5 (文字は\"0\"): `result` ← 9 * 2 + 0 = 18\n\nこのように、ループの各ステップでは、`result`の値を2倍し、`i`番目の文字の整数値を加えています。したがって、空欄には「エ」の `result × 2 + int(binary の i文字目の文字)` が入ります。",
            en: "This program converts a binary string to a decimal number by evaluating it from the leftmost digit. In this method, the calculation of multiplying the current result by 2 and adding the value of the new digit is repeated.\n\nFor example, consider \"10010\":\n1. `result`=0\n2. i=1 (char is \"1\"): `result` ← 0 * 2 + 1 = 1\n3. i=2 (char is \"0\"): `result` ← 1 * 2 + 0 = 2\n4. i=3 (char is \"0\"): `result` ← 2 * 2 + 0 = 4\n5. i=4 (char is \"1\"): `result` ← 4 * 2 + 1 = 9\n6. i=5 (char is \"0\"): `result` ← 9 * 2 + 0 = 18\n\nThus, in each step of the loop, the value of `result` is multiplied by 2, and the integer value of the character at the i-th position is added. Therefore, the correct choice for the blank is 'D', `result * 2 + int(character at i of binary)`."
        },
        initialVariables: {
            binary: null,
            i: 0,
            length: 0,
            result: 0,
        },
        traceOptions: {
            presets_array: [
                { label: 'binary = "10010"', value: { binary: "10010" } },
                { label: 'binary = "1101"', value: { binary: "1101" } },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問35: 辺リストから隣接行列への変換 ---
    // =================================================================================
    {
        id: '35',
        logicType: 'EDGES_TO_MATRIX',
        title: { 
            ja: "令和6年 科目B 辺リストから隣接行列への変換", 
            en: "Reiwa 6, Subject B, Question 3" 
        },
        description: {
            ja: "次のプログラム中の□に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n図1に示すグラフの頂点には，1から順に整数で番号が付けられている。グラフは無向グラフであり，各頂点間には高々一つの辺がある。（...）\n\n関数 edgesToMatrix は，辺の配列を隣接行列に変換する。隣接行列とは，グラフに含まれる頂点の個数と等しい行数及び列数をもつ正方行列で，行i列jの成分は頂点iと頂点jを結ぶ辺があるときに1となり，それ以外は0となる。",
            en: "Select the correct answer for the blank from the answer choices. Array indices start from 1.\n\nThe graph vertices shown in Figure 1 are numbered sequentially starting from 1. The graph is undirected, and there is at most one edge between any two vertices. (...)\n\nThe function edgesToMatrix converts an array of edges into an adjacency matrix. An adjacency matrix is a square matrix with the number of rows and columns equal to the number of vertices in the graph. The component at row i, column j is 1 if there is an edge connecting vertex i and vertex j, and 0 otherwise."
        },
        programLines: {
            ja: [
                '1: ○整数型の二次配列: edgesToMatrix(整数型配列の配列: edgeList, 整数型: nodeNum)',
                '2:   整数型の二次配列: adjMatrix ← {nodeNum行nodeNum列の 0}',
                '3:   整数型: i, u, v',
                '4:   for (i を 1 から edgeListの要素数 まで 1 ずつ増やす)',
                '5:     u ← edgeList[i][1]',
                '6:     v ← edgeList[i][2]',
                '7:     [                                                  ]',
                '8:   endfor',
                '9:   return adjMatrix',
            ],
            en: [
                '1: ○function edgesToMatrix(array of integer arrays: edgeList, integer: nodeNum) -> 2D integer array',
                '2:   2D integer array: adjMatrix ← {nodeNum rows, nodeNum columns of 0s}',
                '3:   integer: i, u, v',
                '4:   for (i from 1 to number of elements in edgeList step 1)',
                '5:     u ← edgeList[i][1]',
                '6:     v ← edgeList[i][2]',
                '7:     [                                                  ]',
                '8:   endfor',
                '9:   return adjMatrix',
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'adjMatrix[u, u] ← 1' },
                { label: 'イ', value: 'adjMatrix[u, v] ← 1' },
                { label: 'ウ', value: 'adjMatrix[v, u] ← 1' },
                { label: 'エ', value: 'adjMatrix[u, v] ← 1\nadjMatrix[v, u] ← 1' },
                { label: 'オ', value: 'adjMatrix[v, v] ← 1' },
                { label: 'カ', value: 'adjMatrix[v, u] ← 1' },
            ],
            en: [
                { label: 'A', value: 'adjMatrix[u, u] ← 1' },
                { label: 'B', value: 'adjMatrix[u, v] ← 1' },
                { label: 'C', value: 'adjMatrix[v, u] ← 1' },
                { label: 'D', value: 'adjMatrix[u, v] ← 1\nadjMatrix[v, u] ← 1' },
                { label: 'E', value: 'adjMatrix[v, v] ← 1' },
                { label: 'F', value: 'adjMatrix[v, u] ← 1' },
            ]
        },
        correctAnswer: 'adjMatrix[u, v] ← 1\nadjMatrix[v, u] ← 1',
        explanationText: {
            ja: "この問題のグラフは「無向グラフ」です。無向グラフでは、頂点uと頂点vの間に辺がある場合、それは「uからvへ」と「vからuへ」の両方の関係を意味します。\n\n隣接行列は、この関係を表すものです。したがって、辺 {u, v} が存在する場合、行列の`u`行`v`列の要素と、`v`行`u`列の要素の両方を1にする必要があります。\n\nループ内で辺 {u, v} を取り出した後、`adjMatrix[u, v] ← 1` と `adjMatrix[v, u] ← 1` の両方を実行することで、隣接行列が正しく構築されます。したがって、正解は「エ」です。",
            en: "The graph in this problem is an 'undirected graph'. In an undirected graph, if there is an edge between vertex u and vertex v, it signifies a relationship in both directions: 'from u to v' and 'from v to u'.\n\nThe adjacency matrix represents this relationship. Therefore, if an edge {u, v} exists, you must set both the element at row `u`, column `v` and the element at row `v`, column `u` of the matrix to 1.\n\nAfter extracting the edge {u, v} inside the loop, executing both `adjMatrix[u, v] ← 1` and `adjMatrix[v, u] ← 1` correctly builds the adjacency matrix. Thus, the correct answer is 'D'."
        },
        initialVariables: {
            edgeList: [[1, 3], [1, 4], [3, 4], [2, 4], [4, 5]],
            nodeNum: null,
            adjMatrix: null,
            i: null,
            u: null,
            v: null,
        },
        traceOptions: {
            presets_array: [
                { 
                    label: 'グラフデータをセット', 
                    value: { 
                        edgeList: [[1, 3], [1, 4], [3, 4], [2, 4], [4, 5]], 
                        nodeNum: 5 
                    } 
                },
            ]
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 8
    },
    // =================================================================================
    // --- 問36: マージアルゴリズム ---
    // =================================================================================
    {
        id: '36',
        logicType: 'MERGE_ALGORITHM',
        title: { 
            ja: "令和6年 科目B マージアルゴリズム", 
            en: "Reiwa 6, Subject B, Question 4" 
        },
        description: {
            ja: "次の記述中の□に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n関数 merge は，昇順に整列された整数型の配列 data1 及び data2 を受け取り，これらを併合してできる昇順に整列された整数型の配列を返す。関数 merge を merge({2, 3}, {1, 4})として呼び出すと，/*** α ***/ の行は□。",
            en: "Select the correct answer for the blank from the answer choices. Array indices start from 1.\n\nThe function 'merge' takes two sorted integer arrays, data1 and data2, and returns a new sorted integer array created by merging them. When the function is called as merge({2, 3}, {1, 4}), the line marked /*** α ***/ is [ ]."
        },
        programLines: {
            ja: [
                ' 1: ○整数型の配列: merge(整数型の配列: data1, 整数型の配列: data2)',
                ' 2:   整数型: n1 ← data1の要素数',
                ' 3:   整数型: n2 ← data2の要素数',
                ' 4:   整数型の配列: work ← {(n1 + n2)個の 未定義の値}',
                ' 5:   整数型: i ← 1',
                ' 6:   整数型: j ← 1',
                ' 7:   整数型: k ← 1',
                ' 8: ',
                ' 9:   while ((i ≦ n1) and (j ≦ n2))',
                '10:     if (data1[i] ≦ data2[j])',
                '11:       work[k] ← data1[i]',
                '12:       i ← i + 1',
                '13:     else',
                '14:       work[k] ← data2[j]',
                '15:       j ← j + 1',
                '16:     endif',
                '17:     k ← k + 1',
                '18:   endwhile',
                '19: ',
                '20:   while (i ≦ n1)',
                '21:     work[k] ← data1[i]',
                '22:     i ← i + 1',
                '23:     k ← k + 1',
                '24:   endwhile',
                '25: ',
                '26:   while (j ≦ n2)',
                '27:     work[k] ← data2[j] /*** α ***/',
                '28:     j ← j + 1',
                '29:     k ← k + 1',
                '30:   endwhile',
                '31: ',
                '32:   return work',
            ],
            en: [/* ... */]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '実行されない' },
                { label: 'イ', value: '1回実行される' },
                { label: 'ウ', value: '2回実行される' },
                { label: 'エ', value: '3回実行される' },
            ],
            en: [
                { label: 'A', value: 'not executed' },
                { label: 'B', value: 'executed once' },
                { label: 'C', value: 'executed twice' },
                { label: 'D', value: 'executed three times' },
            ]
        },
        correctAnswer: '1回実行される',
        explanationText: {
            ja: "このプログラムは、2つのソート済み配列`data1`と`data2`を1つのソート済み配列`work`に統合するマージ処理です。\n\n1. 最初の`while`ループでは、`data1`と`data2`の要素を比較し、小さい方から`work`配列に詰めていきます。`merge({2, 3}, {1, 4})`の場合、`work`は`{1, 2, 3}`となり、`i`は3に、`j`は2になります。ここで`i > n1`となるためループが終了します。\n\n2. 2つ目の`while`ループは`data1`に残った要素を詰める処理ですが、`i`は既に3であり`n1`(2)を超えているため、このループは実行されません。\n\n3. 3つ目の`while`ループは`data2`に残った要素を詰める処理です。この時点で`j`は2で`n2`(2)以下なので、ループが1回実行されます。`work[4]`に`data2[2]`の値である4が格納されます。このとき、`/*** α ***/`の行が実行されます。\n\nしたがって、`α`の行は「1回実行される」が正解です。",
            en: "This program is a merge process that combines two sorted arrays, `data1` and `data2`, into a single sorted array `work`.\n\n1. The first `while` loop compares elements from `data1` and `data2` and places the smaller one into the `work` array. For `merge({2, 3}, {1, 4})`, `work` becomes `{1, 2, 3}`, `i` becomes 3, and `j` becomes 2. The loop terminates because `i > n1`.\n\n2. The second `while` loop is for any remaining elements in `data1`. Since `i` is already 3, which is greater than `n1`(2), this loop is not executed.\n\n3. The third `while` loop is for remaining elements in `data2`. At this point, `j` is 2, which is less than or equal to `n2`(2), so the loop executes once. The value of `data2[2]` (which is 4) is stored in `work[4]`. The line `/*** α ***/` is executed at this time.\n\nTherefore, the line `α` is 'executed once', which is the correct answer."
        },
        initialVariables: {
            data1: [2, 3],
            data2: [1, 4],
            n1: null,
            n2: null,
            work: null,
            i: null,
            j: null,
            k: null,
            alpha_executed: 0,
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問37: 商品の関連度分析 ---
    // =================================================================================
    {
        id: '37',
        logicType: 'ASSOCIATION_ANALYSIS',
        title: { 
            ja: "令和6年 科目B 商品の関連度分析", 
            en: "Reiwa 6, Subject B, Question 5" 
        },
        description: {
            ja: "次のプログラム中の a 〜 c に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は1から始まる。\n\n手続 putRelatedItem は，大域変数 orders に格納された注文データを基に，引数で与えられた商品との関連度が最も大きい商品のうちの一つと，その関連度を出力する。",
            en: "Select the correct combination for a, b, and c from the answer choices. Array indices start from 1.\n\nThe procedure putRelatedItem, based on the order data stored in the global variable 'orders', outputs one of the items with the highest degree of relatedness to the item given as an argument, along with that degree of relatedness."
        },
        programLines: {
            ja: [
                ' 1: // 注：注文データ(ここでは表の例を与えている)',
                ' 2: 大域：文字列型配列の配列: orders ← {{"A", "B", "D"}, {"A", "D"}, {"A"}, {"A", "B", "E"}, {"B"}, {"C", "E"}}',
                ' 3: ',
                ' 4: ○putRelatedItem(文字列型: item)',
                ' 5:   文字列型の配列: allItems ← ordersに含まれる文字列を重複なく辞書順に格納した配列',
                ' 6:   // 表の例では {"A", "B", "C", "D", "E"}',
                ' 7:   文字列型の配列: otherItems ← allItemsの複製から値がitemである要素を除いた配列',
                ' 8: ',
                ' 9:   整数型: i, itemCount ← 0',
                '10:   整数型の配列: arrayK ← {otherItemsの要素数個の0}',
                '11:   整数型の配列: arrayM ← {otherItemsの要素数個の0}',
                '12:   実数型: valueL, maxL ← -∞',
                '13:   文字列型の配列: relatedItem',
                '14: ',
                '15:   for (orderにordersの要素を順に代入する)',
                '16:     if (orderのいずれかの要素の値がitemの値と等しい)',
                '17:       itemCountの値を1増やす',
                '18:       for (iを1からotherItemsの要素数まで1ずつ増やす)',
                '19:         if (orderのいずれかの要素の値がotherItems[i]の値と等しい)',
                '20:           [   a   ] の値を1増やす',
                '21:         endif',
                '22:       endfor',
                '23:     else',
                '24:       for (iを1からotherItemsの要素数まで1ずつ増やす)',
                '25:         if (orderのいずれかの要素の値がotherItems[i]の値と等しい)',
                '26:           [   b   ] の値を1増やす',
                '27:         endif',
                '28:       endfor',
                '29:     endif',
                '30:   endfor',
                '31: ',
                '32:   for (iを1からotherItemsの要素数まで1ずつ増やす)',
                '33:     valueL ← (arrayM[i] × [   c   ]) ÷ (itemCount × arrayK[i])',
                '34:     /* 実数として計算する */',
                '35:     if (valueLがmaxLより大きい)',
                '36:       maxL ← valueL',
                '37:       relatedItem ← otherItems[i]',
                '38:     endif',
                '39:   endfor',
                '40: ',
                '41:   relatedItemの値とmaxLの値をこの順にコンマ区切りで出力する',
            ],
            en: [/* ... */]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'a: arrayK[i], b: arrayM[i], c: allItemsの要素数' },
                { label: 'イ', value: 'a: arrayK[i], b: arrayM[i], c: ordersの要素数' },
                { label: 'ウ', value: 'a: arrayK[i], b: arrayM[i], c: otherItemsの要素数' },
                { label: 'エ', value: 'a: arrayM[i], b: arrayK[i], c: allItemsの要素数' },
                { label: 'オ', value: 'a: arrayM[i], b: arrayK[i], c: ordersの要素数' },
                { label: 'カ', value: 'a: arrayM[i], b: arrayK[i], c: otherItemsの要素数' },
            ],
            en: [/* ... */]
        },
        correctAnswer: 'a: arrayM[i], b: arrayK[i], c: ordersの要素数',
        explanationText: {
            ja: "このプログラムは、関連度Lxyを計算しています。数式とプログラムの各変数がどう対応するかを考えます。\nLxy = (Mxy * 全注文件数) / (Kx * Ky)\n\n・`itemCount`: `item`を含む注文数、すなわち`Kx`です。\n・`a`の加算: `order`が`item`を含む、かつ`otherItems[i]`も含む場合に実行されます。これは`item`と`otherItems[i]`が同時に購入された注文件数、すなわち`Mxy`を数えています。したがって`a`は`arrayM[i]`です。\n・`b`の加算: `order`が`otherItems[i]`を含む場合に実行されます。これは`otherItems[i]`の総購入注文件数、すなわち`Ky`を数えています。したがって`b`は`arrayK[i]`です。\n・`c`: `valueL`の計算式を見ると、`c`は「全注文件数」に対応します。これは大域変数`orders`の要素数です。\n\n以上から、正しい組み合わせは「オ」となります。",
            en: "This program calculates the relatedness score Lxy. Let's see how the variables in the program correspond to the formula: Lxy = (Mxy * Total Orders) / (Kx * Ky).\n\n- `itemCount`: This is the number of orders containing `item`, which is `Kx`.\n- Incrementing `a`: This happens when an order contains both `item` and `otherItems[i]`. This counts the number of orders where both items were purchased together, which is `Mxy`. Therefore, `a` corresponds to `arrayM[i]`.\n- Incrementing `b`: This happens when an order contains `otherItems[i]`. This counts the total number of orders for `otherItems[i]`, which is `Ky`. Therefore, `b` corresponds to `arrayK[i]`.\n- `c`: Looking at the formula for `valueL`, `c` corresponds to the 'Total Orders'. This is the number of elements in the global `orders` array.\n\nFrom the above, the correct combination is 'E'."
        },
        initialVariables: {
            orders: [["A", "B", "D"], ["A", "D"], ["A"], ["A", "B", "E"], ["B"], ["C", "E"]],
            item: "A",
            allItems: null,
            otherItems: null,
            itemCount: null,
            arrayK: null,
            arrayM: null,
            i: null,
            order_idx: null, // `for (order in orders)`のカウンタ用
            valueL: null,
            maxL: null,
            relatedItem: null,
        },
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // =================================================================================
    // --- 問38: 情報セキュリティ（テレワーク） ---
    // =================================================================================
    {
        id: '38',
        logicType: 'STATIC_QA',
        title: { 
            ja: "令和6年 科目B 情報セキュリティ(テレワーク)", 
            en: "Reiwa 6, Subject B, Question 6" 
        },
        description: {
            ja: "A社は従業員450名の商社であり，昨年から働き方改革の一環として，在宅でのテレワークを推進している。A社のシステム環境を図1に示す。\n\n【図1 A社のシステム環境（抜粋）】\n・従業員には，一人に1台デスクトップPC（以下，社内PCという）を貸与している。\n・従業員が利用するシステムには，自社で開発しA社に設置している業務システムのほかに，二つのSaaS（以下，二つのSaaSをA社利用クラウドサービスという）がある。\n 1. メール機能，チャット機能及びクラウドストレージ機能をもつグループウェア\n 2. オンライン会議サービス\n・テレワークでは，従業員の個人所有PC（以下，私有PCという）の業務用利用(BYOD)を許可している。\n・テレワークでは，社内PC及び私有PCのそれぞれに専用のアプリケーションソフトウェア（以下，専用アプリという）を導入し，社内PCのデスクトップから私有PCに画面転送を行うリモートデスクトップ方式を採用している。\n・専用アプリには，リモートデスクトップからPCへのファイルのダウンロード及びファイル，文字列，画像などのコピー＆ペーストを禁止する機能（保存禁止機能）があり，A社では私有PCに対して当該機能を有効にしている。\n・業務システムには，社内PCのデスクトップから利用者ID及びパスワードを入力してログインしている。\n・A社利用クラウドサービスへのログインは，A社利用クラウドサービス側の設定によってA社の社内ネットワークからだけに可能になるように制限している。\n\nテレワークの定着が進むにつれて，社内PCからインターネットへの接続が極端に遅くなり，業務に支障をきたしているので改善できないかと，従業員から問合せがあった。A社の情報システム部では，テレワークでA社利用クラウドサービスに接続する場合には，A社の社内ネットワークも社内PCも介さずに直接接続することを可能にするネットワークの設定変更を実施することにした。\n\n設定変更に当たり，情報セキュリティ上の問題がないかをA社の情報セキュリティリーダーであるBさんが検討したところ，幾つか問題があることが分かった。その一つは，A社利用クラウドサービスへの不正アクセスのリスクが増加することである。そこでBさんは，リスクを低減するために，情報システム部に対策を依頼することにした。\n\n【設問】\n次の対策のうち，情報システム部に依頼することにしたものはどれか。解答群のうち，最も適切なものを選べ。",
            en: "Company A is a trading company with 450 employees and has been promoting telework as part of its work style reform since last year. Company A's system environment is shown in Figure 1.\n\n[Figure 1: Company A's System Environment (Excerpt)]\n- Each employee is provided with one desktop PC (hereinafter referred to as company PC).\n- In addition to the business systems developed in-house and installed at Company A, employees use two SaaS applications (hereinafter referred to as Company A's cloud services): a groupware with email, chat, and cloud storage, and an online conferencing service.\n- For telework, the company permits the business use of employees' personally owned PCs (BYOD, hereinafter referred to as private PCs).\n- For telework, a dedicated application software (hereinafter referred to as the dedicated app) is installed on both company and private PCs, employing a remote desktop method where the company PC's screen is transferred to the private PC.\n- The dedicated app has a function to prohibit downloading files to the PC, as well as copying and pasting files, text, and images (save prohibition function), which Company A has enabled for private PCs.\n- To log in to the business systems, users enter their user ID and password from the company PC's desktop.\n- Login to Company A's cloud services is restricted by the cloud service's settings to be possible only from Company A's internal network.\n\nAs telework became more established, the internet connection from company PCs became extremely slow, hindering business operations, and inquiries from employees about possible improvements arose. Company A's information systems department decided to implement a network setting change to allow direct connection to Company A's cloud services during telework, bypassing both the company's internal network and the company PC.\n\nUpon this setting change, Mr. B, Company A's information security leader, reviewed it for any information security issues and found several problems. One of them was an increased risk of unauthorized access to Company A's cloud services. Therefore, Mr. B decided to request countermeasures from the information systems department to mitigate this risk.\n\n[Question]\nOf the following countermeasures, which one did Mr. B decide to request from the information systems department? Choose the most appropriate option from the answer choices."
        },
        programLines: { 
            ja: [], 
            en: [] 
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'A社の社内ネットワークからA社利用クラウドサービスへの通信を監視する。' },
                { label: 'イ', value: 'A社の社内ネットワークとA社利用クラウドサービスとの間の通信速度を制限する。' },
                { label: 'ウ', value: 'A社利用クラウドサービスにA社外から接続する際の認証に2要素認証を導入する。' },
                { label: 'エ', value: 'A社利用クラウドサービスのうち，A社利用グループウェアだけを直接接続の対象とする。' },
                { label: 'オ', value: '専用アプリの保存禁止機能を無効にする。' },
            ],
            en: [
                { label: 'A', value: 'Monitor the communication from Company A\'s internal network to Company A\'s cloud services.' },
                { label: 'B', value: 'Limit the communication speed between Company A\'s internal network and Company A\'s cloud services.' },
                { label: 'C', value: 'Introduce two-factor authentication for connections to Company A\'s cloud services from outside the company.' },
                { label: 'D', value: 'Make only Company A\'s groupware, among its cloud services, the target for direct connection.' },
                { label: 'E', value: 'Disable the save prohibition function of the dedicated app.' },
            ]
        },
        correctAnswer: 'A社利用クラウドサービスにA社外から接続する際の認証に2要素認証を導入する。',
        explanationText: {
            ja: "設定変更前は、A社のクラウドサービスへのアクセスは「A社の社内ネットワークからのみ」に制限されていました。これが一種のセキュリティ機能として働いていました。\n\n設定変更後は、この制限がなくなり、従業員は自宅など社外のネットワークから直接クラウドサービスに接続できるようになります。これにより、利便性は向上しますが、同時にIDとパスワードさえ分かれば誰でもどこからでもアクセスできてしまうという「不正アクセスのリスク」が増加します。\n\nこの新しいリスクを低減するための最も直接的で有効な対策は、IDとパスワードに加えた追加の認証要素を要求すること、すなわち「2要素認証の導入」です。これにより、たとえIDとパスワードが漏洩しても、不正なログインを防ぐことができます。\n\nしたがって、正解は「ウ」です。",
            en: "Before the setting change, access to Company A's cloud services was restricted to 'only from Company A's internal network'. This acted as a security measure.\n\nAfter the change, this restriction is removed, allowing employees to connect directly to the cloud services from external networks like their homes. While this improves convenience, it also increases the 'risk of unauthorized access', as anyone with the user ID and password can access the services from anywhere.\n\nThe most direct and effective countermeasure to mitigate this new risk is to require an additional authentication factor besides the ID and password, which is the 'introduction of two-factor authentication'. This can prevent unauthorized logins even if the ID and password are compromised.\n\nTherefore, the correct answer is 'C'."
        },
        initialVariables: {},
        traceLogic: [],
        calculateNextLine: undefined,
        difficultyId: 7
    },
    // --- 基本情報科目B基礎 問1 (ID: 39) ---
    {
      id: '39',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問1", en: "Basic Subject B Foundation Q1" },
      description: { 
        ja: "次の記述中の a と b に入れる正しい答えの組合せを、回答群の中から選びなさい。関数 gradeEvaluation は、引数で与えられた inData を用いて成績評価を行い、その結果を返します。inData は 0 以上 100 以下の整数値です。関数 gradeEvaluation を gradeEvaluation(92) として呼び出すと、戻り値は \"a\"、gradeEvaluation(65) として呼び出すと、戻り値は \"b\" となる。", 
        en: "" 
      },
      programLines: {
        ja: [
          '文字列型：gradeEvaluation(整数型： inData)',
          '  文字列型：eResult',
          '  if (inData ≧ 90)',
          '    eResult ← "評価S"',
          '  elseif (inData ≧ 70)',
          '    eResult ← "評価A"',
          '  else',
          '    eResult ← "評価B"',
          '  endif',
          '  return eResult'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'a = 評価S, b = 評価A' },
          { label: 'イ', value: 'a = 評価S, b = 評価B' },
          { label: 'ウ', value: 'a = 評価A, b = 評価A' },
          { label: 'エ', value: 'a = 評価A, b = 評価B' }
        ],
        en: []
      },
      correctAnswer: 'a = 評価S, b = 評価B',
      explanationText: { 
        ja: "条件分岐のトレース問題です。\n1. gradeEvaluation(92)の場合: `inData`は92です。最初の条件 `if (inData ≧ 90)` が 真(True) となるため、`eResult` には \"評価S\" が代入されます。\n2. gradeEvaluation(65)の場合: `inData`は65です。最初の条件 `90以上` は偽、次の `elseif (inData ≧ 70)` も偽となります。したがって `else` ブロックが実行され、`eResult` には \"評価B\" が代入されます。\n\nよって、a = 評価S, b = 評価B となります。", 
        en: "" 
      },
      initialVariables: { inData: null, eResult: null },
      traceOptions: {
      presets_array: [
            { label: 'inData = 92', value: { inData: 92 } },
            { label: 'inData = 65', value: { inData: 65 } },
            { label: 'inData = 75', value: { inData: 75 } }
        ]
      },
      traceLogic: [], 
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問2 (ID: 40) ---
    {
      id: '40',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問2", en: "Basic Subject B Foundation Q2" },
      description: { 
        ja: "次の記述中の(a)に入れる正しい答えを、回答群の中から選べ。関数sum10は、10から引数で与えられた値までの総和を求める関数であるが、一部誤りがある。正しく動作させるためには(a)する必要がある。", 
        en: "" 
      },
      programLines: {
        ja: [
          '01　整数型： sum10(整数値：num)',
          '02　　整数型： x ← 10',
          '03　　整数型： i',
          '04　　for (i を 10 から num まで 1 ずつ増やす)',
          '05　　　x ← x + i',
          '06　　endfor',
          '07　　return x'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '行番号02の宣言文を「x ← 0」に訂正' },
          { label: 'イ', value: '行番号04の制御記述を「i を 11 から num まで -1 ずつ増やす」に訂正' },
          { label: 'ウ', value: '行番号05の処理を「i ← i + x」に訂正' },
          { label: 'エ', value: '行番号07の処理を「return i」に変更' }
        ],
        en: []
      },
      correctAnswer: '行番号02の宣言文を「x ← 0」に訂正',
      explanationText: { 
        ja: "変数の初期化に関する問題です。\nプログラムの目的は「10からnumまでの総和」を求めることです。ループは `i` を 10 から `num` まで回して `x` に加算していますが、`x` の初期値が `10` になっています。\nこのままだと、最初のループ（i=10）の時点で `x ← 10 + 10` となり、10が二重に加算されてしまいます。合計値を計算する変数（アキュムレータ）は通常 `0` で初期化する必要があります。\nしたがって、行番号02を `x ← 0` に修正するのが正解です。", 
        en: "" 
      },
      initialVariables: { num: null, x: null, i: null },
      traceOptions: {
        presets: [15, 20]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問3 (ID: 41) ---
    {
      id: '41',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問3", en: "Basic Subject B Foundation Q3" },
      description: { 
        ja: "次の記述中の (a) に入れる正しい答えを、回答群の中から選べ。ここで、配列の要素番号は 1 から始まる。関数 func({12, 4, 10, 3, 25, 19, 6, 7, 5, 2}) として呼び出すと、戻り値は (a) となる。", 
        en: "" 
      },
      programLines: {
        ja: [
          '整数型：func(整数型の配列：data)',
          '  整数型：n ← dataの要素数',
          '  整数型：a, i',
          '  a ← data[n]',
          '  for (i を n - 1 から 1 まで 1 ずつ減らす)',
          '     if (data[i] > a)',
          '       a ← data[i]',
          '     endif',
          '  endfor',
          '  return a'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '2' },
          { label: 'イ', value: '3' },
          { label: 'ウ', value: '4' },
          { label: 'エ', value: '5' },
          { label: 'オ', value: '6' },
          { label: 'カ', value: '7' },
          { label: 'キ', value: '10' },
          { label: 'ク', value: '19' },
          { label: 'ケ', value: '25' }
        ],
        en: []
      },
      correctAnswer: '25',
      explanationText: { 
        ja: "このプログラムは「配列内の最大値」を見つけるアルゴリズムです。\n1. 変数 `a` に配列の最後の要素 `data[n]` (この場合は2) を代入します。\n2. ループで配列を後ろから前へ走査します。\n3. `data[i] > a` ならば、`a` をその値で更新します。\n\n配列 `{12, 4, 10, 3, 25, 19, 6, 7, 5, 2}` の中で最も大きい値は `25` です。\nループ終了後、変数 `a` には最大値である 25 が格納されています。", 
        en: "" 
      },
      initialVariables: { data: [12, 4, 10, 3, 25, 19, 6, 7, 5, 2], n: 10, a: null, i: null },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問4 (ID: 42) ---
    {
      id: '42',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問4", en: "Basic Subject B Foundation Q4" },
      description: { 
        ja: "次のプログラム中の (a) と (b) に入れる正しい答えの組み合わせを、回答群の中から選べ。配列 x のデータの後ろに、配列 y のデータを連結した配列 z を返す関数である。", 
        en: "" 
      },
      programLines: {
        ja: [
          '文字型の配列：conCat(文字型の配列：x,文字型の配列：y)',
          '  整数型: len_x ← xの要素数',
          '  整数型: len_y ← yの要素数',
          '  文字型の配列: z ← {(len_x + len_y)個の未定義の値}',
          '  整数型:k',
          '  for (k を 1 から len_x まで 1 ずつ増やす)',
          '    (a)',
          '  endfor',
          '  for (k を 1 から len_y まで 1 ずつ増やす)',
          '    (b)',
          '  endfor',
          '  return z'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'z[k] ← x[k]  z[len_x + k] ← y[k]' },
          { label: 'イ', value: 'z[k] ← x[k]  z[len_y + k] ← y[k]' },
          { label: 'ウ', value: 'z[k] ← y[k]  z[len_x + k] ← x[k]' },
          { label: 'エ', value: 'z[k] ← y[k]  z[len_y + k] ← x[k]' }
        ],
        en: []
      },
      correctAnswer: 'z[k] ← x[k]  z[len_x + k] ← y[k]',
      explanationText: { 
        ja: "配列連結のロジックです。\n1. 最初のループ `(a)` では、配列 `x` の内容をそのまま配列 `z` の前半にコピーします。したがって `z[k] ← x[k]` です。\n2. 次のループ `(b)` では、配列 `y` の内容を配列 `z` の後半にコピーします。`z` の後半の開始位置は `len_x + 1` から始まるため、インデックスは `len_x + k` となります。したがって `z[len_x + k] ← y[k]` です。\n\nよって、正解は「ア」です。", 
        en: "" 
      },
      initialVariables: { 
          x: null, 
          y: null, 
          z: null, 
          len_x: null, 
          len_y: null, 
          k: null,
          loop2_active: false // 2つ目のループに入ったかどうかのフラグ
      },
      traceOptions: {
        presets_array: [
           { 
             label: 'x={"A","B"}, y={"C"}', 
             value: { x: ["A", "B"], y: ["C"] } 
           },
           { 
             label: 'x={"1","2"}, y={"3","4"}', 
             value: { x: ["1", "2"], y: ["3", "4"] } 
           }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問5 (ID: 43) ---
    {
      id: '43',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問5", en: "Basic Subject B Foundation Q5" },
      description: { 
        ja: "次のプログラム中の □ に入れる正しい答えを、回答群の中から選びなさい。二つの □ には、同じ答えが入ります。このプログラムは、整数型の配列 array の要素の並びを 逆順 にします。", 
        en: "" 
      },
      programLines: {
        ja: [
          '整数型の配列: array ← {10, 20, 30, 40, 50, 60}',
          '整数型: left, right, tmp',
          'left ← 1',
          'right ← arrayの要素数',
          'while (left < right)',
          '  tmp ← array[right]',
          '  array[right] ← □',
          '  □ ← tmp',
          '  left ← left + 1',
          '  right ← right - 1',
          'endwhile'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'array[left]' },
          { label: 'イ', value: 'array[left + 1]' },
          { label: 'ウ', value: 'array[left - 1]' },
          { label: 'エ', value: 'array[tmp - left]' }
        ],
        en: []
      },
      correctAnswer: 'array[left]',
      explanationText: { 
        ja: "配列の両端から要素を交換（スワップ）するアルゴリズムです。\n1. `tmp ← array[right]` で右側の値を退避。\n2. `array[right] ← array[left]` で左側の値を右側に代入（空欄1）。\n3. `array[left] ← tmp` で退避しておいた右側の値を左側に代入（空欄2）。\n\nこれにより、左右の値が入れ替わります。したがって、空欄には `array[left]` が入ります。", 
        en: "" 
      },
      initialVariables: { array: [10, 20, 30, 40, 50, 60], left: 1, right: 6, tmp: null },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問6 (ID: 44) ---
    {
      id: '44',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問6", en: "Basic Subject B Foundation Q6" },
      description: { 
        ja: "次の記述中の □ に入れる正しい答えを、回答群の中から選びなさい。関数sumArrayをsumArray({4,7,10,2,12,8,6,3,9,5},{2,4,7,10})として呼び出したときの戻り値は □ です。", 
        en: "" 
      },
      programLines: {
        ja: [
          '整数型: sumArray(整数型の配列: a, 整数型の配列: b)',
          '  整数型: n ← b の要素数',
          '  整数型: x ← 0',
          '  for(i を 1 から n まで 1 ずつ増やす)',
          '    x ← x + a[b[i]]',
          '  endfor',
          '  return x'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '18' },
          { label: 'イ', value: '20' },
          { label: 'ウ', value: '25' },
          { label: 'エ', value: '30' },
          { label: 'オ', value: '33' }
        ],
        en: []
      },
      correctAnswer: '20',
      explanationText: { 
        ja: "配列 `b` の各要素をインデックスとして使い、配列 `a` の値を参照して合計しています。\n1. i=1: b[1]=2, a[2]=7, x=7\n2. i=2: b[2]=4, a[4]=2, x=7+2=9\n3. i=3: b[3]=7, a[7]=6, x=9+6=15\n4. i=4: b[4]=10, a[10]=5, x=15+5=20\n\nしたがって、戻り値は 20 です。", 
        en: "" 
      },
      initialVariables: { 
        a: null, 
        b: null, 
        n: null, 
        x: null, 
        i: null 
      },
      traceOptions: {
        presets_array: [
          { 
            label: '問題文のデータをセット', 
            value: { 
              a: [4, 7, 10, 2, 12, 8, 6, 3, 9, 5], 
              b: [2, 4, 7, 10] 
            } 
          }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問7 (ID: 45) ---
    {
      id: '45',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問7", en: "Basic Subject B Foundation Q7" },
      description: { 
        ja: "次のプログラム中の □ に入れる正しい答えを、回答群の中から選びなさい。手続insertSortStepは、挿入ソートの途中処理を行う。", 
        en: "" 
      },
      programLines: {
        ja: [
          'insertSortStep(整数型: pos)',
          '　整数型: j, temp',
          '　temp ← nums[pos]',
          '　j ← pos - 1',
          '　while (nums[j] □ temp)',
          '　　nums[j + 1] ← nums[j]',
          '　　j ← j - 1',
          '　endwhile',
          '　nums[j + 1] ← temp'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '＝' },
          { label: 'イ', value: '≠' },
          { label: 'ウ', value: '＜' },
          { label: 'エ', value: '＞' }
        ],
        en: []
      },
      correctAnswer: '＞',
      explanationText: { 
        ja: "挿入ソートの内部動作です。`temp`（挿入したい値）よりも前にある要素 `nums[j]` が大きい場合、その要素を一つ後ろ `nums[j+1]` にずらす必要があります。\nしたがって、ループ条件は `nums[j] > temp` となります。\n正しい記号は「＞」です。", 
        en: "" 
      },
      initialVariables: { 
        nums: null, 
        pos: null, 
        j: null, 
        temp: null 
      },
      // 例: {10, 30, 40, 20, 50} の4番目の要素(20)を適切な位置に挿入するケース
      traceOptions: {
        presets_array: [
          { 
            label: 'nums={10, 30, 40, 20, 50}, pos=4', 
            value: { 
              nums: [10, 30, 40, 20, 50], 
              pos: 4 
            } 
          }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問8 (ID: 46) ---
    {
      id: '46',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問8", en: "Basic Subject B Foundation Q8" },
      description: { 
        ja: "関数gcdをgcd(84,36)として呼び出したとき、αで示された繰り返しの判定は□回実行されて処理が終了する。", 
        en: "" 
      },
      programLines: {
        ja: [
          '整数型: gcd(整数型： a, 整数型：b)',
          '　整数型: m ← a',
          '　整数型: n ← b',
          '　while (m ≠ n)   ← α',
          '　　if (m > n)',
          '　　　m ← m - n',
          '　　else',
          '　　　n ← n - m',
          '　　endif',
          '　endwhile',
          '　return m'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '4' },
          { label: 'イ', value: '5' },
          { label: 'ウ', value: '6' },
          { label: 'エ', value: '7' }
        ],
        en: []
      },
      correctAnswer: '5',
      explanationText: { 
        ja: "ユークリッドの互除法（減算版）のトレースです。\n初期: m=84, n=36\n1回目判定: 84≠36 (真) -> m=84-36=48\n2回目判定: 48≠36 (真) -> m=48-36=12\n3回目判定: 12≠36 (真) -> n=36-12=24\n4回目判定: 12≠24 (真) -> n=24-12=12\n5回目判定: 12≠12 (偽) -> ループ終了\n\n判定は合計5回行われます。", 
        en: "" 
      },
      initialVariables: { a: 84, b: 36, m: null, n: null },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問9 (ID: 47) ---
    {
      id: '47',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問9", en: "Basic Subject B Foundation Q9" },
      description: { 
        ja: "次のプログラム中の(a)と(b)に入れる正しい答えの組合せを、解答群の中から選べ。関数strToIntは、数字文字列を数値に変換する。", 
        en: "" 
      },
      programLines: {
        ja: [
          '整数型：strToInt（文字型の配列：str）',
          '  整数型：val, i, tmp',
          '  val ← 0',
          '  i ← 1',
          '  while（a）',
          '    tmp ← charToInt(str[i])',
          '    b',
          '    i ← i + 1',
          '  endwhile',
          '  return val'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'str[i] ＝ “$”　val ← val ＋ tmp' },
          { label: 'イ', value: 'str[i] ＝ “$”　val ← val × 10 ＋ tmp' },
          { label: 'ウ', value: 'str[i] ≠ “$”　val ← val × 10 ＋ tmp' },
          { label: 'エ', value: 'str[i] ≠ “$”　val ← val ＋ tmp × 10' }
        ],
        en: []
      },
      correctAnswer: 'str[i] ≠ “$”　val ← val × 10 ＋ tmp',
      explanationText: { 
        ja: "文字列を整数に変換する処理です。\n(a) ループ条件: 終端文字 `$` が出るまで続けるため、`str[i] ≠ “$”` です。\n(b) 変換処理: 新しい桁を読み込むたびに、これまでの値を10倍して新しい値を加えます。 `val ← val × 10 ＋ tmp` です。\n\n例: \"12\" -> 1 -> 1*10+2 = 12", 
        en: "" 
      },
      initialVariables: { 
        str: null, 
        val: null, 
        i: null, 
        tmp: null 
      },
      // プリセットを追加（重要: 終端文字 $ を含める）
      traceOptions: {
        presets_array: [
          { 
            label: 'str = "12$"', 
            value: { str: ["1", "2", "$"] } 
          },
          { 
            label: 'str = "345$"', 
            value: { str: ["3", "4", "5", "$"] } 
          }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問10 (ID: 48) ---
    {
      id: '48',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問10", en: "Basic Subject B Foundation Q10" },
      description: { 
        ja: "関数decToBinは、引数として与えられた10進整数nを6桁の2進数に変換する。", 
        en: "" 
      },
      programLines: {
        ja: [
          '整数型の配列：decToBin（整数型：n）',
          '  整数型の配列：bin（←6個の未定義の値）',
          '  整数型：j ← n',
          '  整数型：k',
          '  for（k を 6 から 1 まで 1ずつ減らす）',
          '    a',
          '    b',
          '  endfor',
          '  return bin'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'j ← j ÷ 2 の商 / bin[k] ← j ÷ 2 の余り' },
          { label: 'イ', value: 'j ← j ÷ 2 の余り / bin[k] ← j ÷ 2 の商' },
          { label: 'ウ', value: 'bin[k] ← j ÷ 2 の商 / j ← j ÷ 2 の余り' },
          { label: 'エ', value: 'bin[k] ← j ÷ 2 の余り / j ← j ÷ 2 の商' }
        ],
        en: []
      },
      correctAnswer: 'bin[k] ← j ÷ 2 の余り / j ← j ÷ 2 の商',
      explanationText: { 
        ja: "10進数を2進数に変換するには、2で割った余りを下の桁から順に格納し、商を次の計算に用います。\nループは `k` を 6 から 1 に減らしているので、下の桁（bin[6]）から格納しています。\n\n1. `bin[k] ← j ÷ 2 の余り` (現在の桁を決定)\n2. `j ← j ÷ 2 の商` (次の桁のために値を更新)\n\nこの順序で行われている「エ」が正解です。", 
        en: "" 
      },
      initialVariables: { 
        n: null, 
        bin: null, 
        j: null, 
        k: null 
      },
      // 例: 13 (001101), 45 (101101) など
      traceOptions: {
        presets_array: [
          { label: 'n = 13', value: { n: 13 } },
          { label: 'n = 45', value: { n: 45 } },
          { label: 'n = 63', value: { n: 63 } }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問11 (ID: 49) ---
    {
      id: '49',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問11", en: "Basic Subject B Foundation Q11" },
      description: { 
        ja: "手続きbitORは8ビット型の引数aとbを受け取り、aとbの論理和演算の結果を出力する。", 
        en: "" 
      },
      programLines: {
        ja: [
          'bitOR(8ビット型: x, 8ビット型: y)',
          '　8ビット型: result, flag ← 128',
          '　result ← x ⋁ y',
          '　for (i を 1 から 8 まで 1 ずつ増やす)',
          '　　if ((result ⋀ flag) が (a) と等しい)',
          '　　　0を出力',
          '　　else',
          '　　　1を出力',
          '　　endif',
          '　　(b)',
          '　endfor'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '00000000 / mask ← mask << 1' },
          { label: 'イ', value: '00000000 / mask ← mask >> 1' },
          { label: 'ウ', value: '00000001 / mask ← mask << 1' },
          { label: 'エ', value: '00000001 / mask ← mask >> 1' }
        ],
        en: []
      },
      correctAnswer: '00000000 / mask ← mask >> 1',
      explanationText: { 
        ja: "最上位ビットから順に判定して出力するロジックです。\n初期値 `flag = 128` (10000000) です。\n(a) `result ⋀ flag` が 0 であれば、そのビットは 0 です。したがって `00000000` と比較します。\n(b) 次のビットを検査するために、フラグを右に1ビットシフトします。 `mask ← mask >> 1` (ここでは変数名がmaskになっていますがflagのことです)。", 
        en: "" 
      },
      initialVariables: { 
        x: null, 
        y: null, 
        result: null, 
        flag: null, 
        i: null,
        output: [] // 出力結果を保存する配列
      },
      // プリセットを追加
      traceOptions: {
        presets_array: [
          // 170(10101010) OR 85(01010101) = 255(11111111)
          { label: 'x=170, y=85', value: { x: 170, y: 85 } },
          // 15(00001111) OR 240(11110000) = 255(11111111)
          { label: 'x=15, y=240', value: { x: 15, y: 240 } },
          // 128(10000000) OR 1(00000001) = 129(10000001)
          { label: 'x=128, y=1', value: { x: 128, y: 1 } }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問12 (ID: 50) ---
    {
      id: '50',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問12", en: "Basic Subject B Foundation Q12" },
      description: { 
        ja: "関数Gに G(4) を渡した場合、戻り値は □ である。", 
        en: "" 
      },
      programLines: {
        ja: [
          '整数型: G(整数型: x)',
          '　if (x ≦ 1)',
          '　　return 1',
          '　else',
          '　　return x + G(x - 1)',
          '　endif'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '9' },
          { label: 'イ', value: '10' },
          { label: 'ウ', value: '11' },
          { label: 'エ', value: '12' }
        ],
        en: []
      },
      correctAnswer: '10',
      explanationText: { 
        ja: "再帰関数のトレースです。\nG(4) = 4 + G(3)\n     = 4 + (3 + G(2))\n     = 4 + 3 + (2 + G(1))\n     = 4 + 3 + 2 + 1  (x<=1なので1を返す)\n     = 10", 
        en: "" 
      },
      initialVariables: { 
        x: null, 
        retVal: null,      // 関数の戻り値
        callStack: [],     // 呼び出し履歴 (xの値を保存)
        isReturning: false // 「戻り」フェーズかどうかのフラグ
      },
      traceOptions: {
        presets_array: [
          { label: 'x = 4', value: { x: 4 } },
          { label: 'x = 3', value: { x: 3 } },
          { label: 'x = 5', value: { x: 5 } }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問13 (ID: 51) ---
    {
      id: '51',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問13", en: "Basic Subject B Foundation Q13" },
      description: { 
        ja: "再帰的に定義された手続 display(3) を実行したとき、画面に表示される数字は？", 
        en: "" 
      },
      programLines: {
        ja: [
          'display(整数型: x)',
          '　if (x = 0)',
          '　　return',
          '　endif',
          '　x を出力する',
          '　display(x - 1)',
          '　x を出力する'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '3210123' },
          { label: 'イ', value: '321123' },
          { label: 'ウ', value: '32100123' },
          { label: 'エ', value: '32112321' }
        ],
        en: []
      },
      correctAnswer: '321123',
      explanationText: { 
        ja: "サンドイッチ状に出力される再帰関数です。\n1. display(3)開始 -> 「3」出力\n2. display(2)呼び出し\n   -> 「2」出力\n   -> display(1)呼び出し\n      -> 「1」出力\n      -> display(0)呼び出し -> 何もしない\n      -> 「1」出力\n   -> 「2」出力\n3. 「3」出力\n\n結果: 3 2 1 1 2 3", 
        en: "" 
      },
      initialVariables: { 
        x: null, 
        output: [], 
        callStack: [], 
        isReturning: false 
      },
      traceOptions: {
        presets_array: [
          { label: 'x = 3', value: { x: 3 } }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問14 (ID: 52) ---
    {
      id: '52',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問14", en: "Basic Subject B Foundation Q14" },
      description: { 
        ja: "手続きbitANDは8ビット型の引数pとqを受け取り、pとqの論理積演算の結果を出力する。", 
        en: "" 
      },
      programLines: {
        ja: [
          'bitAND(8ビット型: p, 8ビット型: q)',
          '  8ビット型: result, mask ← 128',
          '  result ← p ∧ q',
          '  for (i を 1 から 8 まで 1 ずつ増やす)',
          '    if ((result ⋀ mask) が (A) と等しい)',
          '      0を出力',
          '    else',
          '      1を出力',
          '    endif',
          '    (B)',
          '  endfor'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '00000000 / mask ← mask << 1' },
          { label: 'イ', value: '00000000 / mask ← mask >> 1' },
          { label: 'ウ', value: '00000001 / mask ← mask << 1' },
          { label: 'エ', value: '00000001 / mask ← mask >> 1' }
        ],
        en: []
      },
      correctAnswer: '00000000 / mask ← mask >> 1',
      explanationText: { 
        ja: "最上位ビットから順に判定して出力するロジックです。\n初期値 `mask = 128` (10000000) です。\n(A) `result ⋀ mask` が 0 であれば、そのビットは 0 です。したがって `00000000` と比較します。\n(B) 次のビットを検査するために、マスクを右に1ビットシフトします。 `mask ← mask >> 1`。", 
        en: "" 
      },
      // 初期変数を定義
      initialVariables: { 
        p: null, 
        q: null, 
        result: null, 
        mask: null, 
        i: null,
        output: [] 
      },
      // プリセットを追加
      traceOptions: {
        presets_array: [
          // 10(00001010) AND 12(00001100) = 8(00001000)
          { label: 'p=10, q=12', value: { p: 10, q: 12 } },
          // 255(11111111) AND 15(00001111) = 15(00001111)
          { label: 'p=255, q=15', value: { p: 255, q: 15 } },
          // 170(10101010) AND 85(01010101) = 0(00000000)
          { label: 'p=170, q=85', value: { p: 170, q: 85 } }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // --- 基本情報科目B基礎 問15 (ID: 53) ---
    {
      id: '53',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B基礎 問15", en: "Basic Subject B Foundation Q15" },
      description: { 
        ja: "手続insertStepは、昇順に並んでいるdata[1]～data[index-1]の中に、data[index]を正しい位置に挿入する処理を行う。", 
        en: "" 
      },
      programLines: {
        ja: [
          'insertStep(整数型: index)',
          '  整数型: k, val',
          '  val ← data[index]',
          '  k ← index - 1',
          '  while (data[k] □ val)',
          '    data[k + 1] ← data[k]',
          '    k ← k - 1',
          '  endwhile',
          '  data[k + 1] ← val'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '＝' },
          { label: 'イ', value: '≠' },
          { label: 'ウ', value: '＜' },
          { label: 'エ', value: '＞' }
        ],
        en: []
      },
      correctAnswer: '＞',
      explanationText: { 
        ja: "挿入ソートのステップです。挿入する値 `val` よりも大きい要素がある限り、その要素を右にずらしてスペースを作ります。したがって条件は `data[k] > val` となります。", 
        en: "" 
      },
      // 初期変数を定義
      initialVariables: { 
        data: null, 
        index: null, 
        k: null, 
        val: null 
      },
      // プリセットを追加
      traceOptions: {
        presets_array: [
          // [10, 30, 40, 20, 50] の 4番目(20) を適切な位置(2番目)に挿入する
          { 
            label: 'data={10,30,40,20,50}, index=4', 
            value: { 
              data: [10, 30, 40, 20, 50], 
              index: 4 
            } 
          },
          // [5, 1, 3] の 2番目(1) を先頭に挿入するケース
          { 
            label: 'data={5,1,3}, index=2', 
            value: { 
              data: [5, 1, 3], 
              index: 2 
            } 
          }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 7
    },
  
    // =================================================================================
    // --- 問54以降: 基本情報科目B応用 (ID: 54 ~ 68) ---
    // =================================================================================
  
    // --- 基本情報科目B応用 問1 (ID: 54) ---
    {
      id: '54',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問1", en: "Basic Subject B Applied Q1" },
      description: { 
        ja: "次の記述中の□に入れる正しい答えを、回答群の中から選べ。関数calcScoreは、ゲームの成績が格納された文字型の配列markを受け取り、それをもとに計算した合計得点を返す関数である。", 
        en: "" 
      },
      programLines: {
        ja: [
          '整数型: calcScore(文字型の配列: mark)',
          '  整数型: score ← 0',
          '  整数型: i, curr',
          '  for (i を 1 から markの要素数 まで 1 ずつ増やす)',
          '    curr ← num(mark[i])',
          '    score ← score + curr',
          '    if (mark[i] が "_" と等しい)',
          '      [   a   ]',
          '    endif',
          '  endfor',
          '  return score'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'score ← score + curr' },
          { label: 'イ', value: 'score ← score + num(mark[i-1])' },
          { label: 'ウ', value: 'score ← score + num(mark[i+1])' },
          { label: 'エ', value: 'score ← score + num(mark[i])' }
        ],
        en: []
      },
      correctAnswer: 'score ← score + num(mark[i-1])',
      explanationText: { ja: "ボーナス計算のロジックです。特定のマークの場合、前の値を加算します。", en: "" },
      initialVariables: { 
        mark: null, 
        score: null, 
        i: null, 
        curr: null 
      },
      traceOptions: {
        presets_array: [
          // 5 + "_" (直前の5を加算) + 2 = 12点
          { label: 'mark = {"5", "_", "2"}', value: { mark: ["5", "_", "2"] } },
          // 2 + 8 + "_" (直前の8を加算) + 1 = 19点
          { label: 'mark = {"2", "8", "_", "1"}', value: { mark: ["2", "8", "_", "1"] } }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },
  
    // --- 基本情報科目B応用 問2 (ID: 55) ---
    {
      id: '55',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問2", en: "Basic Subject B Applied Q2" },
      description: { 
        ja: "文字列の置換を行う関数 replace に関する問題。指定されたターゲット文字列が見つかった場合、置換文字列に置き換える。", 
        en: "" 
      },
      programLines: {
        ja: [
          '文字列型: replace(文字列型: str, 文字列型: target, 文字列型: replacement)',
          '  文字列型: res ← "", 整数型: i ← 1',
          '  while (i <= strの文字数)',
          '    if ( [  a  ] )',
          '      res ← res + [  b  ]',
          '      i ← i + targetの文字数',
          '    else',
          '      res ← res + mid(str, i, 1)',
          '      i ← i + 1',
          '    endif',
          '  endwhile',
          '  return res'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'a: match(str, i, target), b: replacement' },
          { label: 'イ', value: 'a: match(str, i, target), b: target' },
          { label: 'ウ', value: 'a: match(str, i, replacement), b: target' },
          { label: 'エ', value: 'a: str[i] == target, b: replacement' }
        ],
        en: []
      },
      correctAnswer: 'a: match(str, i, target), b: replacement',
      explanationText: { ja: "一致した場合に置換文字列を追加します。", en: "" },
      initialVariables: {
        str: null,
        target: null,
        replacement: null,
        res: "",
        i: null
      },
      // ▼▼▼ プリセットを追加 ▼▼▼
      traceOptions: {
        presets_array: [
          {
            label: 'str="hello world", target="world", rep="Japan"',
            value: { str: "hello world", target: "world", replacement: "Japan" }
          },
          {
            label: 'str="banana", target="na", rep="ki"',
            value: { str: "banana", target: "na", replacement: "ki" }
          }
        ]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },
  
    // =================================================================================
    // --- 問56以降: 基本情報科目B応用 (CSV読み取り分) ---
    // =================================================================================

    // --- 問56 (ID: 56) ---
    {
      id: '56',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問3", en: "Basic Subject B Applied Q3" },
      description: { ja: "次のプログラムは、2つの整数a, bの最大公約数を求めるものである。a=32, b=24のとき、戻り値はいくつか。", en: "" },
      programLines: {
        ja: [
          '整数型: gcd(整数型: a, 整数型: b)',
          '  while (b > 0)',
          '    整数型: r ← a % b',
          '    a ← b',
          '    b ← r',
          '  endwhile',
          '  return a'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '4' },
          { label: 'イ', value: '8' },
          { label: 'ウ', value: '12' },
          { label: 'エ', value: '16' }
        ],
        en: []
      },
      correctAnswer: '8',
      explanationText: { ja: "ユークリッドの互除法を用いています。\n1. 32 % 24 = 8, a=24, b=8\n2. 24 % 8 = 0, a=8, b=0\n3. b=0なのでループ終了、a(8)を返します。", en: "" },
      initialVariables: { a: null, b: null, r: null },
      traceOptions: {
        presets_array: [{ label: 'a=32, b=24', value: { a: 32, b: 24 } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問57 (ID: 57) ---
    {
      id: '57',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問4", en: "Basic Subject B Applied Q4" },
      description: { ja: "次のプログラムは、配列arrayの中にある値targetが存在するか線形探索する。存在すればその添字を、存在しなければ-1を返す。(a)に入れるべき式はどれか。", en: "" },
      programLines: {
        ja: [
          '整数型: search(整数型の配列: array, 整数型: target)',
          '  整数型: i',
          '  for (i を 1 から arrayの要素数 まで 1 ずつ増やす)',
          '    if ( [ a ] )',
          '      return i',
          '    endif',
          '  endfor',
          '  return -1'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'array[i] == target' },
          { label: 'イ', value: 'array[i] != target' },
          { label: 'ウ', value: 'array[i] > target' },
          { label: 'エ', value: 'array[i] < target' }
        ],
        en: []
      },
      correctAnswer: 'array[i] == target',
      explanationText: { ja: "配列の要素 `array[i]` が探している値 `target` と等しいかどうかを判定します。", en: "" },
      initialVariables: { array: null, target: null, i: null },
      traceOptions: {
        presets_array: [{ label: 'array={1,3,5,7}, target=5', value: { array: [1, 3, 5, 7], target: 5 } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問58 (ID: 58) ---
    {
      id: '58',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問5", en: "Basic Subject B Applied Q5" },
      description: { ja: "次のプログラムは、1からnまでの整数の和を返す。calcSum(5)の戻り値はいくつか。", en: "" },
      programLines: {
        ja: [
          '整数型: calcSum(整数型: n)',
          '  整数型: sum ← 0',
          '  整数型: i',
          '  for (i を 1 から n まで 1 ずつ増やす)',
          '    sum ← sum + i',
          '  endfor',
          '  return sum'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '10' },
          { label: 'イ', value: '15' },
          { label: 'ウ', value: '20' },
          { label: 'エ', value: '25' }
        ],
        en: []
      },
      correctAnswer: '15',
      explanationText: { ja: "1+2+3+4+5 = 15 です。", en: "" },
      initialVariables: { n: null, sum: null, i: null },
      traceOptions: {
        presets_array: [{ label: 'n=5', value: { n: 5 } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問59 (ID: 59) ---
    {
      id: '59',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問6", en: "Basic Subject B Applied Q6" },
      description: { ja: "次のプログラムは、配列dataの要素を逆順に入れ替えるものである。(a)に入れるべき文はどれか。", en: "" },
      programLines: {
        ja: [
          'reverse(整数型の配列: data)',
          '  整数型: left ← 1',
          '  整数型: right ← dataの要素数',
          '  整数型: temp',
          '  while (left < right)',
          '    temp ← data[left]',
          '    data[left] ← data[right]',
          '    [ a ]',
          '    left ← left + 1',
          '    right ← right - 1',
          '  endwhile'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'data[right] ← temp' },
          { label: 'イ', value: 'data[right] ← data[left]' },
          { label: 'ウ', value: 'data[left] ← temp' },
          { label: 'エ', value: 'temp ← data[right]' }
        ],
        en: []
      },
      correctAnswer: 'data[right] ← temp',
      explanationText: { ja: "値の交換（スワップ）処理です。`temp` に退避させておいた `data[left]` の元の値を、`data[right]` に代入する必要があります。", en: "" },
      initialVariables: { data: null, left: null, right: null, temp: null },
      traceOptions: {
        presets_array: [{ label: 'data={1,2,3,4,5}', value: { data: [1, 2, 3, 4, 5] } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問60 (ID: 60) ---
    {
      id: '60',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問7", en: "Basic Subject B Applied Q7" },
      description: { ja: "次のプログラムは、文字列strに含まれる文字'a'の個数を数える。countChar(\"banana\")の戻り値はいくつか。", en: "" },
      programLines: {
        ja: [
          '整数型: countChar(文字列型: str)',
          '  整数型: count ← 0',
          '  整数型: i',
          '  for (i を 1 から strの文字数 まで 1 ずつ増やす)',
          '    if (str[i] == "a")',
          '      count ← count + 1',
          '    endif',
          '  endfor',
          '  return count'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '1' },
          { label: 'イ', value: '2' },
          { label: 'ウ', value: '3' },
          { label: 'エ', value: '4' }
        ],
        en: []
      },
      correctAnswer: '3',
      explanationText: { ja: "\"banana\" には 'a' が3回出現します。", en: "" },
      initialVariables: { str: null, count: null, i: null },
      traceOptions: {
        presets_array: [{ label: 'str="banana"', value: { str: "banana" } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問61 (ID: 61) ---
    {
      id: '61',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問8", en: "Basic Subject B Applied Q8" },
      description: { ja: "次のプログラムは、整数nが素数かどうかを判定する。(a)に入れるべき条件式はどれか。", en: "" },
      programLines: {
        ja: [
          '論理型: isPrime(整数型: n)',
          '  if (n < 2) return false',
          '  整数型: i',
          '  for (i を 2 から n - 1 まで 1 ずつ増やす)',
          '    if ( [ a ] )',
          '      return false',
          '    endif',
          '  endfor',
          '  return true'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'n % i == 0' },
          { label: 'イ', value: 'n % i != 0' },
          { label: 'ウ', value: 'n / i == 0' },
          { label: 'エ', value: 'n < i' }
        ],
        en: []
      },
      correctAnswer: 'n % i == 0',
      explanationText: { ja: "割り切れる（余りが0になる）場合、その数は素数ではありません。", en: "" },
      initialVariables: { n: null, i: null },
      traceOptions: {
        presets_array: [{ label: 'n=7', value: { n: 7 } }, { label: 'n=10', value: { n: 10 } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問62 (ID: 62) ---
    {
      id: '62',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問9", en: "Basic Subject B Applied Q9" },
      description: { ja: "次のプログラムは、フィボナッチ数列の第n項を求める。fib(5)の戻り値はいくつか。ただしfib(0)=0, fib(1)=1とする。", en: "" },
      programLines: {
        ja: [
          '整数型: fib(整数型: n)',
          '  if (n <= 1)',
          '    return n',
          '  else',
          '    return fib(n - 1) + fib(n - 2)',
          '  endif'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '2' },
          { label: 'イ', value: '3' },
          { label: 'ウ', value: '5' },
          { label: 'エ', value: '8' }
        ],
        en: []
      },
      correctAnswer: '5',
      explanationText: { ja: "fib(0)=0, fib(1)=1, fib(2)=1, fib(3)=2, fib(4)=3, fib(5)=5 となります。", en: "" },
      initialVariables: { n: null, ret: null },
      traceOptions: {
        presets_array: [{ label: 'n=5', value: { n: 5 } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問63 (ID: 63) ---
    {
      id: '63',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問10", en: "Basic Subject B Applied Q10" },
      description: { ja: "次のプログラムは、配列の要素を昇順にソートする（選択ソート）。(a)に入れるべき式はどれか。", en: "" },
      programLines: {
        ja: [
          'sort(整数型の配列: data)',
          '  整数型: i, j, minIndex, temp',
          '  for (i を 1 から dataの要素数 - 1 まで 1 ずつ増やす)',
          '    minIndex ← i',
          '    for (j を i + 1 から dataの要素数 まで 1 ずつ増やす)',
          '      if ( [ a ] )',
          '        minIndex ← j',
          '      endif',
          '    endfor',
          '    temp ← data[i]',
          '    data[i] ← data[minIndex]',
          '    data[minIndex] ← temp',
          '  endfor'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: 'data[j] < data[minIndex]' },
          { label: 'イ', value: 'data[j] > data[minIndex]' },
          { label: 'ウ', value: 'data[j] == data[minIndex]' },
          { label: 'エ', value: 'data[j] != data[minIndex]' }
        ],
        en: []
      },
      correctAnswer: 'data[j] < data[minIndex]',
      explanationText: { ja: "最小値を探して `minIndex` を更新するため、現在の最小値候補よりも小さい値が見つかった場合に更新します。", en: "" },
      initialVariables: { data: null, i: null, j: null, minIndex: null, temp: null },
      traceOptions: {
        presets_array: [{ label: 'data={3,1,4,2}', value: { data: [3, 1, 4, 2] } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問64 (ID: 64) ---
    {
      id: '64',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問11", en: "Basic Subject B Applied Q11" },
      description: { ja: "次のプログラムは、2つの整数x, yの平均値を計算する。average(10, 20)の戻り値はいくつか。", en: "" },
      programLines: {
        ja: [
          '実数型: average(整数型: x, 整数型: y)',
          '  return (x + y) / 2'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '10' },
          { label: 'イ', value: '15' },
          { label: 'ウ', value: '20' },
          { label: 'エ', value: '25' }
        ],
        en: []
      },
      correctAnswer: '15',
      explanationText: { ja: "(10 + 20) / 2 = 15 です。", en: "" },
      initialVariables: { x: null, y: null },
      traceOptions: {
        presets_array: [{ label: 'x=10, y=20', value: { x: 10, y: 20 } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問65 (ID: 65) ---
    {
      id: '65',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問12", en: "Basic Subject B Applied Q12" },
      description: { ja: "次のプログラムは、スタックに対する操作を行う。push(1), push(2), pop(), push(3)を実行した後、pop()で取り出される値は何か。", en: "" },
      programLines: {
        ja: [
          'スタック操作',
          'push(1)',
          'push(2)',
          'pop() // 取り出された値は破棄',
          'push(3)',
          'return pop()'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '1' },
          { label: 'イ', value: '2' },
          { label: 'ウ', value: '3' },
          { label: 'エ', value: 'エラー' }
        ],
        en: []
      },
      correctAnswer: '3',
      explanationText: { ja: "Stack: [1] -> [1, 2] -> [1] -> [1, 3] -> 3を取り出す。", en: "" },
      initialVariables: { stack: [], ret: null },
      traceOptions: {
        presets_array: [{ label: '実行', value: { stack: [] } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問66 (ID: 66) ---
    {
      id: '66',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問13", en: "Basic Subject B Applied Q13" },
      description: { ja: "次のプログラムは、キューに対する操作を行う。enqueue(1), enqueue(2), dequeue(), enqueue(3)を実行した後、dequeue()で取り出される値は何か。", en: "" },
      programLines: {
        ja: [
          'キュー操作',
          'enqueue(1)',
          'enqueue(2)',
          'dequeue() // 取り出された値は破棄',
          'enqueue(3)',
          'return dequeue()'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '1' },
          { label: 'イ', value: '2' },
          { label: 'ウ', value: '3' },
          { label: 'エ', value: 'エラー' }
        ],
        en: []
      },
      correctAnswer: '2',
      explanationText: { ja: "Queue: [1] -> [1, 2] -> [2] -> [2, 3] -> 2を取り出す。", en: "" },
      initialVariables: { queue: [], ret: null },
      traceOptions: {
        presets_array: [{ label: '実行', value: { queue: [] } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },

    // --- 問67 (ID: 67) ---
    {
      id: '67',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問14", en: "Basic Subject B Applied Q14" },
      description: { ja: "次のプログラムは、整数nの絶対値を返す。abs(-10)の戻り値はいくつか。", en: "" },
      programLines: {
        ja: [
          '整数型: abs(整数型: n)',
          '  if (n < 0)',
          '    return -n',
          '  else',
          '    return n',
          '  endif'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '-10' },
          { label: 'イ', value: '0' },
          { label: 'ウ', value: '10' },
          { label: 'エ', value: 'エラー' }
        ],
        en: []
      },
      correctAnswer: '10',
      explanationText: { ja: "-10 < 0 なので -(-10) = 10 を返します。", en: "" },
      initialVariables: { n: null },
      traceOptions: {
        presets_array: [{ label: 'n=-10', value: { n: -10 } }, { label: 'n=5', value: { n: 5 } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
    },
    // --- 問68 (ID: 68) ---
    {
      id: '68',
      logicType: 'PSEUDO_CODE',
      title: { ja: "基本情報科目B応用 問15", en: "Basic Subject B Applied Q15" },
      description: { ja: "次のプログラムは、文字列を連長圧縮（ランレングス圧縮）する。連続する文字を「文字＋個数」の形式に変換する。encode(\"AAABBC\")の戻り値はいくつか。", en: "" },
      programLines: {
        ja: [
          '文字列型: encode(文字列型: s)',
          '  文字列型: res ← ""',
          '  整数型: i ← 1, count',
          '  文字型: c',
          '  while (i <= sの文字数)',
          '    c ← s[i]',
          '    count ← 1',
          '    while (i + count <= sの文字数 and s[i + count] == c)',
          '      count ← count + 1',
          '    endwhile',
          '    res ← res + c + 文字列(count)',
          '    i ← i + count',
          '  endwhile',
          '  return res'
        ],
        en: []
      },
      answerOptions: {
        ja: [
          { label: 'ア', value: '"A3B2C1"' },
          { label: 'イ', value: '"3A2B1C"' },
          { label: 'ウ', value: '"AAABBC"' },
          { label: 'エ', value: '"A3B2C"' }
        ],
        en: []
      },
      correctAnswer: '"A3B2C1"',
      explanationText: { ja: "Aが3回、Bが2回、Cが1回続くので \"A3B2C1\" となります。", en: "" },
      initialVariables: { s: null, res: "", i: null, count: null, c: null },
      traceOptions: {
        presets_array: [{ label: 's="AAABBC"', value: { s: "AAABBC" } }]
      },
      traceLogic: [],
      calculateNextLine: undefined,
      difficultyId: 8
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
