// app/data/helpData.ts
/**
 * ホームページのチュートリアルステップ（1/x）：ナビゲーションバーの概要
 * id: ステップID
 * title: タイトル
 * description: 説明文
 * imagePath: 表示画像のパス
 * targetSelector: ハイライトする要素
 * order: 表示順
 * page: 対象ページ
 */
import { HelpStep } from "../../types/help";
import { homeHelpSteps } from "./homeHelpSteps";
import { issueListHelpSteps } from "./issueListHelpSteps";
import { basicInfoBHelpSteps } from "./basicInfoBHelpSteps";
import { basicInfoAHelpSteps } from "./basicInfoAHelpSteps";
import { appliedInfoMorningHelpSteps } from "./appliedInfoMorningHelpSteps";
import { programmingProblemHelpSteps } from "./programmingProblemHelpSteps";
import { selectsProblemsHelpSteps } from "./selectsProblemsHelpSteps";
import { mineIssueListHelpSteps } from "./mineIssueListHelpSteps";
import { programmingProblemsListHelpSteps } from "./programmingProblemsListHelpSteps";
import { createProgrammingQuestionHelpSteps } from "./createProgrammingQuestionHelpSteps";
import { groupAssignmentsCreateProgrammingHelpSteps } from "./groupAssignmentsCreateProgrammingHelpSteps";
import { groupHelpSteps } from "./groupHelpSteps";
import { groupCodingPageHelpSteps } from "./groupCodingPageHelpSteps";
import { groupSelectPageHelpSteps } from "./groupSelectPageHelpSteps";
import { unsubmittedAssignmentsHelpSteps } from "./unsubmittedAssignmentsHelpSteps";
import { eventHelpSteps } from "./eventHelpSteps";
import { eventDetailProblemHelpSteps } from "./eventDetailProblemHelpSteps";
import { createEventHelpSteps } from "./createEventHelpSteps";
import { profileHelpSteps } from "./profileHelpSteps";

/**
 * ヘルプデータの統合配列
 * 各ページのヘルプステップをまとめたものです。
 * 各ファイルからインポートされたヘルプステップを結合してエクスポートします。
 */
export const helpSteps: HelpStep[] = [
  ...homeHelpSteps,
  ...issueListHelpSteps,
  ...basicInfoBHelpSteps,
  ...basicInfoAHelpSteps,
  ...appliedInfoMorningHelpSteps,
  ...programmingProblemHelpSteps,
  ...selectsProblemsHelpSteps,
  ...mineIssueListHelpSteps,
  ...programmingProblemsListHelpSteps,
  ...createProgrammingQuestionHelpSteps,
  ...groupAssignmentsCreateProgrammingHelpSteps,
  ...groupHelpSteps,
  ...groupCodingPageHelpSteps,
  ...groupSelectPageHelpSteps,
  ...unsubmittedAssignmentsHelpSteps,
  ...eventHelpSteps,
  ...eventDetailProblemHelpSteps,
  ...createEventHelpSteps,
  ...profileHelpSteps,
];
