import { HelpStep } from "../../types/help";

/**
 * プログラミング問題詳細ページのチュートリアルステップ
 * プログラミング問題画面のヘルプデータを定義します。
 */
export const programmingProblemHelpSteps: HelpStep[] = [
  // プログラミング問題詳細ページ
  {
    id: "programming_problem_overview",
    title: "プログラミング問題の概要",
    description: "このページでは、プログラミング問題を解くことができます。左側に問題文、右側にコードエディタ、コハクに対しチャットができます。問題をよく読み、サンプルケースを理解してからコードを書いてください。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".h-screen.bg-gray-100.p-4.overflow-hidden",
    order: 1,
    page: "issue_list/programming_problem",
  },
  {
    id: "problem_description",
    title: "問題文の確認",
    description: "左パネルの問題文をよく読んでください。問題の説明とサンプルケースが記載されています。サンプル入力と期待される出力例を確認して、問題の要件を理解しましょう。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".p-4.border-b.flex-shrink-0",
    order: 2,
    page: "issue_list/programming_problem",
  },
  {
    id: "code_editor_intro",
    title: "コードエディタの使い方",
    description: "中央パネルでコードを書きます。まず、右上のドロップダウンからPython、JavaScript、Java、C、C++、C#、PHPのプログラミング言語を選択して問題を解答してください。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".p-4.border-b.flex.justify-between.items-center.flex-shrink-0",
    order: 3,
    page: "issue_list/programming_problem",
  },
  {
    id: "code_input_execution",
    title: "コード入力と実行",
    description: "下部の「標準入力」タブでテスト用の入力(引数)を設定し、「実行」ボタンをクリックしてコードをテストできます。実行結果は「実行結果」タブに表示されます。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".flex.border.border-gray-300.rounded-md.p-0\\.5",
    order: 4,
    page: "issue_list/programming_problem",
  },
  {
    id: "submission",
    title: "提出と判定",
    description: "コードが正しく動作することを確認したら、「提出」ボタンをクリックしてください。システムが自動で判定を行い、正解の場合は次の問題へ進めます。不正解の場合は、出力がどのように異なるかを確認して修正してください。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".flex.gap-2",
    order: 5,
    page: "issue_list/programming_problem",
  },
  {
    id: "ai_chat_help",
    title: "AIチャット (コハク)",
    description: "コハクに対してチャット形式で投げかけることができ、あなたの質問に対しコハクがフィードバックを提供します。正解に近づくようにヒントをもらいながら学習を進めましょう。",
    imagePath: "/images/help/programing1.png",
    targetSelector: ".p-4.border-b.flex-shrink-0",
    order: 6,
    page: "issue_list/programming_problem",
  },
];
