import { HelpStep } from "../../types/help";

/**
 * グループコーディングページのチュートリアルステップ
 * グループ課題のプログラミング問題画面のヘルプデータを定義します。
 */
export const groupCodingPageHelpSteps: HelpStep[] = [
  // グループコーディングページ
  {
    id: "group_coding_overview",
    title: "グループコーディングページの概要",
    description: "このページでは、グループの課題としてプログラミング問題を解くことができます。左側に問題文、中央にコードエディタ、右側にAIチャットがあります。問題をよく読み、サンプルケースを理解してからコードを書いてください。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".h-screen.bg-gray-100.p-4.overflow-hidden",
    order: 1,
    page: "group/coding-page",
  },
  {
    id: "group_problem_description",
    title: "問題文の確認",
    description: "左パネルの問題文をよく読んでください。問題の説明とサンプルケースが記載されています。サンプル入力と期待される出力例を確認して、問題の要件を理解しましょう。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".p-4.border-b.flex-shrink-0",
    order: 2,
    page: "group/coding-page",
  },
  {
    id: "group_code_editor_intro",
    title: "コードエディタの使い方",
    description: "中央パネルでコードを書きます。まず、右上のドロップダウンからプログラミング言語を選択してください。Python、JavaScript、Java、C、C++、C#、PHPから選べます。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".p-4.border-b.flex.justify-between.items-center.flex-shrink-0",
    order: 3,
    page: "group/coding-page",
  },
  {
    id: "group_code_input_execution",
    title: "コード入力と実行",
    description: "選択した言語でコードを入力してください。下部の「標準入力」タブでテスト用の入力を設定し、「実行」ボタンをクリックしてコードをテストできます。実行結果は「実行結果」タブに表示されます。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".flex.border.border-gray-300.rounded-md.p-0\\.5",
    order: 4,
    page: "group/coding-page",
  },
  {
    id: "group_submission",
    title: "提出と判定",
    description: "コードが正しく動作することを確認したら、「提出」ボタンをクリックしてください。システムが自動で判定を行い、正解の場合は課題の完了となります。不正解の場合は、出力がどのように異なるかを確認して修正してください。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".flex.gap-2",
    order: 5,
    page: "group/coding-page",
  },
  {
    id: "group_ai_chat_help",
    title: "AIチャット (コハク)",
    description: "右パネルのAIチャットでヒントをもらいましょう。質問を入力すると、AIが問題解決のヒントを提供します。分からない部分があれば、積極的に質問してください。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".p-4.border-b.flex-shrink-0",
    order: 6,
    page: "group/coding-page",
  },
];
