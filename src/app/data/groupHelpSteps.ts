import { HelpStep } from "../../types/help";

/**
 * グループページのチュートリアルステップ
 * グループ画面のヘルプデータを定義します。
 */
export const groupHelpSteps: HelpStep[] = [
  // グループページ
  {
    id: "group_overview",
    title: "グループ画面の概要",
    description: "グループに参加して、他のユーザーと一緒に学習しましょう。グループ内ランキングやチャット機能が利用できます。",
    imagePath: "/images/help/grup1.png",
    targetSelector: ".group-list",
    order: 1,
    page: "group",
  },
  {
    id: "group_overview",
    title: "グループ画面の概要",
    description: "グループに参加して、他のユーザーと一緒に学習しましょう。グループ内ランキングやチャット機能が利用できます。",
    imagePath: "/images/help/grup.png",
    targetSelector: ".group-list",
    order: 2,
    page: "group",
  },
  //ADMIN
  {
    id: "group_overview",
    title: "お知らせの投稿",
    description: "グループに参加して、他のユーザーと一緒に学習しましょう。グループ内ランキングやチャット機能が利用できます。",
    imagePath: "/images/help/admin1.png",
    targetSelector: ".group-list",
    order: 1,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "課題の作成",
    description: "グループに参加して、他のユーザーと一緒に学習しましょう。グループ内ランキングやチャット機能が利用できます。",
    imagePath: "/images/help/admin2.png",
    targetSelector: ".group-list",
    order: 2,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "メンバーの管理と招待",
    description: "「メンバー」タブでは、クラスに参加している全メンバーの確認、新しいメンバーの招待、招待コードの共有ができます。",
    imagePath: "/images/help/admin4.png",
    targetSelector: ".group-list",
    order: 3,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "グループ画面の概要",
    description: "グループに参加して、他のユーザーと一緒に学習しましょう。グループ内ランキングやチャット機能が利用できます。",
    imagePath: "/images/help/admin3.png",
    targetSelector: ".group-list",
    order: 4,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "課題への問題追加",
    description: "「＋追加または作成」ボタンを押すと、新しい問題を作成するか、既存の問題から選択して課題に追加することができます。",
    imagePath: "/images/help/admin5.png",
    targetSelector: ".group-list",
    order: 5,
    page: "group",
    role: "admin"
  },
  
  {
    id: "group_overview",
    title:  "既存の問題から選択",
    description:  "「既存から選択」を選ぶと、過去に作成した問題の一覧が表示されます。ここから課題に追加したい問題を選びましょう。",
    imagePath: "/images/help/admin6.png",
    targetSelector: ".group-list",
    order: 6,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "グループ画面の概要",
    description: "グループに参加して、他のユーザーと一緒に学習しましょう。グループ内ランキングやチャット機能が利用できます。",
    imagePath: "/images/help/admin7.png",
    targetSelector: ".group-list",
    order: 7,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "課題の完成イメージ",
    description: "問題が追加されると、このように課題内に表示されます。内容を確認したら「課題を作成」ボタンを押して、メンバーに公開しましょう。",
    imagePath: "/images/help/admin7.png",
    targetSelector: ".group-list",
    order: 8,
    page: "group",
    role: "admin"
  },

  // MEMBER
  {
    id: "group_overview_member1",
    title: "お知らせの確認",
    description: "「お知らせ」タブでは、先生や管理者からの大切な連絡を確認できます。クラスに入ったら、まずここをチェックしましょう。",
    imagePath: "/images/help/member1.png",
    targetSelector: ".group-list",
    order: 1,
    page: "group",
    role: "member",
  },
  {
    id: "group_overview_member2",
    title: "課題の確認と提出",
    description: "「課題」タブで、先生から出された課題を確認できます。緑のチェックマーク（✅）は、提出済みの課題を示しています。",
    imagePath: "/images/help/member2.png",
    targetSelector: ".group-list",
    order: 2,
    page: "group",
    role: "member",
  },
  {
    id: "group_overview_member3",
    title: "クラスの仲間",
    description: "メンバー」タブでは、このクラスに参加している先生（管理者）や他のクラスメイトを確認することができます。",
    imagePath: "/images/help/member3.png",
    targetSelector: ".group-list",
    order: 3,
    page: "group",
    role: "member",
  },
  {
    id: "group_overview_member3",
    title: "課題への挑戦",
    description: "課題をクリックすると詳細画面に移動します。「問題に挑戦する」ボタンを押して、課題を始めましょう。",
    imagePath: "/images/help/member4.png",
    targetSelector: ".group-list",
    order: 4,
    page: "group",
    role: "member",
  },
];
