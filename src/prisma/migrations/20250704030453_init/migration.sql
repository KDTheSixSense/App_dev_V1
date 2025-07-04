-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "hash" TEXT,
    "username" TEXT,
    "year" INTEGER,
    "class" INTEGER,
    "birth" DATE,
    "resetPasswordToken" TEXT,
    "resetPasswordTokenExpiry" TIMESTAMP(3),
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "continuouslogin" INTEGER,
    "totallogin" INTEGER DEFAULT 0,
    "lastlogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer_Algorithm" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "text" TEXT,

    CONSTRAINT "Answer_Algorithm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questions_Algorithm" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "explanation" TEXT,
    "programLines" TEXT,
    "answerOptions" TEXT,
    "correctAnswer" TEXT,
    "language_id" INTEGER NOT NULL,
    "initialVariable" JSONB NOT NULL,
    "logictype" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "image" TEXT,
    "subjectId" INTEGER NOT NULL,
    "difficultyId" INTEGER NOT NULL,

    CONSTRAINT "Questions_Algorithm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questions" (
    "id" SERIAL NOT NULL,
    "language_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "genreid" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answerid" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "year" TIMESTAMP(3),
    "explain" TEXT,
    "image" TEXT,
    "difficultyid" INTEGER NOT NULL,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "genre" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answerd_Genre_Table" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "Answer_IT" INTEGER NOT NULL,
    "Answer_Basic_A" INTEGER NOT NULL,
    "Answer_Basic_B" INTEGER NOT NULL,
    "Answer_Applied_Am" INTEGER NOT NULL,
    "Answer_Applied_Pm" INTEGER NOT NULL,
    "Answer_Info_Test" INTEGER NOT NULL,
    "Answer_Python" INTEGER NOT NULL,
    "Answer_Java" INTEGER NOT NULL,

    CONSTRAINT "Answerd_Genre_Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coding" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sample_case" TEXT NOT NULL,
    "testcase_id" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "explain" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "xpid" INTEGER NOT NULL,

    CONSTRAINT "Coding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test_Case" (
    "id" SERIAL NOT NULL,
    "testcase" TEXT NOT NULL,

    CONSTRAINT "Test_Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answers" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "Answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_Answer_History" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "answerd_genre_id" INTEGER NOT NULL,
    "user_selectedanswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "term" TEXT NOT NULL,
    "year" TIMESTAMP(3) NOT NULL,
    "Answer_Timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_Answer_History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubjectProgress" (
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "user_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,

    CONSTRAINT "UserSubjectProgress_pkey" PRIMARY KEY ("user_id","subject_id")
);

-- CreateTable
CREATE TABLE "Difficulty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,

    CONSTRAINT "Difficulty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Groups" (
    "id" SERIAL NOT NULL,
    "groupname" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "Groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Groups_User" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "admin_flg" BOOLEAN NOT NULL,

    CONSTRAINT "Groups_User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission_Files_Table" (
    "id" SERIAL NOT NULL,
    "submissionid" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_Files_Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "groupid" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submissions" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "userid" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "codingid" INTEGER NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Status_Kohaku" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "hungerlevel" INTEGER NOT NULL,

    CONSTRAINT "Status_Kohaku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Degree" (
    "id" SERIAL NOT NULL,
    "degree" TEXT NOT NULL,

    CONSTRAINT "Degree_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_genre_key" ON "Genre"("genre");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_name_key" ON "Difficulty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Groups_groupname_key" ON "Groups"("groupname");

-- CreateIndex
CREATE UNIQUE INDEX "Degree_degree_key" ON "Degree"("degree");

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer_Algorithm" ADD CONSTRAINT "Answer_Algorithm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer_Algorithm" ADD CONSTRAINT "Answer_Algorithm_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions_Algorithm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions_Algorithm" ADD CONSTRAINT "Questions_Algorithm_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions_Algorithm" ADD CONSTRAINT "Questions_Algorithm_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "Difficulty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions_Algorithm" ADD CONSTRAINT "Questions_Algorithm_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_difficultyid_fkey" FOREIGN KEY ("difficultyid") REFERENCES "Difficulty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answerd_Genre_Table" ADD CONSTRAINT "Answerd_Genre_Table_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answers" ADD CONSTRAINT "Answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubjectProgress" ADD CONSTRAINT "UserSubjectProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubjectProgress" ADD CONSTRAINT "UserSubjectProgress_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Groups_User" ADD CONSTRAINT "Groups_User_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Groups_User" ADD CONSTRAINT "Groups_User_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_groupid_fkey" FOREIGN KEY ("groupid") REFERENCES "Groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submissions" ADD CONSTRAINT "Submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status_Kohaku" ADD CONSTRAINT "Status_Kohaku_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
