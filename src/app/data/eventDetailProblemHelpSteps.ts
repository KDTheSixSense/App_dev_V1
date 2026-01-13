import { HelpStep } from "../../types/help";

/**
 * イベント詳細問題ページのチュートリアルステップ
 * イベント内の問題ページのヘルプデータを定義します。
 * 参加者向けと作成者向けのステップを分けて定義します。
 */
export const eventDetailProblemHelpSteps: HelpStep[] = [
  // 参加者: 問題の概要
  {
    id: "event_problem_overview",
    title: "問題の概要",
    description: "イベント内の特定のプログラミング問題を確認できます。\n問題文を読み、コードを書いて解答しましょう。\n問題文の下にサンプルケースが表示されています。",
    imagePath: "/images/help/eventdetail1.png",
    targetSelector: ".problem-statement",
    order: 1,
    page: "event_detail_problem",
    role: "participant",
  },
  // 参加者: 解答の提出
  {
    id: "event_problem_submit",
    title: "解答の提出",
    description: "画面右上から言語とエディターのテンプレートを変更することができます。\n画面下部の実行ボタンを押すとデバッグモードでコードを実行できます。\nコードの作成が完了したら実行ボタンの隣にある提出ボタンをクリックして解答を送信しましょう。",
    imagePath: "/images/help/eventdetail1.png",
    targetSelector: ".submit-button",
    order: 2,
    page: "event_detail_problem",
    role: "participant",
  },
  
  // 作成者: 問題の編集
  {
    id: "event_problem_edit",
    title: "問題の編集",
    description: "イベント作成者として、問題の内容を編集できます。",
    imagePath: "/images/help/eventadmin.png",
    targetSelector: ".edit-problem",
    order: 1,
    page: "event_detail_problem",
    role: "creator",
  },
];
