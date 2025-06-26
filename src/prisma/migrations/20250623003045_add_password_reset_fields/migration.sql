-- DropForeignKey
ALTER TABLE "UserAnswer" DROP CONSTRAINT "UserAnswer_problemId_fkey";

-- DropForeignKey
ALTER TABLE "UserAnswer" DROP CONSTRAINT "UserAnswer_userId_fkey";

-- AlterTable
ALTER TABLE "UserAnswer" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "problemId" DROP NOT NULL;
