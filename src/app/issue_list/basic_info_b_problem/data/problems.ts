/**
 * @file このアプリケーションで扱うすべての問題データを定義するファイルです。
 * @description
 * 問題の追加や修正は、このファイル内の `problems` 配列を編集することで行います。
 * 各問題は `Problem` 型という統一された形式で定義されており、保守性を高めています。
 */


// --- 型定義 ---
// ここでは、問題データを構成するために必要なTypeScriptの「型」を定義しています。
// 型を定義することで、データの構造が明確になり、予期せぬエラーを防ぐことができます。

/**
 * @interface AnswerOption
 * @description 解答群の一つ一つの選択肢が持つデータ構造を定義します。
 */
export interface AnswerOption {
  label: string; // 画面に表示される選択肢の記号 (例: 'ア', 'イ')
  value: string; // 正誤判定に使われる内部的な値 (例: '1,2', 'ウ')
}

/**
 * @type VariablesState
 * @description プログラムのトレース中に変化する、すべての変数の状態を保持するオブジェクトの型です。
 * `Record<string, ...>` を使うことで、どんな名前の変数（'x', 'num', 'out'など）でも柔軟に扱えます。
 */
export type VariablesState = Record<string, number | null | string | number[]>;

/**
 * @type TraceStep
 * @description トレースの1ステップ（1行）で実行される処理を定義する「関数」の型です。
 * この関数は、現在の変数の状態 `vars` を受け取り、その行の処理を適用した「新しい変数の状態」を返します。
 */
