-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT,
    "schoolId" INTEGER,
    "year" INTEGER,
    "class" INTEGER,
    "date" DATE NOT NULL,
    "level" INTEGER,
    "xp" INTEGER,
    "sex" TEXT,
    "certificate" BOOLEAN,
    "totalLogin" INTEGER,
    "continuousLogin" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEducation" (
    "id" SERIAL NOT NULL,
    "schoolName" TEXT NOT NULL,

    CONSTRAINT "UserEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Difficulty" (
    "id" SERIAL NOT NULL,
    "difficulty" TEXT NOT NULL,
    "xp" INTEGER,

    CONSTRAINT "Difficulty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Degree" (
    "id" SERIAL NOT NULL,
    "degree" TEXT,

    CONSTRAINT "Degree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "readerId" INTEGER NOT NULL,
    "serverName" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "genreName" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trace" (
    "id" SERIAL NOT NULL,
    "questionAId" INTEGER NOT NULL,
    "line" INTEGER,
    "code" TEXT,
    "content" TEXT,

    CONSTRAINT "Trace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER,
    "difficultyName" TEXT,
    "xpAmount" INTEGER,
    "estimatedTime" TEXT,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionA" (
    "Question_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "imagePath" TEXT,
    "releaseYear" INTEGER,
    "subjectId" INTEGER,

    CONSTRAINT "QuestionA_pkey" PRIMARY KEY ("Question_id")
);

-- CreateTable
CREATE TABLE "QuestionB" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "imagePath" TEXT,
    "difficultyId" INTEGER,
    "traceId" INTEGER,

    CONSTRAINT "QuestionB_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerA" (
    "Answer_id" SERIAL NOT NULL,
    "questionAId" INTEGER,
    "questionAUserId" INTEGER,
    "charValue" TEXT,
    "selectionText" TEXT,
    "isCorrect" BOOLEAN,
    "freeText" TEXT,

    CONSTRAINT "AnswerA_pkey" PRIMARY KEY ("Answer_id")
);

-- CreateTable
CREATE TABLE "AnswerB" (
    "id" SERIAL NOT NULL,
    "questionBId" INTEGER NOT NULL,
    "symbol" TEXT,
    "content" TEXT,
    "isCorrect" BOOLEAN,

    CONSTRAINT "AnswerB_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubjectProgress" (
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "level" INTEGER,
    "xp" INTEGER,

    CONSTRAINT "UserSubjectProgress_pkey" PRIMARY KEY ("userId","subjectId")
);

-- CreateTable
CREATE TABLE "QuestionAGenre" (
    "questionAId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "QuestionAGenre_pkey" PRIMARY KEY ("questionAId","genreId")
);

-- CreateTable
CREATE TABLE "QuestionAUser" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "questionAId" INTEGER NOT NULL,
    "title" TEXT,
    "imagePath" TEXT,
    "releaseTime" TEXT,
    "release" TEXT,

    CONSTRAINT "QuestionAUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAUserGenre" (
    "questionAUserId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "QuestionAUserGenre_pkey" PRIMARY KEY ("questionAUserId","genreId")
);

-- CreateTable
CREATE TABLE "StatusKohaku" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT,
    "huberLevel" INTEGER,
    "response" TEXT,

    CONSTRAINT "StatusKohaku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupUser" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "assiSubmission" BOOLEAN,

    CONSTRAINT "GroupUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupReader" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "GroupReader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "description" TEXT,
    "status" TEXT,
    "codingId" INTEGER,
    "submittedAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionFile" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER,
    "uploadedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Explanation" (
    "id" SERIAL NOT NULL,
    "difficultyId" INTEGER,
    "imagePath" TEXT,
    "content" TEXT,

    CONSTRAINT "Explanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coding" (
    "id" SERIAL NOT NULL,
    "testCaseId" INTEGER,
    "difficultyId" INTEGER,

    CONSTRAINT "Coding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StatusKohaku_userId_key" ON "StatusKohaku"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupUser_userId_groupId_key" ON "GroupUser"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupReader_userId_groupId_key" ON "GroupReader"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_questionAId_fkey" FOREIGN KEY ("questionAId") REFERENCES "QuestionA"("Question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionB"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionA" ADD CONSTRAINT "QuestionA_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionB" ADD CONSTRAINT "QuestionB_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "Difficulty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionB" ADD CONSTRAINT "QuestionB_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "Trace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerA" ADD CONSTRAINT "AnswerA_questionAId_fkey" FOREIGN KEY ("questionAId") REFERENCES "QuestionA"("Question_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerA" ADD CONSTRAINT "AnswerA_questionAUserId_fkey" FOREIGN KEY ("questionAUserId") REFERENCES "QuestionAUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerB" ADD CONSTRAINT "AnswerB_questionBId_fkey" FOREIGN KEY ("questionBId") REFERENCES "QuestionB"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubjectProgress" ADD CONSTRAINT "UserSubjectProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubjectProgress" ADD CONSTRAINT "UserSubjectProgress_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAGenre" ADD CONSTRAINT "QuestionAGenre_questionAId_fkey" FOREIGN KEY ("questionAId") REFERENCES "QuestionA"("Question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAGenre" ADD CONSTRAINT "QuestionAGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAUser" ADD CONSTRAINT "QuestionAUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAUser" ADD CONSTRAINT "QuestionAUser_questionAId_fkey" FOREIGN KEY ("questionAId") REFERENCES "QuestionA"("Question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAUserGenre" ADD CONSTRAINT "QuestionAUserGenre_questionAUserId_fkey" FOREIGN KEY ("questionAUserId") REFERENCES "QuestionAUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAUserGenre" ADD CONSTRAINT "QuestionAUserGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusKohaku" ADD CONSTRAINT "StatusKohaku_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupUser" ADD CONSTRAINT "GroupUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupUser" ADD CONSTRAINT "GroupUser_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupReader" ADD CONSTRAINT "GroupReader_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupReader" ADD CONSTRAINT "GroupReader_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionFile" ADD CONSTRAINT "SubmissionFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Explanation" ADD CONSTRAINT "Explanation_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "Difficulty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coding" ADD CONSTRAINT "Coding_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coding" ADD CONSTRAINT "Coding_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "Difficulty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
