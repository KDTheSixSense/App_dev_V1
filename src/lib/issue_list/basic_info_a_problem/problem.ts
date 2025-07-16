// src/lib/issue_list/basic_info_a_problem/problem.ts
import type { Problem } from '@/lib/types';

export const basicInfoAProblems: Problem[] = [
  {
    id: 'A1',
    logicType: 'TYPE_A', // 科目A用のロジックタイプ
    title: { ja: "科目A 問題1: 変数", en: "Subject A Problem 1: Variables" },
    description: { ja: "変数の基本的な使い方を理解しましょう。", en: "Understand basic variable usage." },
    programLines: {
      ja: [
        "1: A = 100",
        "2: B = 200",
        "3: C = A + B",
        "4: print(C)"
      ],
      en: [
        "1: A = 100",
        "2: B = 200",
        "3: C = A + B",
        "4: print(C)"
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '100' },
        { label: 'イ', value: '200' },
        { label: 'ウ', value: '300' },
        { label: 'エ', value: 'エラー' }
      ],
      en: [
        { label: 'A', value: '100' },
        { label: 'B', value: '200' },
        { label: 'C', value: '300' },
        { label: 'D', value: 'Error' }
      ]
    },
    correctAnswer: '300',
    explanationText: {
      ja: "プログラムはAとBの値を加算し、Cに代入します。100 + 200 = 300。",
      en: "The program adds the values of A and B, assigning the result to C. 100 + 200 = 300."
    },
    initialVariables: {}, // トレースがないので空でOK
    traceLogic: []       // トレースがないので空でOK
  },
  {
    id: 'A2',
    logicType: 'TYPE_A',
    title: { ja: "科目A 問題2: 条件分岐", en: "Subject A Problem 2: Conditional Logic" },
    description: { ja: "条件分岐がどのように機能するかを理解しましょう。", en: "Understand how conditional logic works." },
    programLines: {
      ja: [
        "1: score = 75",
        "2: if score >= 80 then",
        "3:   print(\"合格\")",
        "4: else",
        "5:   print(\"不合格\")",
        "6: end if"
      ],
      en: [
        "1: score = 75",
        "2: if score >= 80 then",
        "3:   print(\"Pass\")",
        "4: else",
        "5:   print(\"Fail\")",
        "6: end if"
      ]
    },
    answerOptions: {
      ja: [
        { label: 'ア', value: '合格' },
        { label: 'イ', value: '不合格' },
        { label: 'ウ', value: 'エラー' },
        { label: 'エ', value: '80' }
      ],
      en: [
        { label: 'A', value: 'Pass' },
        { label: 'B', value: 'Fail' },
        { label: 'C', value: 'Error' },
        { label: 'D', value: '80' }
      ]
    },
    correctAnswer: '不合格',
    explanationText: {
      ja: "scoreが80以上ではないため、「不合格」が出力されます。",
      en: "Since the score is not 80 or above, \"Fail\" is printed."
    },
    initialVariables: {},
    traceLogic: []
  },
  // 必要に応じて科目Aの問題を追加
];

export const getProblemAById = (id: string): Problem | undefined => {
  return basicInfoAProblems.find(p => p.id === id);
};

// ▼▼▼【ここから追加】▼▼▼
/**
 * 現在のA問題IDを受け取り、次の問題のIDを返すクライアントサイド関数
 * @param currentId 現在の問題ID (例: 'A1')
 * @returns 次の問題ID (例: 'A2')、最後の問題の場合は null
 */
export const getNextAProblemId = (currentId: string): string | null => {
  // basicInfoAProblems 配列から現在の問題のインデックスを探す
  const currentIndex = basicInfoAProblems.findIndex(p => p.id === currentId);

  // インデックスが見つからないか、または最後の問題だった場合
  if (currentIndex === -1 || currentIndex >= basicInfoAProblems.length - 1) {
    return null; // 次の問題はない
  }

  // 次の問題のIDを返す
  return basicInfoAProblems[currentIndex + 1].id;
};
// ▲▲▲【ここまで追加】▲▲▲