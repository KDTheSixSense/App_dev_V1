import { HelpStep } from "../../types/help";

/**
 * グループ課題プログラミング問題作成ページのチュートリアルステップ
 * グループ内の課題としてプログラミング問題を作成する画面のヘルプデータを定義します。
 */
export const groupAssignmentsCreateProgrammingHelpSteps: HelpStep[] = [

  // 問題タイプ選択
  {
    id: "group_assignments_category_selection",
    title: "問題タイプの選択",
    description: "左側のサイドバーから作成する問題のタイプを選択してください。「プログラミング問題」はコーディング問題、「4択問題」は選択式の問題を作成できます。",
    imagePath: "/images/help/assiment.png",
    targetSelector: ".sidebar-menu",
    order: 1,
    page: "group_assignments_create_programming",
  },

  // 問題文作成（プログラミング問題）
  {
    id: "group_assignments_description_tab_programming",
    title: "問題文の作成（プログラミング問題）",
    description: "タブで問題の基本的な情報を設定します。問題タイトル、難易度、制限時間、トピック、タグなどを入力してください。",
    imagePath: "/images/help/assiment1.png",
    targetSelector: ".markdown-toolbar",
    order: 2,
    page: "group_assignments_create_programming",
  },

  // 4択問題の基本情報
  {
    id: "group_assignments_select_problem_basic",
    title: "4択問題の作成",
    description: "4択問題では、問題文、4つの選択肢、正解の選択肢、解説を入力します。ラジオボタンで正解となる選択肢を指定してください。",
    imagePath: "/images/help/assiment2.png",
    targetSelector: ".form-group",
    order: 3,
    page: "group_assignments_create_programming",
  },

];
