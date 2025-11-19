import { HelpStep } from "../../types/help";

/**
 * グループ選択問題ページのチュートリアルステップ
 * 選択問題の詳細ページのヘルプデータを定義します。
 */
export const groupSelectPageHelpSteps: HelpStep[] = [
  {
    id: "select_page_problem_description",
    title: "問題文の確認",
    description: "問題文を読み、どのような問題かを把握しましょう。プログラムの動作を理解することが重要です。",
    imagePath: "/images/help/groupselect.png",
    targetSelector: ".text-base.text-gray-800.leading-relaxed",
    order: 2,
    page: "group/select-page",
  },
  {
    id: "select_page_program_code",
    title: "プログラムコードの確認",
    description: "表示されているプログラムコードを見て、変数の動きやロジックを追ってみましょう。",
    imagePath: "/images/help/groupselect.png",
    targetSelector: "pre.bg-gray-50",
    order: 3,
    page: "group/select-page",
  },
  {
    id: "select_page_answer_options",
    title: "解答の選択",
    description: "解答群から正しいと思うものを選択してください。選択肢をクリックして答えを選びましょう。",
    imagePath: "/images/help/groupselect2.png",
    targetSelector: ".grid.grid-cols-2.gap-4",
    order: 4,
    page: "group/select-page",
  },
  {
    id: "select_page_explanation",
    title: "解説の確認",
    description: "解答を選択すると解説が表示されます。正解かどうか確認し、理解を深めましょう。",
    imagePath: "/images/help/groupselect1.png",
    targetSelector: ".bg-gray-50.p-6.rounded-lg.mt-8",
    order: 5,
    page: "group/select-page",
  },
];
