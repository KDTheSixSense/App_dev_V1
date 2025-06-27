// src/lib/issue_list/python_problem/problem.ts
import type { Problem } from '@/lib/types'; // '@/lib/types'のパスとProblem型が正しいことを確認

export const PythonProblems: Problem[] = [
  {
    id: 'PY1',
    logicType: 'CODING_PROBLEM', // コーディング問題用のロジックタイプ（任意）
    title: { ja: "Python問題1: Hello World", en: "Python Problem 1: Hello World" },
    description: {
      ja: "標準出力に 'Hello, Python World!' と出力するプログラムを作成してください。",
      en: "Write a program that prints 'Hello, Python World!' to standard output."
    },
    programLines: {
      ja: [
        'print("Hello, Python World!")'
      ],
      en: [
        'print("Hello, Python World!")'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: 'Hello, Python World!' },
        { label: 'イ', value: 'Hello World' },
        { label: 'ウ', value: 'Python World!' },
        { label: 'エ', value: 'Goodbye, Python World!' }
      ],
      en: [
        { label: 'A', value: 'Hello, Python World!' },
        { label: 'B', value: 'Hello World' },
        { label: 'C', value: 'Python World!' },
        { label: 'D', value: 'Goodbye, Python World!' }
      ]
    },
    correctAnswer: 'Hello, Python World!',
    explanationText: {
      ja: "Pythonでは、`print()` 関数を使用して標準出力に文字列を出力します。",
      en: "In Python, use the `print()` function to output strings to standard output."
    },
    initialVariables: {}, // コーディング問題では通常不要
    traceLogic: []       // トレース不要
  },
  {
    id: 'PY2',
    logicType: 'CODING_PROBLEM',
    title: { ja: "Python問題2: 2数の和", en: "Python Problem 2: Sum of Two Numbers" },
    description: {
      ja: "2つの整数 `a` と `b` を受け取り、その和を標準出力に出力するプログラムを作成してください。",
      en: "Write a program that takes two integers `a` and `b` and prints their sum to standard output."
    },
    programLines: {
      ja: [
        'a = 7',  // 例として初期値
        'b = 13', // 例として初期値
        'print(a + b)'
      ],
      en: [
        'a = 7',
        'b = 13',
        'print(a + b)'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '20' },
        { label: 'イ', value: '7' },
        { label: 'ウ', value: '13' },
        { label: 'エ', value: '91' }
      ],
      en: [
        { label: 'A', value: '20' },
        { label: 'B', value: '7' },
        { label: 'C', value: '13' },
        { label: 'D', value: '91' }
      ]
    },
    correctAnswer: '20',
    explanationText: {
      ja: "2つの整数変数を定義し、それらの値を足し算して結果を `print()` 関数で出力します。",
      en: "Define two integer variables, sum their values, and print the result using the `print()` function."
    },
    initialVariables: {},
    traceLogic: []
  },
  // 必要に応じてPython言語問題を追加
];

export const getPythonProblemsById = (id: string): Problem | undefined => {
  return PythonProblems.find(p => p.id === id);
};
