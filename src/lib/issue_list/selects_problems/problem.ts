// /workspaces/my-next-app/src/lib/issue_list/selects_problems/problem.ts
import type { Problem } from '@/lib/types'; // 共通の型定義をインポート

export const pythonProblems: Problem[] = [
  {
    id: 'P1',
    logicType: 'TYPE_A', // 4択問題なのでTYPE_Aとします
    title: {
      ja: "第1問: print関数の出力",
      en: "Question 1: print() function output"
    },
    description: {
      ja: "次のPythonコードを実行したときの出力として正しいものはどれか。",
      en: "Which of the following is the correct output when the following Python code is executed?"
    },
    programLines: {
      ja: [
        "x = 10",
        "y = 20",
        "print(f'合計: {x + y}')"
      ],
      en: [
        "x = 10",
        "y = 20",
        "print(f'Sum: {x + y}')"
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '合計: x + y' },
        { label: 'イ', value: '合計: 30' },
        { label: 'ウ', value: 'f"合計: {x + y}"' },
        { label: 'エ', value: 'エラーが発生する' }
      ],
      en: [
        { label: 'A', value: 'Sum: x + y' },
        { label: 'B', value: 'Sum: 30' },
        { label: 'C', value: 'f"Sum: {x + y}"' },
        { label: 'D', value: 'An error occurs' }
      ]
    },
    correctAnswer: '合計: 30',
    explanationText: {
      ja: "f文字列（フォーマット済み文字列リテラル）は、波括弧 {} の中に変数や式を埋め込むことができます。このコードでは `{x + y}` の部分が `10 + 20` の結果である `30` に置き換えられて出力されます。したがって、正解は「合計: 30」です。",
      en: "An f-string (formatted string literal) allows you to embed expressions inside string literals, using curly braces {}. In this code, the part `{x + y}` is replaced by the result of `10 + 20`, which is `30`. Therefore, the correct answer is 'Sum: 30'."
    },
    initialVariables: {},
    traceLogic: []
  },
  {
    id: 'P2',
    logicType: 'TYPE_A',
    title: {
      ja: '第2問: リストのスライス',
      en: 'Question 2: List Slicing'
    },
    description: {
      ja: '次のPythonコードを実行したときの出力として正しいものはどれか。',
      en: 'Which of the following is the correct output when the following Python code is executed?'
    },
    programLines: {
      ja: [
        "my_list = [10, 20, 30, 40, 50]",
        "print(my_list[1:3])"
      ],
      en: [
        "my_list = [10, 20, 30, 40, 50]",
        "print(my_list[1:3])"
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '[10, 20]' },
        { label: 'イ', value: '[20, 30]' },
        { label: 'ウ', value: '[20, 30, 40]' },
        { label: 'エ', value: '[10, 20, 30]' }
      ],
      en: [
        { label: 'A', value: '[10, 20]' },
        { label: 'B', value: '[20, 30]' },
        { label: 'C', value: '[20, 30, 40]' },
        { label: 'D', value: '[10, 20, 30]' }
      ]
    },
    correctAnswer: '[20, 30]',
    explanationText: {
      ja: "リストのスライス `my_list[start:end]` は、`start` 番目のインデックスから `end-1` 番目のインデックスまでの要素を抽出します。インデックスは0から始まるため、`my_list[1:3]` はインデックス1（値は20）とインデックス2（値は30）の要素を抽出します。したがって、正解は `[20, 30]` です。",
      en: "List slicing `my_list[start:end]` extracts elements from the `start` index up to, but not including, the `end` index. Since indexing starts at 0, `my_list[1:3]` extracts the elements at index 1 (value 20) and index 2 (value 30). Therefore, the correct answer is `[20, 30]`."
    },
    initialVariables: {},
    traceLogic: []
  },
  // 必要に応じて他のPython問題を追加
];

/**
 * IDに基づいてPython問題を取得する
 * @param id 問題ID (例: 'P1')
 * @returns Problemオブジェクト、見つからない場合はundefined
 */
export const getPythonProblemById = (id: string): Problem | undefined => {
  return pythonProblems.find(p => p.id === id);
};

/**
 * 現在の問題IDを受け取り、次の問題のIDを返す
 * @param currentId 現在の問題ID (例: 'P1')
 * @returns 次の問題ID (例: 'P2')、最後の問題の場合はnull
 */
export const getNextPythonProblemId = (currentId: string): string | null => {
  const currentIndex = pythonProblems.findIndex(p => p.id === currentId);

  if (currentIndex === -1 || currentIndex >= pythonProblems.length - 1) {
    return null; // 次の問題はない
  }

  return pythonProblems[currentIndex + 1].id;
};