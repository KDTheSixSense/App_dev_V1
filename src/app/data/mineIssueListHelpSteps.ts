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
    description: "このページでは、自分が作成した問題の一覧を確認できます。問題を編集したり、公開設定を変更できます。",
    imagePath: "/images/help/sakuseishita.png",
    targetSelector: ".container",
    order: 1,
    page: "issue_list/mine_issue_list",
  },
  {
    id: "mine_issue_list_overview",
    title: "編集と削除",
    description: "このページでは、自分が作成した問題を一覧で確認できます。問題の内容を編集したり、公開・非公開の設定を簡単に変更できます。はじめての方でも使いやすいように、分かりやすく整理されています。",
    imagePath: "/images/help/sakuseishita1.png",
    targetSelector: ".container",
    order: 1,
    page: "issue_list/mine_issue_list",
  },

  
];
