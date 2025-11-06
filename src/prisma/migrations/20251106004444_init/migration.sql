/*
  Warnings:

  - You are about to drop the `_Basic_Info_A_QuestionToUserAnswer` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,eventIssueId]` on the table `Event_Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DailyMissionType" AS ENUM ('Answer_the_Question', 'Feed_Them', 'Gain_Xp');

-- DropForeignKey
ALTER TABLE "public"."UserAnswer" DROP CONSTRAINT "UserAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_Basic_Info_A_QuestionToUserAnswer" DROP CONSTRAINT "_Basic_Info_A_QuestionToUserAnswer_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_Basic_Info_A_QuestionToUserAnswer" DROP CONSTRAINT "_Basic_Info_A_QuestionToUserAnswer_B_fkey";

-- AlterTable
ALTER TABLE "Create_event" ADD COLUMN     "hasBeenStarted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isStarted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Event_Participants" ADD COLUMN     "event_getpoint" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hasAccepted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProgrammingProblem" ADD COLUMN     "eventDifficultyId" INTEGER;

-- AlterTable
ALTER TABLE "UserAnswer" ADD COLUMN     "basic_A_Info_Question_id" INTEGER,
ADD COLUMN     "programingProblem_id" INTEGER,
ADD COLUMN     "questions_id" INTEGER,
ADD COLUMN     "selectProblem_id" INTEGER;

-- DropTable
DROP TABLE "public"."_Basic_Info_A_QuestionToUserAnswer";

-- CreateTable
CREATE TABLE "DailyMissionMaster" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "missionType" "DailyMissionType" NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "xpReward" INTEGER NOT NULL,

    CONSTRAINT "DailyMissionMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDailyMissionProgress" (
    "userId" INTEGER NOT NULL,
    "missionId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserDailyMissionProgress_pkey" PRIMARY KEY ("userId","missionId","date")
);

-- CreateTable
CREATE TABLE "DailyActivitySummary" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "totalXpGained" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpentMs" BIGINT NOT NULL DEFAULT 0,
    "problemsCompleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyActivitySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDifficulty" (
    "id" SERIAL NOT NULL,
    "difficultyName" TEXT NOT NULL,
    "basePoints" INTEGER NOT NULL,
    "maxBonusPoints" INTEGER NOT NULL,
    "maxTotalPoints" INTEGER NOT NULL,
    "expectedTimeMinutes" INTEGER NOT NULL,
    "bonusPointsPerMinute" INTEGER NOT NULL,

    CONSTRAINT "EventDifficulty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyActivitySummary_userId_date_idx" ON "DailyActivitySummary"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyActivitySummary_userId_date_key" ON "DailyActivitySummary"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "EventDifficulty_difficultyName_key" ON "EventDifficulty"("difficultyName");

-- CreateIndex
CREATE UNIQUE INDEX "Event_Submission_userId_eventIssueId_key" ON "Event_Submission"("userId", "eventIssueId");

-- CreateIndex
CREATE INDEX "UserAnswer_userId_idx" ON "UserAnswer"("userId");

-- CreateIndex
CREATE INDEX "UserAnswer_programingProblem_id_idx" ON "UserAnswer"("programingProblem_id");

-- CreateIndex
CREATE INDEX "UserAnswer_basic_A_Info_Question_id_idx" ON "UserAnswer"("basic_A_Info_Question_id");

-- CreateIndex
CREATE INDEX "UserAnswer_questions_id_idx" ON "UserAnswer"("questions_id");

-- CreateIndex
CREATE INDEX "UserAnswer_selectProblem_id_idx" ON "UserAnswer"("selectProblem_id");

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_programingProblem_id_fkey" FOREIGN KEY ("programingProblem_id") REFERENCES "ProgrammingProblem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_basic_A_Info_Question_id_fkey" FOREIGN KEY ("basic_A_Info_Question_id") REFERENCES "Basic_Info_A_Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_questions_id_fkey" FOREIGN KEY ("questions_id") REFERENCES "Questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_selectProblem_id_fkey" FOREIGN KEY ("selectProblem_id") REFERENCES "SelectProblem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammingProblem" ADD CONSTRAINT "ProgrammingProblem_eventDifficultyId_fkey" FOREIGN KEY ("eventDifficultyId") REFERENCES "EventDifficulty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyMissionProgress" ADD CONSTRAINT "UserDailyMissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyMissionProgress" ADD CONSTRAINT "UserDailyMissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "DailyMissionMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyActivitySummary" ADD CONSTRAINT "DailyActivitySummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
