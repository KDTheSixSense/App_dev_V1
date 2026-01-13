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
    description: "このページでは、イベントの作成と参加ができ、画面下部で参加可能なイベントを確認できます。\nイベントに参加し能力を競い合いましょう。",
    imagePath: "/images/help/event3.png",
    targetSelector: ".event-list",
    order: 1,
    page: "event",
  },
  
  // 作成者: イベント作成
  {
    id: "event_create",
    title: "イベントを作成する",
    description: "新しいイベントを作成して、他のユーザーを招待しましょう。\nこの画面ではイベントの開始、終了の操作ができます",
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
    description: "イベントのスタートする前の待機状態画面です。管理者がスタートをするのをお待ちください。\n開始するとイベントで使用する問題一覧が全て表示されます。\n問題に遷移するとタイマーが起動します。なるべく早く解いて高得点を目指しましょう!",
    imagePath: "/images/help/eventuser.png",
    targetSelector: ".event-list",
    order: 1,
    page: "event",
    role: "participant",
  },
];
