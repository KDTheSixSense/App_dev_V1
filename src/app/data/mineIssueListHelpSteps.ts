import { HelpStep } from "../../types/help";

/**
 * 作成した問題一覧ページのチュートリアルステップ
 * 作成した問題一覧画面のヘルプデータを定義します。
 */
export const mineIssueListHelpSteps: HelpStep[] = [
  // 作成した問題一覧ページ
  {
    id: "mine_issue_list_overview",
    title: "作成した問題一覧",
    description: "このページでは、自分が作成した問題の一覧を確認できます。\n問題の内容を編集したり、問題を編集したり、問題を削除することができます。",
    imagePath: "/images/help/sakuseishita1.png",
    targetSelector: ".container",
    order: 1,
    page: "issue_list/mine_issue_list",
  },
  
];
