/*
  Warnings:

  - A unique constraint covering the columns `[programmingProblemId]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "programmingProblemId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_programmingProblemId_key" ON "Assignment"("programmingProblemId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_programmingProblemId_fkey" FOREIGN KEY ("programmingProblemId") REFERENCES "ProgrammingProblem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
