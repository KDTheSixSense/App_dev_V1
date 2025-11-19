import { HelpStep } from "../../types/help";

/**
 * ホームページのチュートリアルステップ
 * ホーム画面のヘルプデータを定義します。
 */
export const homeHelpSteps: HelpStep[] = [
  // ホーム画面の全体概要を説明するヘルプステップ
  {
    id: "home_page_overview",
    title: "ようこそ！ホーム画面の概要",
    description: "この画面では、あなたの学習状況、ランキング、デイリーミッションを一覧で確認できます。まずは画面上部のナビゲーションバーを見てみましょう。",
    imagePath: "/images/help/home_overview.png",
    targetSelector: "header nav",
    order: 1,
    page: "home",
  },
  // ユーザープロフィールの情報を説明するヘルプステップ
   {
    id: "user_profile",
    title: "プロフィール",
    description: "ユーザーのプロフィール情報です。アバター、名前、ランク、経験値バー、連続ログイン日数、総ログイン日数、クリアした課題数が表示されます。",
    imagePath: "/images/help/user_profile.png",
    targetSelector: ".user-profile-card",
    order: 1,
    page: "home",
  },
  // ペットの満腹度を説明するヘルプステップ
  {
    id: "pet_status",
    title: "ペットの満腹度",
    description: "ペット（コハク）の現在の満腹度を示します。コハクはすぐにおなかが減ってしまいます。よって餌をあげる必要があります。餌を与えるには、問題を解かなければなりません。ゲージは、10分に1ポイント下がる仕様になっています。満腹度が下がると表情が変わり、元気がなくなってしまいます。まずは「餌を探しに行く」ボタンで餌を入手するために問題一覧に進み、問題を解きましょう!",
    imagePath: "/images/help/pet_status.png",
    targetSelector: ".pet-status-card",
    order: 2,
    page: "home",
  },
  // デイリーミッションの説明をするヘルプステップ
  {
    id: "daily_mission",
    title: "デイリーミッション",
    description: "毎日更新されるミッションです。クリアするとXPやペットの餌などの報酬がもらえます。挑戦してみましょう！",
    imagePath: "/images/help/daily_mission.png",
    targetSelector: ".daily-mission-card",
    order: 3,
    page: "home",
  },
];
