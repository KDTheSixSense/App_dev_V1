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
    description: "こちらはグループ画面です。グループ内では課題投稿することができ、課題に対し問題を解くこと、提出状況を把握することができます。",
    imagePath: "/images/help/grup1.png",
    targetSelector: ".group-list",
    order: 1,
    page: "group",
  },
  {
    id: "group_overview",
    title: "グループ画面の概要",
    description: "＋ボタンを押すことにより、グループを作成したり、グループに参加することができます。",
    imagePath: "/images/help/grup.png",
    targetSelector: ".group-list",
    order: 2,
    page: "group",
  },
  //ADMIN
  {
    id: "group_overview",
    title: "お知らせの投稿",
    description: "お知らせタブでは、グループの管理者がメンバーに対しお知らせの掲示板をここで投稿することができます。メンバー側では管理者が送信したお知らせを確認することができます。",
    imagePath: "/images/help/admin1.png",
    targetSelector: ".group-list",
    order: 1,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "課題の作成",
    description: "課題タブでは、グループの管理者がメンバーに対し課題を作成することができます。課題タイトル、課題のサブタイトル(課題についての詳細説明)、課題の期限を選択し、「追加または作成」ボタンでプログラミング問題、選択問題の課題を新規作成、既存問題を課題投稿に対し問題挿入し、投稿することができます。",
    imagePath: "/images/help/admin2.png",
    targetSelector: ".group-list",
    order: 2,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "メンバーの管理と招待",
    description: "「メンバー」タブでは、クラスに参加している全メンバーの確認、新しいメンバーの招待、招待コードの共有ができます。また管理者を複数人渡したい場合、権限付与することも可能です。",
    imagePath: "/images/help/admin4.png",
    targetSelector: ".group-list",
    order: 3,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "グループ画面の概要",
    description: "提出状況一覧ではグループの管理者が課題を作成した後、この画面で各ユーザの提出状況を「提出済み」、「未提出」、「差し戻し」の三つの項目があり、目視でチェックすることが可能です。もし課題に対し、解答内容が不正であれば差し戻しすることにより、メンバー側に対し再提出を促せます。",
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
    description:  "「既存から選択」を選ぶと、過去に作成した問題の一覧が表示されます。ここから過去に作成した問題を課題として作成することも可能です。",
    imagePath: "/images/help/admin6.png",
    targetSelector: ".group-list",
    order: 6,
    page: "group",
    role: "admin"
  },
  {
    id: "group_overview",
    title: "グループ画面の概要",
    description: "「既存から選択」を選ぶと、以下の画像のように開くことができます。",
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
    description: "「お知らせ」タブでは、先生や管理者からの連絡を確認できます。クラスに入ったら、まずここをチェックしましょう。",
    imagePath: "/images/help/member1.png",
    targetSelector: ".group-list",
    order: 1,
    page: "group",
    role: "member",
  },
  {
    id: "group_overview_member2",
    title: "課題の確認と提出",
    description: "「課題」タブで、先生から出された課題を確認できます。赤の × マークは未提出を示しています。",
    imagePath: "/images/help/member2-1.png",
    targetSelector: ".group-list",
    order: 2,
    page: "group",
    role: "member",
  },
  {
    id: "group_overview_member2",
    title: "課題の確認と提出",
    description: "「課題」タブで、先生から出された課題を確認できます。緑のチェックマーク（✅）は、提出済みの課題を示しています。",
    imagePath: "/images/help/member2.png",
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
