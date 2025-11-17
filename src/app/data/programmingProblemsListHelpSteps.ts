import { HelpStep } from "../../types/help";

/**
 * プログラミング問題一覧ページのチュートリアルステップ
 * プログラミング問題一覧画面のヘルプデータを定義します。
 */
export const programmingProblemsListHelpSteps: HelpStep[] = [
  // プログラミング問題一覧ページ
  {
    id: "programming_problems_list_overview",
    title: "プログラミング問題一覧",
    description: "このページでは、プログラミング問題の一覧を確認できます。問題を選択して挑戦してください。",
    imagePath: "/images/help/programming_problems_list_overview.png",
    targetSelector: ".container",
    order: 1,
    page: "issue_list/programming_problem/problems",
  },
  {
    id: "problem_list_programming",
    title: "問題リスト",
    description: "プログラミング問題が一覧表示されます。各問題のタイトルと難易度が表示されます。",
    imagePath: "/images/help/problem_list_programming.png",
    targetSelector: ".event-list",
    order: 2,
    page: "issue_list/programming_problem/problems",
  },
  {
    id: "select_problem_programming",
    title: "問題選択",
    description: "問題をクリックして詳細ページに移動します。コードを書いて解答してください。",
    imagePath: "/images/help/select_problem_programming.png",
    targetSelector: ".event-list",
    order: 3,
    page: "issue_list/programming_problem/problems",
  },
];
