import { HelpStep } from "../../types/help";

/**
 * ホームページのチュートリアルステップ
 * ホーム画面のヘルプデータを定義します。
 */
export const homeHelpSteps: HelpStep[] = [
  // ホーム画面の全体概要を説明するヘルプステップ
  {
    id: "home_page_overview",
    title: "ホーム画面",
    description: "この画面では、ランキング、コハクの現在の状態、あなたの学習状況、デイリーミッションの進捗を一覧で確認できます。\n画面上部のヘッダーから各画面に遷移することができます。",
    imagePath: "/images/help/home_overview.png",
    targetSelector: "header nav",
    order: 1,
    page: "home",
  },
  // ユーザープロフィールの情報を説明するヘルプステップ
   {
    id: "user_profile",
    title: "学習状況",
    description: "ここではあなたの学習状況が確認できます。\nアイコン、名前、ランク、連続ログイン日数、総ログイン日数、残課題数が表示されます。",
    imagePath: "/images/help/user_profile.png",
    targetSelector: ".user-profile-card",
    order: 1,
    page: "home",
  },
  // ペットの満腹度を説明するヘルプステップ
  {
    id: "pet_status",
    title: "コハクの現在の状態",
    description: "コハクの現在の状態を確認できます。\nコハクはすぐにおなかが減ってしまいます。よって餌をあげる必要があります。\n餌を与えるには、問題を解かなければなりません。\n満腹度は、10分ごとに1ずつ減っていきます。満腹度が下がると表情が変わり、元気がなくなってしまいます。\nまずは「餌を探しに行く」ボタンで餌を入手するために問題一覧に進み、問題を解きましょう!",
    imagePath: "/images/help/pet_status.png",
    targetSelector: ".pet-status-card",
    order: 2,
    page: "home",
  },
  // デイリーミッションの説明をするヘルプステップ
  {
    id: "daily_mission",
    title: "デイリーミッション",
    description: "毎日更新されるミッションです。クリアするとXPが報酬がもらえます。\n毎日クリアを目指しましょう！",
    imagePath: "/images/help/daily_mission.png",
    targetSelector: ".daily-mission-card",
    order: 3,
    page: "home",
  },
];