export type TraceStep = (vars: VariablesState) => VariablesState;

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
  
  // --- 以下は特定の種類の問題でのみ使用するオプションのプロパティです ---
  
  /**
   * @property {object} [traceOptions] - トレースの特別な設定（FizzBuzz問題などで使用）
   * @property {number[]} presets - ユーザーが選択できるトレース開始時のプリセット値 (例: [3, 5, 15, 7])
   */
  traceOptions?: {
    presets: number[];
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
  // =================================================================================
  // --- 問1: 変数の値交換 ---
  // =================================================================================
  {
    id: '1',
    title: { ja: "サンプル問題 [科目B] 問1", en: "Sample Problem [Subject B] Q1" },
    description: { ja: "次の記述中の□に入れる正しい答えを、解答群の中から選べ。プログラムを実行すると'　　'と出力される。", en: "What are the values of y and z after executing the following program?" },
    programLines: {
      ja: [
        '1 整数型: x ← 1',
        '2 整数型: y ← 2',
        '3 整数型: z ← 3',
        '4 x ← y',
        '5 y ← z',
        '6 z ← x',
        '7 yとzの値をこの順にコンマ区切りで出力する',
      ],
      en: [], // 英語訳は省略
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '1,2' }, { label: 'イ', value: '1,3' }, { label: 'ウ', value: '2,1' },
        { label: 'エ', value: '2,3' }, { label: 'オ', value: '3,1' }, { label: 'カ', value: '3,2' },
      ],
      en: [], // 英語訳は省略
    },
    correctAnswer: '3,2',
    explanationText: { ja: `xは1、yは2、zは3で初期化されています。まずxにyの値である2が代入され、x=2, y=2, z=3となります。次にyにzの値である3が代入され、x=2, y=3, z=3となります。最後にzにxの値である2が代入され、x=2, y=3, z=2となります。したがって、yとzの値は「3,2」です。`, en: `` },
    initialVariables: { x: null, y: null, z: null },
    // traceLogic: プログラムの各行が実行されたときの変数の変化を定義します。
    // 配列の0番目が1行目、1番目が2行目の処理に対応します。
    traceLogic: [
      (vars) => ({ ...vars, x: 1 }),     // 1行目: xに1を代入
      (vars) => ({ ...vars, y: 2 }),     // 2行目: yに2を代入
      (vars) => ({ ...vars, z: 3 }),     // 3行目: zに3を代入
      (vars) => ({ ...vars, x: vars.y }), // 4行目: xに現在のyの値を代入
      (vars) => ({ ...vars, y: vars.z }), // 5行目: yに現在のzの値を代入
      (vars) => ({ ...vars, z: vars.x }), // 6行目: zに現在のxの値を代入
      (vars) => (vars),                   // 7行目: 出力のみで変数の変化はなし
    ]
  },

  // =================================================================================
  // --- 問2: FizzBuzz (条件分岐) ---
  // =================================================================================
  {
    id: '2',
    title: { ja: "サンプル問題 [科目B] 問2", en: "Sample Problem [Subject B] Q2" },
    description: { ja: "次のプログラム中の a ~ c に入れる正しい答えの組み合わせを、解答群の中から選べ。関数 fizzBuzz は、引数で与えられた値が、3で割り切れて5で割り切れない場合は\"3で割り切れる\"を、5で割り切れて3で割り切れない場合は\"5で割り切れる\"を、3と5で割り切れる場合は\"3と5で割り切れる\"を返します。それ以外の場合は\"3でも5でも割り切れない\"を返します。", en: "" },
    programLines: {
      ja: [
        ' 1: ○文字列型: fizzBuzz(整数型: num)', 
        ' 2: 　文字列型: result', 
        ' 3: 　if (num が 3と5 で割り切れる)',
        ' 4: 　　result ← "3と5で割り切れる"', 
        ' 5: 　elseif (num が 3 で割り切れる)', 
        ' 6: 　　result ← "3で割り切れる"',
        ' 7: 　elseif (num が 5 で割り切れる)', 
        ' 8: 　　result ← "5で割り切れる"', 
        ' 9: 　else',
        '10: 　　result ← "3でも5でも割り切れない"', 
        '11: 　endif', 
        '12: 　return result',
      ],
      en: [],
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: 'a:3, b:3と5, c:5' }, { label: 'イ', value: 'a:3, b:5, c:3と5' },
        { label: 'ウ', value: 'a:3と5, b:3, c:5' }, { label: 'エ', value: 'a:5, b:3, c:3と5' },
        { label: 'オ', value: 'a:5, b:3と5, c:3' },
      ],
      en: [],
    },
    correctAnswer: 'a:3と5, b:3, c:5',
    explanationText: { ja: `if-elseif-else構文では、条件は上から順に評価され、最初に真(true)になったブロックだけが実行されます。3と5の両方で割り切れる数（例: 15）は3でも5でも割り切れるため、最も限定的な「3と5で割り切れる」という条件を最初に評価する必要があります。`, en: `` },
    initialVariables: { num: null, result: null },
    traceOptions: { presets: [3, 5, 15, 7] }, // この問題ではユーザーがトレース開始時の`num`の値を選べる
    // traceLogic: この問題は条件分岐があるため、すべての行が常に実行されるわけではありません。
    // そのため、ここでは各行が「もし実行された場合」の処理を定義します。
    // どの行が次に実行されるかは、後述の `calculateNextLine` が決定します。
    traceLogic: [
      (vars) => vars, // 1行目
      (vars) => ({ ...vars, result: null }), // 2行目
      (vars) => vars, // 3行目 (if文)
      (vars) => ({ ...vars, result: "3と5で割り切れる"}), // 4行目
      (vars) => vars, // 5行目 (elseif文)
      (vars) => ({ ...vars, result: "3で割り切れる"}),   // 6行目
      (vars) => vars, // 7行目 (elseif文)
      (vars) => ({ ...vars, result: "5で割り切れる"}),   // 8行目
      (vars) => vars, // 9行目 (else文)
      (vars) => ({ ...vars, result: "3でも5でも割り切れない"}), // 10行目
      (vars) => vars, // 11行目 (endif)
      (vars) => vars, // 12行目 (return)
    ],
    // calculateNextLine: 条件分岐やループを持つ問題のための特別なロジックです。
    // 現在の行と変数の状態から、次にジャンプすべき行番号を返します。
    calculateNextLine: (currentLine, vars) => {
      const num = vars.num as number;
      if (num === null) return currentLine; // numが設定されていなければ進まない
      
      switch (currentLine + 1) { // JavaScriptの配列インデックス(0始まり)を考慮して+1
        case 3: return num % 15 === 0 ? 3 : 4;  // 3行目実行後、15の倍数なら4行目へ、さもなくば5行目へ
        case 4: return 11; // 4行目実行後はendif(11行目)へ
        case 5: return num % 3 === 0 ? 5 : 6;   // 5行目実行後、3の倍数なら6行目へ、さもなくば7行目へ
        case 6: return 11; // 6行目実行後はendif(11行目)へ
        case 7: return num % 5 === 0 ? 7 : 8;   // 7行目実行後、5の倍数なら8行目へ、さもなくば9行目へ
        case 8: return 11; // 8行目実行後はendif(11行目)へ
        case 9: return 9;  // elseなので必ず10行目へ
        case 10: return 11; // 10行目実行後はendif(11行目)へ
        default: return currentLine + 1; // その他の行は、単純に次の行へ
      }
    },
  },

  // =================================================================================
  // --- 問3: 配列の集計 (ループ) ---
  // =================================================================================
  {
    id: '3',
    title: { ja: "サンプル問題 [科目B] 問3", en: "Sample Problem [Subject B] Q3" },
    description: {
      ja: "配列の要素番号は1から始まる。関数 makeNewArray は、要素数2以上の整数型の配列を引数にとり、整数型の配列を返す関数である。関数 makeNewArray を makeNewArray({3, 2, 1, 6, 5, 4})として呼び出したとき、戻り値の配列の要素番号5の値は[ ]となる。",
      en: "",
    },
    programLines: {
      ja: [
        ' 1: ○整数型の配列: makeNewArray(整数型の配列: in)', 
        ' 2: 　整数型の配列: out ← {}', 
        ' 3: 　整数型: i, tail',
        ' 4: 　outの末尾に in[1] の値 を追加する', 
        ' 5: 　for (i を 2 から inの要素数 まで 1 ずつ増やす)',
        ' 6: 　　tail ← out[outの要素数]', 
        ' 7: 　　outの末尾に (tail + in[i]) の結果を追加する',
        ' 8: 　endfor', 
        ' 9: 　return out',
      ],
      en: [],
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '5' }, { label: 'イ', value: '6' }, { label: 'ウ', value: '9' },
        { label: 'エ', value: '11' }, { label: 'オ', value: '12' }, { label: 'カ', value: '17' },
        { label: 'キ', value: '21' },
      ],
      en: [],
    },
    correctAnswer: '17',
    explanationText: { ja: `makeNewArray({3, 2, 1, 6, 5, 4})を呼び出したときの処理の流れをトレースしていきます...\n`, en: ``},
    initialVariables: { in: [3, 2, 1, 6, 5, 4], out: [], i: null, tail: null }, // この問題では入力配列が固定
    // traceLogic: ループ処理を持つため、各行の処理を定義します。
    // ループの制御は `calculateNextLine` が担当します。
    traceLogic: [
      (vars) => ({ ...vars, in: [3, 2, 1, 6, 5, 4] }), // 1行目: 引数inを設定
      (vars) => ({ ...vars, out: [] }),                 // 2行目: 出力用配列outを初期化
      (vars) => ({ ...vars, i: null, tail: null }),     // 3行目: ループ変数iとtailを初期化
      (vars) => { // 4行目: outにinの最初の要素を追加
        const newOut = [...(vars.out as number[])];
        newOut.push((vars.in as number[])[0]);
        return { ...vars, out: newOut };
      },
      (vars) => { // 5行目: forループの開始。iを2に設定
        const i = vars.i as number | null;
        // ループの初回のみiを2に設定。2回目以降はcalculateNextLineでインクリメントされる
        return i === null ? { ...vars, i: 2 } : vars;
      },
      (vars) => { // 6行目: outの最後の要素をtailに代入
        const out = vars.out as number[];
        return { ...vars, tail: out[out.length - 1] };
      },
      (vars) => { // 7行目: outに新しい値を計算して追加
        const newOut = [...(vars.out as number[])];
        const i = vars.i as number;
        const valueToAdd = (vars.tail as number) + (vars.in as number[])[i - 1];
        newOut.push(valueToAdd);
        return { ...vars, out: newOut };
      },
      (vars) => { // 8行目: endfor。iをインクリメント
        const i = vars.i as number;
        return { ...vars, i: i + 1 };
      },
      (vars) => vars, // 9行目
    ],
    // calculateNextLine: forループの制御ロジック
    calculateNextLine: (currentLine, vars) => {
      const i = vars.i as number;
      const inArray = vars.in as number[];

      switch (currentLine + 1) { // 0-indexedから1-indexedに変換
        case 5: // 5行目(for)の実行後
          return i <= inArray.length ? 5 : 8; // ループ継続なら6行目へ、終了なら9行目へ
        case 6: return 6; // 6行目実行後は7行目へ
        case 7: return 7; // 7行目実行後は8行目へ
        case 8: // 8行目(endfor)の実行後
          return i <= inArray.length ? 5 : 8; // ループ継続なら6行目へ、終了なら9行目へ
        default: return currentLine + 1; // それ以外は次の行へ
      }
    },
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