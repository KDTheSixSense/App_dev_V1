/*
  Warnings:

  - You are about to drop the column `questionId` on the `UserAnswer` table. All the data in the column will be lost.
  - You are about to drop the `User_Answer_History` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Status_Kohaku" ADD COLUMN     "birthdate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'コハク';

-- AlterTable
ALTER TABLE "UserAnswer" DROP COLUMN "questionId";

-- DropTable
DROP TABLE "public"."User_Answer_History";

-- CreateTable
CREATE TABLE "Applied_am_Question" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "imagePath" TEXT,
    "description" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "answerOptions" JSONB NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "sourceYear" TEXT,
    "sourceNumber" TEXT,
    "difficultyId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "assignmentId" INTEGER,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Applied_am_Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Applied_am_QuestionToUserAnswer" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Applied_am_QuestionToUserAnswer_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_Applied_am_QuestionToUserAnswer_B_index" ON "_Applied_am_QuestionToUserAnswer"("B");

-- AddForeignKey
ALTER TABLE "Applied_am_Question" ADD CONSTRAINT "Applied_am_Question_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "Difficulty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applied_am_Question" ADD CONSTRAINT "Applied_am_Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applied_am_Question" ADD CONSTRAINT "Applied_am_Question_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applied_am_Question" ADD CONSTRAINT "Applied_am_Question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Applied_am_QuestionToUserAnswer" ADD CONSTRAINT "_Applied_am_QuestionToUserAnswer_A_fkey" FOREIGN KEY ("A") REFERENCES "Applied_am_Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Applied_am_QuestionToUserAnswer" ADD CONSTRAINT "_Applied_am_QuestionToUserAnswer_B_fkey" FOREIGN KEY ("B") REFERENCES "UserAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
