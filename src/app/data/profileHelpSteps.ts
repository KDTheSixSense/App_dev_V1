import { HelpStep } from "../../types/help";

/**
 * プロフィールページのチュートリアルステップ
 * プロフィール画面のヘルプデータを定義します。
 */
export const profileHelpSteps: HelpStep[] = [
  // プロフィールページ
  {
    id: "profile_overview",
    title: "プロフィール画面の概要",
    description: "このページでは、あたなのプロフィール情報を確認したり、コハクの情報や、学習履歴を確認することができます。",
    imagePath: "/images/help/profile2.png",
    targetSelector: ".profile-section",
    order: 1,
    page: "profile",
  },
  {
    id: "profile_overview",
    title: "プロフィール画面の概要",
    description: "ここでは、あなたのプロフィール情報を確認・編集できます。\n称号を持っている場合は称号を変更することもできます。",
    imagePath: "/images/help/profile2.png",
    targetSelector: ".profile-section",
    order: 1,
    page: "profile",
  },
  {
    id: "profile_overview",
    title: "プロフィール画面の概要",
    description: "ここでは、あなたのコハクの情報尾確認することができます。\nコハクの名前を変更することもできます。\nお迎え日はあなたかコハクを迎えた日(アカウント作成日)を表しています。",
    imagePath: "/images/help/profile3.png",
    targetSelector: ".profile-section",
    order: 1,
    page: "profile",
  },
  {
    id: "profile_overview",
    title: "プロフィール画面の概要",
    description: "ここではあなたの解答履歴を確認することができます。\n右のフィルターで期間を指定して履歴を確認することもできます。",
    imagePath: "/images/help/profile4.png",
    targetSelector: ".profile-section",
    order: 1,
    page: "profile",
  },
  {
    id: "profile_overview",
    title: "プロフィール画面の概要",
    description: "ここでは学習履歴を確認することができます。\n日ごとにどれだけ学習したかをグラフで確認できます。",
    imagePath: "/images/help/profile4.png",
    targetSelector: ".profile-section",
    order: 1,
    page: "profile",
  },
];
