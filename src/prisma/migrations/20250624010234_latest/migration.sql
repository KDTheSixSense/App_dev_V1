-- DropForeignKey
ALTER TABLE "UserAnswer" DROP CONSTRAINT "UserAnswer_problemId_fkey";

-- DropForeignKey
ALTER TABLE "UserAnswer" DROP CONSTRAINT "UserAnswer_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birth" DATE,
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "resetPasswordTokenExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserAnswer" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "problemId" DROP NOT NULL;
