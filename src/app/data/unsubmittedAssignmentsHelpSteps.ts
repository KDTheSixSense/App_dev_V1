import { HelpStep } from "../../types/help";

/**
 * 課題ページのチュートリアルステップ
 * 未提出課題画面のヘルプデータを定義します。
 */
export const unsubmittedAssignmentsHelpSteps: HelpStep[] = [
  // 課題ページ
  {
    id: "unsubmitted_assignments_overview",
    title: "未提出課題画面の概要",
    description: "このページでは、未提出の課題を確認できます。期限内に提出するようにしましょう。",
    imagePath: "/images/help/kadai.png",
    targetSelector: ".assignments-list",
    order: 1,
    page: "unsubmitted-assignments",
  },
  {
    id: "unsubmitted_assignments_overview",
    title: "未提出課題画面の概要",
    description: "このページでは、未提出の課題を確認できます。期限内に提出するようにしましょう。",
    imagePath: "/images/help/課題",
    targetSelector: ".assignments-list",
    order: 1,
    page: "unsubmitted-assignments",
  },
];
