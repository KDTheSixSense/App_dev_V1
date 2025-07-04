// src/lib/issue_list/Csya_problem/problem.ts
import type { Problem } from '@/lib/types'; // '@/lib/types'のパスとProblem型が正しいことを確認

export const CsyaProblems: Problem[] = [ // 変数名をCsyaProblemsに修正
  {
    id: 'CS1', // IDをC#用に修正
    logicType: 'CODING_PROBLEM', // コーディング問題用のロジックタイプ（任意）
    title: { ja: "C#問題1: Hello World", en: "C# Problem 1: Hello World" }, // タイトルをC#用に修正
    description: {
      ja: "標準出力に 'Hello, C# World!' と出力するプログラムを作成してください。", // 説明をC#用に修正
      en: "Write a program that prints 'Hello, C# World!' to standard output."
    },
    programLines: {
      ja: [
        'using System;', // C#のインクルード
        '',
        'public class Program',
        '{',
        '    public static void Main(string[] args)',
        '    {',
        '        Console.WriteLine("Hello, C# World!");', // C#の出力
        '    }',
        '}'
      ],
      en: [
        'using System;',
        '',
        'public class Program',
        '{',
        '    public static void Main(string[] args)',
        '    {',
        '        Console.WriteLine("Hello, C# World!");',
        '    }',
        '}'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: 'Hello, C# World!' }, // 回答オプションをC#用に修正
        { label: 'イ', value: 'Hello World' },
        { label: 'ウ', value: 'C# World!' },
        { label: 'エ', value: 'Goodbye, C# World!' }
      ],
      en: [
        { label: 'A', value: 'Hello, C# World!' },
        { label: 'B', value: 'Hello World' },
        { label: 'C', value: 'C# World!' },
        { label: 'D', value: 'Goodbye, C# World!' }
      ]
    },
    correctAnswer: 'Hello, C# World!', // 正解をC#用に修正
    explanationText: {
      ja: "Console.WriteLine() メソッドを使用して指定された文字列を標準出力に出力します。", // 解説をC#用に修正
      en: "Use the Console.WriteLine() method to print the specified string to standard output."
    },
    initialVariables: {}, // コーディング問題では通常不要
    traceLogic: []       // トレース不要
  },
  {
    id: 'CS2', // IDをC#用に修正
    logicType: 'CODING_PROBLEM',
    title: { ja: "C#問題2: 2数の和", en: "C# Problem 2: Sum of Two Numbers" }, // タイトルをC#用に修正
    description: {
      ja: "2つの整数 a と b を受け取り、その和を標準出力に出力するプログラムを作成してください。", // 説明をC#用に修正
      en: "Write a program that takes two integers a and b and prints their sum to standard output."
    },
    programLines: {
      ja: [
        'using System;',
        '',
        'public class Program',
        '{',
        '    public static void Main(string[] args)',
        '    {',
        '        int a = 10;', // 例として初期値
        '        int b = 20;', // 例として初期値
        '        Console.WriteLine(a + b);', // C#の出力
        '    }',
        '}'
      ],
      en: [
        'using System;',
        '',
        'public class Program',
        '{',
        '    public static void Main(string[] args)',
        '    {',
        '        int a = 10;',
        '        int b = 20;',
        '        Console.WriteLine(a + b);',
        '    }',
        '}'
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '30' }, // 回答オプションをC#用に修正
        { label: 'イ', value: '10' },
        { label: 'ウ', value: '20' },
        { label: 'エ', value: '200' }
      ],
      en: [
        { label: 'A', value: '30' },
        { label: 'B', value: '10' },
        { label: 'C', value: '20' },
        { label: 'D', value: '200' }
      ]
    },
    correctAnswer: '30', // 正解をC#用に修正
    explanationText: {
      ja: "2つの整数変数を定義し、それらの値を足し算して結果を出力します。", // 解説をC#用に修正
      en: "Define two integer variables, sum their values, and print the result."
    },
    initialVariables: {},
    traceLogic: []
  },
  // 必要に応じてC#言語問題を追加
];

export const getCsyaProblemsById = (id: string): Problem | undefined => {
  return CsyaProblems.find(p => p.id === id); // getCProblemsById から getCsyaProblemsById に修正し、CsyaProblems を検索
};