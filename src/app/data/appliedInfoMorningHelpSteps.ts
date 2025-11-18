import { HelpStep } from "../../types/help";

/**
 * 応用情報午前問題詳細ページのチュートリアルステップ
 * 応用情報午前問題画面のヘルプデータを定義します。
 */
export const appliedInfoMorningHelpSteps: HelpStep[] = [
  // 応用情報午前問題詳細ページ
  {
    id: "applied_info_morning_problem_overview",
    title: "応用情報技術者試験 午前問題詳細",
    description: "このページでは、応用情報技術者試験の午前問題を解くことができます。問題文を読んで、正解の選択肢を選んでください。",
    imagePath: "/images/help/oyo1.png",
    targetSelector: ".container",
    order: 1,
    page: "issue_list/applied_info_morning_problem",
  },
  {
    id: "applied_info_morning_problem_overview",
    title: "問題文",
    description: "問題の説明が表示されます。内容をよく読んで理解してください。",
    imagePath: "/images/help/oyo2.png",
    targetSelector: ".container",
    order: 2,
    page: "issue_list/applied_info_morning_problem",
  },
  {
    id: "applied_info_morning_problem_overview",
    title: "AIチャット (コハク)",
    description: "AIコハクが生成したインタラクティブな質問に答えることができます。チャット形式で質問が表示され、あなたの回答に対してAIがフィードバックを提供します。正解に近づくようにヒントをもらいながら学習を進めましょう。回答が正しい場合は緑色、不正解の場合は赤色で表示され、AIからのアドバイスを確認できます。",
    imagePath: "/images/help/oyo3.png",
    targetSelector: ".container",
    order: 3,
    page: "issue_list/applied_info_morning_problem",
  },

];
