import { HelpStep } from "../../types/help";

/**
 * 問題一覧ページのチュートリアルステップ
 * 問題一覧画面のヘルプデータを定義します。
 */
export const issueListHelpSteps: HelpStep[] = [
  {
    id: "question_categories",
    title: "出題項目",
    description: "ユーザーが挑戦したい問題のカテゴリを選択するセクションです。「基本情報科目A」、「基本情報科目B」、「応用情報午前」、「プログラミング」、「4択問題」、「作成した問題」などの選択肢があります。",
    imagePath: "/images/help/mondaiichiran.png",
    targetSelector: ".question-categories-section",
    order: 1,
    page: "issue_list"
  },
];
