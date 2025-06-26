// src/lib/issue_list/Cplus_problem/problem.ts
import type { Problem } from '@/lib/types'; // '@/lib/types'のパスとProblem型が正しいことを確認

export const CplusProblems: Problem[] = [
  {
    id: 'CPP1', // IDをC++用に変更
    logicType: 'CODING_PROBLEM', // コーディング問題用のロジックタイプ（任意）
    title: { ja: "C++問題1: Hello World", en: "C++ Problem 1: Hello World" }, // タイトルをC++用に変更
    description: {
      ja: "標準出力に 'Hello, C++ World!' と出力するプログラムを作成してください。", // 説明をC++用に変更
      en: "Write a program that prints 'Hello, C++ World!' to standard output."
    },
    programLines: {
      ja: [
        '#include <iostream>', // C++のインクルード
        '',
        'int main() {',
        '    std::cout << "Hello, C++ World!" << std::endl;', // C++の出力
        '    return 0;',
        '}'
      ],
      en: [
        '#include <iostream>',
        '',
        'int main() {',
        '    std::cout << "Hello, C++ World!" << std::endl;',
        '    return 0;',
        '}'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: 'Hello, C++ World!' }, // 回答オプションをC++用に変更
        { label: 'イ', value: 'Hello World' },
        { label: 'ウ', value: 'C++ World!' },
        { label: 'エ', value: 'Goodbye, C++ World!' }
      ],
      en: [
        { label: 'A', value: 'Hello, C++ World!' },
        { label: 'B', value: 'Hello World' },
        { label: 'C', value: 'C++ World!' },
        { label: 'D', value: 'Goodbye, C++ World!' }
      ]
    },
    correctAnswer: 'Hello, C++ World!', // 正解をC++用に変更
    explanationText: {
      ja: "C++では、`std::cout` を使用して標準出力に文字列を出力します。", // 解説をC++用に変更
      en: "In C++, use `std::cout` to print strings to standard output."
    },
    initialVariables: {}, // コーディング問題では通常不要
    traceLogic: []       // トレース不要
  },
  {
    id: 'CPP2', // IDをC++用に変更
    logicType: 'CODING_PROBLEM',
    title: { ja: "C++問題2: 2数の和", en: "C++ Problem 2: Sum of Two Numbers" }, // タイトルをC++用に変更
    description: {
      ja: "2つの整数 a と b を受け取り、その和を標準出力に出力するプログラムを作成してください。", // 説明をC++用に変更
      en: "Write a program that takes two integers a and b and prints their sum to standard output."
    },
    programLines: {
      ja: [
        '#include <iostream>',
        '',
        'int main() {',
        '    int a = 20;', // 例として初期値
        '    int b = 30;', // 例として初期値
        '    std::cout << a + b << std::endl;', // C++の出力
        '    return 0;',
        '}'
      ],
      en: [
        '#include <iostream>',
        '',
        'int main() {',
        '    int a = 20;',
        '    int b = 30;',
        '    std::cout << a + b << std::endl;',
        '    return 0;',
        '}'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '50' }, // 回答オプションをC++用に変更
        { label: 'イ', value: '20' },
        { label: 'ウ', value: '30' },
        { label: 'エ', value: '600' }
      ],
      en: [
        { label: 'A', value: '50' },
        { label: 'B', value: '20' },
        { label: 'C', value: '30' },
        { label: 'D', value: '600' }
      ]
    },
    correctAnswer: '50', // 正解をC++用に変更
    explanationText: {
      ja: "2つの整数変数を定義し、それらの値を足し算して結果を `std::cout` で出力します。", // 解説をC++用に変更
      en: "Define two integer variables, sum their values, and print the result using `std::cout`."
    },
    initialVariables: {},
    traceLogic: []
  },
  // 必要に応じてC++言語問題を追加
];

export const getCplusProblemsById = (id: string): Problem | undefined => {
  // getCsyaProblemsById から getCplusProblemsById に修正し、CplusProblems を検索
  return CplusProblems.find(p => p.id === id);
};
