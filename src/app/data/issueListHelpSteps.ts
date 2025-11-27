import { HelpStep } from "../../types/help";

/**
 * 問題一覧ページのチュートリアルステップ
 * 問題一覧画面のヘルプデータを定義します。
 */
export const issueListHelpSteps: HelpStep[] = [
  {
    id: "question_categories",
    title: "出題項目",
    description: "現在のページが問題一覧画面です。「基本情報科目A」、「基本情報科目B」、「応用情報午前」、「プログラミング」、「4択問題」、「作成した問題」これらの問題があります。",
    imagePath: "/images/help/mondaiichiran.png",
    targetSelector: ".question-categories-section",
    order: 1,
    page: "issue_list"
  },
];
