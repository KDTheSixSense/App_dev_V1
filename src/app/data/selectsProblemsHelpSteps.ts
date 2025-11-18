import { HelpStep } from "../../types/help";

/**
 * 4択問題詳細ページのチュートリアルステップ
 * 4択問題画面のヘルプデータを定義します。
 */
export const selectsProblemsHelpSteps: HelpStep[] = [
  // 4択問題詳細ページ
  {
    id: "selects_problems_overview",
    title: "4択問題詳細",
    description: "このページでは、4つの選択肢から正解を選ぶ問題に挑戦できます。問題文を読んで回答してください。",
    imagePath: "/images/help/4taku.png",
    targetSelector: ".container",
    order: 1,
    page: "issue_list/selects_problems",
  },
  {
    id: "problem_statement_selects",
    title: "解答選択と解説表示",
    description: "正解の場合は緑色、不正解の場合は赤色で表示され、その下に説明が表示されます。",
    imagePath: "/images/help/4taku2.png",
    targetSelector: ".container",
    order: 2,
    page: "issue_list/selects_problems",
  },
  {
    id: "problem_statement_selects",
    title: "AIチャット (コハク)",
    description: "AIコハクが生成したインタラクティブな質問に答えることができます。チャット形式で質問が表示され、あなたの回答に対してAIがフィードバックを提供します。正解に近づくようにヒントをもらいながら学習を進めましょう。回答が正しい場合は緑色、不正解の場合は赤色で表示され、AIからのアドバイスを確認できます。",
    imagePath: "/images/help/kihongA3.png",
    targetSelector: ".container",
    order: 3,
    page: "issue_list/selects_problems",
  },
  
];
