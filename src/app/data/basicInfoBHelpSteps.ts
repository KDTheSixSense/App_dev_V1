import { HelpStep } from "../../types/help";

/**
 * 基本情報技術者試験 科目B 問題詳細ページのチュートリアルステップ
 * 基本情報科目B問題画面のヘルプデータを定義します。
 */
export const basicInfoBHelpSteps: HelpStep[] = [
  // 基本情報技術者試験 科目B 問題詳細ページ
  {
    id: "basic_info_b_problem_overview",
    title: "基本情報技術者試験 科目B 問題詳細",
    description: "このページでは、基本情報技術者試験の科目Bの問題を解くことができます。問題文とプログラムを読んで、正解の選択肢を選んでください。",
    imagePath: "/images/help/kihongB1.png",
    targetSelector: ".container",
    order: 1,
    page: "issue_list/basic_info_b_problem",
  },
  {
    id: "basic_info_b_problem_overview",
    title: "解答選択と解説表示",
    description: "正解の場合は緑色、不正解の場合は赤色で表示され、その下に説明が表示されます。",
    imagePath: "/images/help/kihongB2.png",
    targetSelector: ".bg-white.p-6.sm\\:p-8.rounded-xl.shadow-lg.border.border-gray-200.min-h-\\[calc\\(100vh-120px\\)\\].flex.flex-col",
    order: 2,
    page: "issue_list/basic_info_b_problem",
  },
  {
    id: "basic_info_b_problem_overview",
    title: "トレース画面と変数セクション",
    description: "トレースの開始、リセット、次のステップの実行が可能です。プリセットデータを選択してトレースを開始すると、現在実行中のコード行がハイライトされます。これにより、トレース実行中に変数の値がどのように変化するかを直接確認できます。",
    imagePath: "/images/help/kihongB3.png",
    targetSelector: ".bg-white.p-6.rounded-xl.shadow-lg.border.border-gray-200",
    order: 4,
    page: "issue_list/basic_info_b_problem",
  },
  {
    id: "basic_info_b_problem_overview",
    title: "AIチャット (コハク)",
    description: "AIアシスタントのコハクに質問できます。問題の理解が難しい場合にヒントをもらえます。クレジットを使用して質問してください。",
    imagePath: "/images/help/kihongB4.png",
    targetSelector: ".bg-white.rounded-xl.shadow-lg.border.border-gray-200.overflow-hidden",
    order: 5,
    page: "issue_list/basic_info_b_problem",
  },
];
