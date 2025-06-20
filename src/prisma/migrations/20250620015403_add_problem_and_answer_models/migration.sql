-- CreateTable
CREATE TABLE "Problem" (
    "id" SERIAL NOT NULL,
    "title_ja" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "description_ja" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "answerOptions_ja" JSONB NOT NULL,
    "answerOptions_en" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation_ja" TEXT NOT NULL,
    "explanation_en" TEXT NOT NULL,
    "programLines_ja" TEXT[],
    "programLines_en" TEXT[],
    "initialVariables" JSONB NOT NULL,
    "logicType" TEXT NOT NULL,
    "options" JSONB,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,
    "userSelectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
