import { HelpStep } from "../../types/help";

/**
 * プログラミング問題作成ページのチュートリアルステップ
 * プログラミング問題作成画面のヘルプデータを定義します。
 */
export const createProgrammingQuestionHelpSteps: HelpStep[] = [
  // プログラミング問題作成ページ
  {
    id: "create_programming_question_overview",
    title: "プログラミング問題作成画面の概要",
    description: "このページでは、新しいプログラミング問題を作成できます。基本情報欄では問題タイトル、問題タイプ、難易度、トピック、タグを挿入することができます。",
    imagePath: "/images/help/create_programming_question_overview.png",
    targetSelector: ".question-form",
    order: 1,
    page: "CreateProgrammingQuestion",
  },
  {
    id: "create_programming_question_overview",
    title: "プログラミング問題作成画面の概要",
    description: "このタブは問題文の作成ページです。問題文、コードテンプレートを挿入できます。",
    imagePath: "/images/help/create_programming_question_overview1.png",
    targetSelector: ".question-form",
    order: 2,
    page: "CreateProgrammingQuestion",
  },
  {
    id: "create_programming_question_overview",
    title: "プログラミング問題作成画面の概要",
    description: "このタブはサンプルケース管理作成ページです。入力欄に必要な引数を入力し、期待出力に引数に対し出力したい数字をここで定義します。",
    imagePath: "/images/help/create_programming_question_overview2.png",
    targetSelector: ".question-form",
    order: 3,
    page: "CreateProgrammingQuestion",
  },
  {
    id: "create_programming_question_overview",
    title: "プログラミング問題作成画面の概要",
    description: "このページでは、新しいプログラミング問題を作成できます。問題文、テストケース、解答例などを入力してください。",
    imagePath: "/images/help/create_programming_question_overview3.png",
    targetSelector: ".question-form",
    order: 4,
    page: "CreateProgrammingQuestion",
  },
];
