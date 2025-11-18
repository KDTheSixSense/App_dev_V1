import { HelpStep } from "../../types/help";

/**
 * イベントページのチュートリアルステップ
 * イベント画面のヘルプデータを定義します。
 * 参加者向けと作成者向けのステップを分けて定義します。
 */
export const eventHelpSteps: HelpStep[] = [
  // event 作成者＋参加者見れるページ
  {
    id: "event_overview_participant",
    title: "イベント画面の概要",
    description: "このページでは、参加可能なイベントを確認できます。イベントに参加して特別な報酬を手に入れましょう。",
    imagePath: "/images/help/event3.png",
    targetSelector: ".event-list",
    order: 1,
    page: "event",
  },
  
  // 作成者: イベント作成
  {
    id: "event_create",
    title: "イベントを作成する",
    description: "新しいイベントを作成して、他のユーザーを招待しましょう。イベントの詳細を設定し、参加者を集めることができます。",
    imagePath: "/images/help/eventadmin.png",
    targetSelector: ".create_event",
    order: 1,
    page: "event",
    role: "creator",
  },
  // 参加者: イベント詳細
  {
    id: "event_detail",
    title: "イベント詳細の確認",
    description: "イベントの詳細情報を確認し、参加条件や報酬について理解しましょう。",
    imagePath: "/images/help/eventuser.png",
    targetSelector: ".event-list",
    order: 1,
    page: "event",
    role: "participant",
  },
];
