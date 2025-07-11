/*
  Warnings:

  - You are about to drop the column `title` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[selectedTitleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('USER_LEVEL', 'SUBJECT_LEVEL');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "title",
ADD COLUMN     "selectedTitleId" INTEGER;

-- CreateTable
CREATE TABLE "Title" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TitleType" NOT NULL,
    "requiredLevel" INTEGER NOT NULL,
    "requiredSubjectId" INTEGER,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUnlockedTitle" (
    "userId" INTEGER NOT NULL,
    "titleId" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserUnlockedTitle_pkey" PRIMARY KEY ("userId","titleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Title_name_key" ON "Title"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_selectedTitleId_key" ON "User"("selectedTitleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_selectedTitleId_fkey" FOREIGN KEY ("selectedTitleId") REFERENCES "Title"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUnlockedTitle" ADD CONSTRAINT "UserUnlockedTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUnlockedTitle" ADD CONSTRAINT "UserUnlockedTitle_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
