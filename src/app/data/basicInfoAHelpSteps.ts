import { HelpStep } from "../../types/help";

/**
 * 基本情報技術者試験 科目A 問題詳細ページのチュートリアルステップ
 * 基本情報科目A問題画面のヘルプデータを定義します。
 */
export const basicInfoAHelpSteps: HelpStep[] = [
  // 基本情報技術者試験 科目A 問題詳細ページ
  {
    id: "basic_info_a_overview",
    title: "基本情報技術者試験 科目A 問題詳細",
    description: "このページでは、基本情報技術者試験の科目Aの問題を解くことができます。問題文とプログラムを読んで、正解の選択肢を選んでください。",
    imagePath: "/images/help/kihongA1.png",
    targetSelector: ".container",
    order: 1,
    page: "issue_list/basic_info_a_problem",
  },
  {
    id: "basic_info_a_answer_explanation",
    title: "解答選択と解説表示",
    description: "正解の場合は緑色、不正解の場合は赤色で表示され、その下に説明が表示されます。",
    imagePath: "/images/help/kihongA2.png",
    targetSelector: ".container",
    order: 2,
    page: "issue_list/basic_info_a_problem",
  },
  {
    id: "basic_info_a_ai_chat",
    title: "AIチャット (コハク)",
    description: "AIコハクが生成したインタラクティブな質問に答えることができます。チャット形式で質問が表示され、あなたの回答に対してAIがフィードバックを提供します。正解に近づくようにヒントをもらいながら学習を進めましょう。回答が正しい場合は緑色、不正解の場合は赤色で表示され、AIからのアドバイスを確認できます。",
    imagePath: "/images/help/kihongA3.png",
    targetSelector: ".container",
    order: 3,
    page: "issue_list/basic_info_a_problem",
  },
];
