// src/lib/issue_list/JavaScript_problem/problem.ts
import type { Problem } from '@/lib/types'; // '@/lib/types'のパスとProblem型が正しいことを確認

export const JavaScriptProblems: Problem[] = [
  {
    id: 'JS1',
    logicType: 'CODING_PROBLEM', // コーディング問題用のロジックタイプ（任意）
    title: { ja: "JavaScript問題1: Hello World", en: "JavaScript Problem 1: Hello World" },
    description: {
      ja: "標準出力（コンソール）に 'Hello, JavaScript World!' と出力するプログラムを作成してください。",
      en: "Write a program that prints 'Hello, JavaScript World!' to standard output (console)."
    },
    programLines: {
      ja: [
        'console.log("Hello, JavaScript World!");'
      ],
      en: [
        'console.log("Hello, JavaScript World!");'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: 'Hello, JavaScript World!' },
        { label: 'イ', value: 'Hello World' },
        { label: 'ウ', value: 'JavaScript World!' },
        { label: 'エ', value: 'Goodbye, JavaScript World!' }
      ],
      en: [
        { label: 'A', value: 'Hello, JavaScript World!' },
        { label: 'B', value: 'Hello World' },
        { label: 'C', value: 'JavaScript World!' },
        { label: 'D', value: 'Goodbye, JavaScript World!' }
      ]
    },
    correctAnswer: 'Hello, JavaScript World!',
    explanationText: {
      ja: "JavaScriptでは、`console.log()` を使用してコンソールに文字列を出力します。",
      en: "In JavaScript, use `console.log()` to print strings to the console."
    },
    initialVariables: {}, // コーディング問題では通常不要
    traceLogic: []       // トレース不要
  },
  {
    id: 'JS2',
    logicType: 'CODING_PROBLEM',
    title: { ja: "JavaScript問題2: 2数の和", en: "JavaScript Problem 2: Sum of Two Numbers" },
    description: {
      ja: "2つの整数 `a` と `b` を受け取り、その和をコンソールに出力するプログラムを作成してください。",
      en: "Write a program that takes two integers `a` and `b` and prints their sum to the console."
    },
    programLines: {
      ja: [
        'let a = 100;', // 例として初期値
        'let b = 200;', // 例として初期値
        'console.log(a + b);'
      ],
      en: [
        'let a = 100;',
        'let b = 200;',
        'console.log(a + b);'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '300' },
        { label: 'イ', value: '100' },
        { label: 'ウ', value: '200' },
        { label: 'エ', value: '20000' }
      ],
      en: [
        { label: 'A', value: '300' },
        { label: 'B', value: '100' },
        { label: 'C', value: '200' },
        { label: 'D', value: '20000' }
      ]
    },
    correctAnswer: '300',
    explanationText: {
      ja: "2つの数値変数を定義し、それらを足し算して結果を `console.log()` で出力します。",
      en: "Define two numeric variables, sum their values, and print the result using `console.log()`."
    },
    initialVariables: {},
    traceLogic: []
  },
  // 必要に応じてJavaScript言語問題を追加
];

export const getJavaScriptProblemsById = (id: string): Problem | undefined => {
  return JavaScriptProblems.find(p => p.id === id);
};
