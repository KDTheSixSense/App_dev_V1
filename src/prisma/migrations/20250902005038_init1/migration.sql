-- CreateTable
CREATE TABLE "SelectProblem" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "explanation" TEXT,
    "answerOptions" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "difficultyId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelectProblem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SelectProblem" ADD CONSTRAINT "SelectProblem_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "Difficulty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectProblem" ADD CONSTRAINT "SelectProblem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectProblem" ADD CONSTRAINT "SelectProblem_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
