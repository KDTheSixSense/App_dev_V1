/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Applied_am_Question` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `Basic_Info_A_Question` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `ProgrammingProblem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title,description]` on the table `Questions_Algorithm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `SelectProblem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applied_am_Question_title_key" ON "Applied_am_Question"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Basic_Info_A_Question_title_key" ON "Basic_Info_A_Question"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammingProblem_title_key" ON "ProgrammingProblem"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Questions_Algorithm_title_description_key" ON "Questions_Algorithm"("title", "description");

-- CreateIndex
CREATE UNIQUE INDEX "SelectProblem_title_key" ON "SelectProblem"("title");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
