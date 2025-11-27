import { HelpStep } from "../../types/help";

/**
 * イベント作成ページのチュートリアルステップ
 * /event/admin/create_event ページ専用のヘルプデータを定義します。
 */
export const createEventHelpSteps: HelpStep[] = [
  {
    id: "basic_settings_tab",
    title: "基本設定タブ",
    description: "イベントのタイトル、説明、開始日時、終了日時、公開日時を入力してください。すべての必須項目を埋めてください。",
    imagePath: "/images/help/event2.png",
    targetSelector: ".tabButton",
    order: 2,
    page: "create_event",
  },
  {
    id: "draft_management",
    title: "下書きの管理",
    description: "下書きを保存して後で編集できます。下書きを選択して読み込むことも可能です。",
    imagePath: "/images/help/event5.png",
    targetSelector: ".draftLoaderSection",
    order: 3,
    page: "create_event",
  },
  {
    id: "problems_selection_tab",
    title: "プログラミング問題タブ",
    description: "イベントで使用するプログラミング問題を1つ以上選択してください。チェックボックスで問題を選んでください。",
    imagePath: "/images/help/event4.png",
    targetSelector: ".tabButton",
    order: 4,
    page: "create_event",
  },
];
