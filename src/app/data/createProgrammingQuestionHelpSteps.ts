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
    description: "このページでは、新しいプログラミング問題を作成できます。問題文、テストケース、解答例などを入力してください。",
    imagePath: "/images/help/create_programming_question_overview.png",
    targetSelector: ".question-form",
    order: 1,
    page: "CreateProgrammingQuestion",
  },
  {
    id: "create_programming_question_overview",
    title: "プログラミング問題作成画面の概要",
    description: "このページでは、新しいプログラミング問題を作成できます。問題文、テストケース、解答例などを入力してください。",
    imagePath: "/images/help/create_programming_question_overview1.png",
    targetSelector: ".question-form",
    order: 2,
    page: "CreateProgrammingQuestion",
  },
  {
    id: "create_programming_question_overview",
    title: "プログラミング問題作成画面の概要",
    description: "このページでは、新しいプログラミング問題を作成できます。問題文、テストケース、解答例などを入力してください。",
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
  {
    id: "create_programming_question_overview",
    title: "プログラミング問題作成画面の概要",
    description: "このページでは、新しいプログラミング問題を作成できます。問題文、テストケース、解答例などを入力してください。",
    imagePath: "/images/help/create_programming_question_overview4.png",
    targetSelector: ".question-form",
    order: 5,
    page: "CreateProgrammingQuestion",
  },
  {
    id: "create_programming_question_overview",
    title: "プログラミング問題作成画面の概要",
    description: "このページでは、新しいプログラミング問題を作成できます。問題文、テストケース、解答例などを入力してください。",
    imagePath: "/images/help/create_programming_question_overview5.png",
    targetSelector: ".question-form",
    order: 6,
    page: "CreateProgrammingQuestion",
  },
  {
  id: "edit_mode",
    title: "既存問題の編集",
    description: "URLに問題IDを指定してアクセスすると編集モードになります。既存の問題を修正して更新することができます。",
    imagePath: "/images/help/create_programming_question_edit.png",
    targetSelector: ".edit-mode-indicator",
    order: 7,
    page: "CreateProgrammingQuestion",
  },
];
