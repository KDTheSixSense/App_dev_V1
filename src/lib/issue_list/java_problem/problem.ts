// src/lib/issue_list/java_problem/problem.ts
import type { Problem } from '@/lib/types'; // '@/lib/types'のパスとProblem型が正しいことを確認

export const JavaProblems: Problem[] = [
  {
    id: 'J1',
    logicType: 'CODING_PROBLEM', // コーディング問題用のロジックタイプ（任意）
    title: { ja: "Java問題1: Hello World", en: "Java Problem 1: Hello World" },
    description: {
      ja: "標準出力に 'Hello, Java World!' と出力するプログラムを作成してください。",
      en: "Write a program that prints 'Hello, Java World!' to standard output."
    },
    programLines: {
      ja: [
        'public class Main {',
        '    public static void main(String[] args) {',
        '        System.out.println("Hello, Java World!");',
        '    }',
        '}'
      ],
      en: [
        'public class Main {',
        '    public static void main(String[] args) {',
        '        System.out.println("Hello, Java World!");',
        '    }',
        '}'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: 'Hello, Java World!' },
        { label: 'イ', value: 'Hello World' },
        { label: 'ウ', value: 'Java World!' },
        { label: 'エ', value: 'Goodbye, Java World!' }
      ],
      en: [
        { label: 'A', value: 'Hello, Java World!' },
        { label: 'B', value: 'Hello World' },
        { label: 'C', value: 'Java World!' },
        { label: 'D', value: 'Goodbye, Java World!' }
      ]
    },
    correctAnswer: 'Hello, Java World!',
    explanationText: {
      ja: "System.out.println() メソッドを使用して指定された文字列を標準出力に出力します。",
      en: "Use the System.out.println() method to print the specified string to standard output."
    },
    initialVariables: {}, // コーディング問題では通常不要
    traceLogic: []       // トレース不要
  },
  {
    id: 'J2',
    logicType: 'CODING_PROBLEM',
    title: { ja: "Java問題2: 2数の和", en: "Java Problem 2: Sum of Two Numbers" },
    description: {
      ja: "2つの整数 a と b を受け取り、その和を標準出力に出力するプログラムを作成してください。",
      en: "Write a program that takes two integers a and b and prints their sum to standard output."
    },
    programLines: {
      ja: [
        'public class Main {',
        '    public static void main(String[] args) {',
        '        int a = 15;', // 例として初期値
        '        int b = 25;', // 例として初期値
        '        System.out.println(a + b);',
        '    }',
        '}'
      ],
      en: [
        'public class Main {',
        '    public static void main(String[] args) {',
        '        int a = 15;',
        '        int b = 25;',
        '        System.out.println(a + b);',
        '    }',
        '}'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '40' },
        { label: 'イ', value: '15' },
        { label: 'ウ', value: '25' },
        { label: 'エ', value: '375' }
      ],
      en: [
        { label: 'A', value: '40' },
        { label: 'B', value: '15' },
        { label: 'C', value: '25' },
        { label: 'D', value: '375' }
      ]
    },
    correctAnswer: '40',
    explanationText: {
      ja: "2つの整数変数を定義し、それらの値を足し算して結果を出力します。",
      en: "Define two integer variables, sum their values, and print the result."
    },
    initialVariables: {},
    traceLogic: []
  },
  // 必要に応じてJava言語問題を追加
];

export const getJavaProblemsById = (id: string): Problem | undefined => {
  return JavaProblems.find(p => p.id === id);
};
