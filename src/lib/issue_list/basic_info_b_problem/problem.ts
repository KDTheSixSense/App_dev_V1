// src/lib/issue_list/basic_info_b_problem/problem.ts
import type { Problem, AnswerOption, VariablesState, TraceStep } from '@/lib/types'; // '@/lib/types'のパスとProblem型が正しいことを確認

export const basicInfoBProblems: Problem[] = [
  // =================================================================================
  // --- 問1: 変数の値交換 ---
  // =================================================================================
  {
    id: '1',
    logicType: 'VARIABLE_SWAP',
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
      en: [
        '1 Integer: x ← 1',
        '2 Integer: y ← 2',
        '3 Integer: z ← 3',
        '4 x ← y',
        '5 y ← z',
        '6 z ← x',
        '7 Output values of y and z separated by a comma in this order',
      ],
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '1,2' }, { label: 'イ', value: '1,3' }, { label: 'ウ', value: '2,1' },
        { label: 'エ', value: '2,3' }, { label: 'オ', value: '3,1' }, { label: 'カ', value: '3,2' },
      ],
      en: [
        { label: 'A', value: '1,2' }, { label: 'B', value: '1,3' }, { label: 'C', value: '2,1' },
        { label: 'D', value: '2,3' }, { label: 'E', value: '3,1' }, { label: 'F', value: '3,2' },
      ],
    },
    correctAnswer: '3,2',
    explanationText: {
      ja: `xは1、yは2、zは3で初期化されています。まずxにyの値である2が代入され、x=2, y=2, z=3となります。次にyにzの値である3が代入され、x=2, y=3, z=3となります。最後にzにxの値である2が代入され、x=2, y=3, z=2となります。したがって、yとzの値は「3,2」です。`,
      en: `x is initialized to 1, y to 2, and z to 3. First, x is assigned the value of y, which is 2, resulting in x=2, y=2, z=3. Next, y is assigned the value of z, which is 3, resulting in x=2, y=3, z=3. Finally, z is assigned the value of x, which is 2, resulting in x=2, y=3, z=2. Therefore, the values of y and z are "3,2".`
    },
    initialVariables: { x: null, y: null, z: null },
    // トレース機能が不要なため、traceLogicは空または最小限でOK
    traceLogic: [],
    // calculateNextLineもトレース機能が不要なため不要
  },

  // =================================================================================
  // --- 問2: FizzBuzz (条件分岐) ---
  // トレース機能がないので、プログラムと解説で理解を促す
  // =================================================================================
  {
    id: '2',
    logicType: 'FIZZ_BUZZ',
    title: { ja: "サンプル問題 [科目B] 問2: FizzBuzz", en: "Sample Problem [Subject B] Q2: FizzBuzz" },
    description: {
      ja: "次のプログラム中の a ~ c に入れる正しい答えの組み合わせを、解答群の中から選べ。関数 fizzBuzz は、引数で与えられた値が、3で割り切れて5で割り切れない場合は\"3で割り切れる\"を、5で割り切れて3で割り切れない場合は\"5で割り切れる\"を、3と5で割り切れる場合は\"3と5で割り切れる\"を返します。それ以外の場合は\"3でも5でも割り切れない\"を返します。",
      en: "Choose the correct combination for a ~ c in the following program. The function fizzBuzz returns 'Divisible by 3' if the given value is divisible by 3 but not by 5, 'Divisible by 5' if divisible by 5 but not by 3, and 'Divisible by 3 and 5' if divisible by both 3 and 5. Otherwise, it returns 'Not divisible by 3 or 5'."
    },
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
      en: [
        ' 1: ○String: fizzBuzz(Integer: num)',
        ' 2: 　String: result',
        ' 3: 　if (num is divisible by 3 and 5)',
        ' 4: 　　result ← "Divisible by 3 and 5"',
        ' 5: 　elseif (num is divisible by 3)',
        ' 6: 　　result ← "Divisible by 3"',
        ' 7: 　elseif (num is divisible by 5)',
        ' 8: 　　result ← "Divisible by 5"',
        ' 9: 　else',
        '10: 　　result ← "Not divisible by 3 or 5"',
        '11: 　endif',
        '12: 　return result',
      ],
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: 'a:3, b:3と5, c:5' }, { label: 'イ', value: 'a:3, b:5, c:3と5' },
        { label: 'ウ', value: 'a:3と5, b:3, c:5' }, { label: 'エ', value: 'a:5, b:3, c:3と5' },
        { label: 'オ', value: 'a:5, b:3と5, c:3' },
      ],
      en: [
        { label: 'A', value: 'a:3, b:3and5, c:5' }, { label: 'B', value: 'a:3, b:5, c:3and5' },
        { label: 'C', value: 'a:3and5, b:3, c:5' }, { label: 'D', value: 'a:5, b:3, c:3and5' },
        { label: 'E', value: 'a:5, b:3and5, c:3' },
      ],
    },
    correctAnswer: 'a:3と5, b:3, c:5',
    explanationText: {
      ja: `if-elseif-else構文では、条件は上から順に評価され、最初に真(true)になったブロックだけが実行されます。3と5の両方で割り切れる数（例: 15）は3でも5でも割り切れるため、最も限定的な「3と5で割り切れる」という条件を最初に評価する必要があります。`,
      en: `In an if-elseif-else construct, conditions are evaluated from top to bottom, and only the first block that evaluates to true is executed. Numbers divisible by both 3 and 5 (e.g., 15) are also divisible by 3 and 5 individually, so the most specific condition "Divisible by 3 and 5" must be evaluated first.`
    },
    initialVariables: { num: null, result: null },
    traceOptions: { presets: [3, 5, 15, 7] }, // この問題ではユーザーがトレース開始時の`num`の値を選べる
    traceLogic: [], // トレース機能が不要なため空
    calculateNextLine: undefined, // トレース機能が不要なため undefined
  },

  // =================================================================================
  // --- 問3: 配列の集計 (ループ) ---
  // トレース機能がないので、プログラムと解説で理解を促す
  // =================================================================================
  {
    id: '3',
    logicType: 'ARRAY_SUM',
    title: { ja: "サンプル問題 [科目B] 問3: 配列の集計", en: "Sample Problem [Subject B] Q3: Array Aggregation" },
    description: {
      ja: "配列の要素番号は1から始まる。関数 makeNewArray は、要素数2以上の整数型の配列を引数にとり、整数型の配列を返す関数である。関数 makeNewArray を makeNewArray({3, 2, 1, 6, 5, 4})として呼び出したとき、戻り値の配列の要素番号5の値は[ ]となる。",
      en: "Array element numbers start from 1. The function makeNewArray takes an integer array with 2 or more elements as an argument and returns an integer array. When makeNewArray is called as makeNewArray({3, 2, 1, 6, 5, 4}), the value of element number 5 of the returned array will be [ ]."
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
      en: [
        ' 1: ○Integer Array: makeNewArray(Integer Array: in)',
        ' 2: 　Integer Array: out ← {}',
        ' 3: 　Integer: i, tail',
        ' 4: 　Add in[1] to the end of out',
        ' 5: 　for (i from 2 to number of elements in in, increment by 1)',
        ' 6: 　　tail ← out[number of elements in out]',
        ' 7: 　　Add (tail + in[i]) to the end of out',
        ' 8: 　endfor',
        ' 9: 　return out',
      ],
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '5' }, { label: 'イ', value: '6' }, { label: 'ウ', value: '9' },
        { label: 'エ', value: '11' }, { label: 'オ', value: '12' }, { label: 'カ', value: '17' },
        { label: 'キ', value: '21' },
      ],
      en: [
        { label: 'A', value: '5' }, { label: 'B', value: '6' }, { label: 'C', value: '9' },
        { label: 'D', value: '11' }, { label: 'E', value: '12' }, { label: 'F', value: '17' },
        { label: 'G', value: '21' },
      ],
    },
    correctAnswer: '17',
    explanationText: {
      ja: `makeNewArray({3, 2, 1, 6, 5, 4})を呼び出したときの処理の流れを追っていきます。\n` +
          `初期値: in={3, 2, 1, 6, 5, 4}, out={}, i=null, tail=null\n` +
          `行4: outの末尾に in[1](2) を追加 → out={2}\n` +
          `行5 (i=2): ループ開始。tail ← out[1](2)。outの末尾に (2 + in[2](1)) を追加 → out={2, 3}\n` +
          `行5 (i=3): tail ← out[2](3)。outの末尾に (3 + in[3](6)) を追加 → out={2, 3, 9}\n` +
          `行5 (i=4): tail ← out[3](9)。outの末尾に (9 + in[4](5)) を追加 → out={2, 3, 9, 14}\n` +
          `行5 (i=5): tail ← out[4](14)。outの末尾に (14 + in[5](4)) を追加 → out={2, 3, 9, 14, 18}\n` +
          `行5 (i=6): ループ終了 (inの要素数は6なので、iは6まで進む)。\n` +
          `最終的なoutの要素番号5はout[4] (0始まり)なので、値は18です。`, // FIXME: 説明を修正。問題文が要素番号1始まりなのでそれに合わせる
      en: `Let's trace the execution flow when calling makeNewArray({3, 2, 1, 6, 5, 4}).\n` +
          `Initial: in={3, 2, 1, 6, 5, 4}, out={}, i=null, tail=null\n` +
          `Line 4: Add in[1] (2) to the end of out → out={2}\n` +
          `Line 5 (i=2): Loop starts. tail ← out[length](2). Add (2 + in[2] (1)) to end of out → out={2, 3}\n` +
          `Line 5 (i=3): tail ← out[length](3). Add (3 + in[3] (6)) to end of out → out={2, 3, 9}\n` +
          `Line 5 (i=4): tail ← out[length](9). Add (9 + in[4] (5)) to end of out → out={2, 3, 9, 14}\n` +
          `Line 5 (i=5): tail ← out[length](14). Add (14 + in[5] (4)) to end of out → out={2, 3, 9, 14, 18}\n` +
          `Line 5 (i=6): Loop ends (number of elements in 'in' is 6, so i goes up to 6).\n` +
          `The final element at index 5 (1-based) is 18.`, // FIXME: Update explanation. Problem statement is 1-based indexing.
    },
    initialVariables: { in: null, out: null, i: null, tail: null },
    traceLogic: [], // トレース機能が不要なため空
    calculateNextLine: undefined, // トレース機能が不要なため undefined
  },
  // 必要に応じて問題を追加
];

export const getBasicInfoBProblemsById = (id: string): Problem | undefined => {
  return basicInfoBProblems.find(p => p.id === id);
};

export const getAllProblemIds = () => {
  return basicInfoBProblems.map(p => ({ problemId: p.id }));
};
