-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birth" DATE,
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "resetPasswordTokenExpiry" TIMESTAMP(3);
