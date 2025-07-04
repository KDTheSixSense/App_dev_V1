
import { problemLogicsMap } from '@/app/(main)/issue_list/basic_info_b_problem/data/problem-logics';
import type { Problem as AppProblem, AnswerOption } from '@/app/(main)/issue_list/basic_info_b_problem/data/problems';
import { prisma } from './prisma';
import { Questions_Algorithm as DbProblem } from '@prisma/client';

export type SerializableProblem = Omit<AppProblem, 'traceLogic' | 'calculateNextLine'>;

function transformProblemToSerializable(dbProblem: DbProblem): SerializableProblem | null {
  if (!problemLogicsMap[dbProblem.logictype as keyof typeof problemLogicsMap]) {
    console.error(`Logic for type "${dbProblem.logictype}" not found.`);
    return null;
  }

  const answerOptions_ja = dbProblem.answerOptions_ja as unknown as AnswerOption[];
  const answerOptions_en = dbProblem.answerOptions_en as unknown as AnswerOption[];
  const traceOptions = dbProblem.options as { presets?: number[] } | null;

  return {
    id: dbProblem.id.toString(),
    title: { ja: dbProblem.title_ja, en: dbProblem.title_en },
    description: { ja: dbProblem.description_ja, en: dbProblem.description_en },
    programLines: { ja: dbProblem.programLines_ja, en: dbProblem.programLines_en },
    answerOptions: { ja: answerOptions_ja, en: answerOptions_en },
    correctAnswer: dbProblem.correctAnswer,
    explanationText: { ja: dbProblem.explanation_ja, en: dbProblem.explanation_en },
    initialVariables: dbProblem.initialVariable as AppProblem['initialVariables'],
    traceOptions: (traceOptions && traceOptions.presets) ? { presets: traceOptions.presets } : undefined,
    logicType: dbProblem.logictype,
  };
}

export async function getProblemForClient(id: number): Promise<SerializableProblem | null> {
  try {
    const problemFromDb = await prisma.Questions_Algorithm.findUnique({
      where: { id: id },
    });

    if (!problemFromDb) {
      return null;
    }

    return transformProblemToSerializable(problemFromDb);

  } catch (error) {
    console.error("Failed to fetch problem:", error);
    return null;
  }
}

export async function getNextProblemId(currentId: number): Promise<number | null> {
    const nextProblem = await prisma.Questions_Algorithm.findFirst({
        where: { id: { gt: currentId } },
        orderBy: { id: 'asc' },
        select: { id: true }
    });
    return nextProblem ? nextProblem.id : null;
}

export async function getPreviousProblemId(currentId: number): Promise<number | null> {
    const previousProblem = await prisma.Questions_Algorithm.findFirst({
        where: { id: { lt: currentId } },
        orderBy: { id: 'desc' },
        select: { id: true }
    });
    return previousProblem ? previousProblem.id : null;
}

export async function getUserProgress(userId: number): Promise<number[]> {
    const userAnswers = await prisma.UserAnswer.findMany({
        where: {
            userId: userId,
            isCorrect: true,
        },
        select: {
            questionId: true,
        },
    });
    return userAnswers.map(answer => answer.questionId);
}

export async function saveUserAnswer(userId: number, questionId: number, answer: string, isCorrect: boolean) {
    await prisma.UserAnswer.create({
        data: {
            userId: userId,
            questionId: questionId,
            answer: answer,
            isCorrect: isCorrect,
        },
    });
}

export async function getProblemsByIds(ids: number[]): Promise<SerializableProblem[]> {
  if (ids.length === 0) {
    return [];
  }

  try {
    const problemsFromDb = await prisma.Questions_Algorithm.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return problemsFromDb.map(transformProblemToSerializable).filter((p): p is SerializableProblem => p !== null);
  } catch (error) {
    console.error("Failed to fetch problems by IDs:", error);
    return [];
  }
}

export async function getAllProblemIdsAndTitles() {
  try {
    const problems = await prisma.Questions_Algorithm.findMany({
      select: {
        id: true,
        language: {
            select: {
                title_ja: true,
            }
        }
      },
      orderBy: {
        id: 'asc',
      },
    });
    return problems.map(p => ({ id: p.id, title: p.language.title_ja }));
  } catch (error) {
    console.error("Failed to fetch all problem IDs and titles:", error);
    return [];
  }
}

export async function getAnswerHistory(userId: number) {
    const answerHistory = await prisma.UserAnswer.findMany({
        where: { userId: userId },
        include: {
            question: true,
        },
        orderBy: {
            answeredAt: 'desc',
        },
    });
    return answerHistory;
}

export async function getSubjectProgress(userId: number) {
    const subjectProgress = await prisma.UserSubjectProgress.findMany({
        where: { user_id: userId },
        include: {
            subject: true,
        },
    });
    return subjectProgress;
}

export async function getRanking() {
    const users = await prisma.User.findMany({
        orderBy: {
            xp: 'desc',
        },
        take: 10,
    });
    return users;
}

export async function getUser(userId: number) {
    const user = await prisma.User.findUnique({
        where: { id: userId },
    });
    return user;
}

export async function updateUser(userId: number, data: any) {
    const user = await prisma.User.update({
        where: { id: userId },
        data: data,
    });
    return user;
}

export async function deleteUser(userId: number) {
    await prisma.User.delete({
        where: { id: userId },
    });
}

export async function createUser(data: any) {
    const user = await prisma.User.create({
        data: data,
    });
    return user;
}

export async function getAllUsers() {
    const users = await prisma.User.findMany();
    return users;
}

export async function getAllProblems() {
    const problems = await prisma.Questions.findMany();
    return problems;
}

export async function createProblem(data: any) {
    const problem = await prisma.Questions.create({
        data: data,
    });
    return problem;
}

export async function updateProblem(problemId: number, data: any) {
    const problem = await prisma.Questions.update({
        where: { id: problemId },
        data: data,
    });
    return problem;
}

export async function deleteProblem(problemId: number) {
    await prisma.Questions.delete({
        where: { id: problemId },
    });
}

export async function getAllAnswers() {
    const answers = await prisma.UserAnswer.findMany();
    return answers;
}

export async function createAnswer(data: any) {
    const answer = await prisma.UserAnswer.create({
        data: data,
    });
    return answer;
}

export async function updateAnswer(answerId: number, data: any) {
    const answer = await prisma.UserAnswer.update({
        where: { id: answerId },
        data: data,
    });
    return answer;
}

export async function deleteAnswer(answerId: number) {
    await prisma.UserAnswer.delete({
        where: { id: answerId },
    });
}

export async function getAllSubjects() {
    const subjects = await prisma.Subject.findMany();
    return subjects;
}

export async function createSubject(data: any) {
    const subject = await prisma.Subject.create({
        data: data,
    });
    return subject;
}

export async function updateSubject(subjectId: number, data: any) {
    const subject = await prisma.Subject.update({
        where: { id: subjectId },
        data: data,
    });
    return subject;
}

export async function deleteSubject(subjectId: number) {
    await prisma.Subject.delete({
        where: { id: subjectId },
    });
}

export async function getAllDifficulties() {
    const difficulties = await prisma.Difficulty.findMany();
    return difficulties;
}

export async function createDifficulty(data: any) {
    const difficulty = await prisma.Difficulty.create({
        data: data,
    });
    return difficulty;
}

export async function updateDifficulty(difficultyId: number, data: any) {
    const difficulty = await prisma.Difficulty.update({
        where: { id: difficultyId },
        data: data,
    });
    return difficulty;
}

export async function deleteDifficulty(difficultyId: number) {
    await prisma.Difficulty.delete({
        where: { id: difficultyId },
    });
}

export async function getAllUserProgress() {
    const userProgress = await prisma.UserSubjectProgress.findMany();
    return userProgress;
}

export async function createUserProgress(data: any) {
    const userProgress = await prisma.UserSubjectProgress.create({
        data: data,
    });
    return userProgress;
}

export async function updateUserProgress(userId: number, subjectId: number, data: any) {
    const userProgress = await prisma.UserSubjectProgress.update({
        where: {
            user_id_subject_id: {
                user_id: userId,
                subject_id: subjectId,
            },
        },
        data: data,
    });
    return userProgress;
}

export async function deleteUserProgress(userId: number, subjectId: number) {
    await prisma.UserSubjectProgress.delete({
        where: {
            user_id_subject_id: {
                user_id: userId,
                subject_id: subjectId,
            },
        },
    });
}

export async function getAllGroups() {
    const groups = await prisma.Groups.findMany();
    return groups;
}

export async function createGroup(data: any) {
    const group = await prisma.Groups.create({
        data: data,
    });
    return group;
}

export async function updateGroup(groupId: number, data: any) {
    const group = await prisma.Groups.update({
        where: { id: groupId },
        data: data,
    });
    return group;
}

export async function deleteGroup(groupId: number) {
    await prisma.Groups.delete({
        where: { id: groupId },
    });
}

export async function getAllGroupMembers() {
    const groupMembers = await prisma.Groups_User.findMany();
    return groupMembers;
}

export async function createGroupMember(data: any) {
    const groupMember = await prisma.Groups_User.create({
        data: data,
    });
    return groupMember;
}

export async function updateGroupMember(groupMemberId: number, data: any) {
    const groupMember = await prisma.Groups_User.update({
        where: { id: groupMemberId },
        data: data,
    });
    return groupMember;
}

export async function deleteGroupMember(groupMemberId: number) {
    await prisma.Groups_User.delete({
        where: { id: groupMemberId },
    });
}

export async function getAllSubmissions() {
    const submissions = await prisma.Submissions.findMany();
    return submissions;
}

export async function createSubmission(data: any) {
    const submission = await prisma.Submissions.create({
        data: data,
    });
    return submission;
}

export async function updateSubmission(submissionId: number, data: any) {
    const submission = await prisma.Submissions.update({
        where: { id: submissionId },
        data: data,
    });
    return submission;
}

export async function deleteSubmission(submissionId: number) {
    await prisma.Submissions.delete({
        where: { id: submissionId },
    });
}

export async function getAllAssignments() {
    const assignments = await prisma.Assignment.findMany();
    return assignments;
}

export async function createAssignment(data: any) {
    const assignment = await prisma.Assignment.create({
        data: data,
    });
    return assignment;
}

export async function updateAssignment(assignmentId: number, data: any) {
    const assignment = await prisma.Assignment.update({
        where: { id: assignmentId },
        data: data,
    });
    return assignment;
}

export async function deleteAssignment(assignmentId: number) {
    await prisma.Assignment.delete({
        where: { id: assignmentId },
    });
}

export async function getAllSubmissionFiles() {
    const submissionFiles = await prisma.Submission_Files_Table.findMany();
    return submissionFiles;
}

export async function createSubmissionFile(data: any) {
    const submissionFile = await prisma.Submission_Files_Table.create({
        data: data,
    });
    return submissionFile;
}

export async function updateSubmissionFile(submissionFileId: number, data: any) {
    const submissionFile = await prisma.Submission_Files_Table.update({
        where: { id: submissionFileId },
        data: data,
    });
    return submissionFile;
}

export async function deleteSubmissionFile(submissionFileId: number) {
    await prisma.Submission_Files_Table.delete({
        where: { id: submissionFileId },
    });
}

export async function getAllDegrees() {
    const degrees = await prisma.Degree.findMany();
    return degrees;
}

export async function createDegree(data: any) {
    const degree = await prisma.Degree.create({
        data: data,
    });
    return degree;
}

export async function updateDegree(degreeId: number, data: any) {
    const degree = await prisma.Degree.update({
        where: { id: degreeId },
        data: data,
    });
    return degree;
}

export async function deleteDegree(degreeId: number) {
    await prisma.Degree.delete({
        where: { id: degreeId },
    });
}

export async function getAllKohakuStatuses() {
    const kohakuStatuses = await prisma.Status_Kohaku.findMany();
    return kohakuStatuses;
}

export async function createKohakuStatus(data: any) {
    const kohakuStatus = await prisma.Status_Kohaku.create({
        data: data,
    });
    return kohakuStatus;
}

export async function updateKohakuStatus(kohakuStatusId: number, data: any) {
    const kohakuStatus = await prisma.Status_Kohaku.update({
        where: { id: kohakuStatusId },
        data: data,
    });
    return kohakuStatus;
}

export async function deleteKohakuStatus(kohakuStatusId: number) {
    await prisma.Status_Kohaku.delete({
        where: { id: kohakuStatusId },
    });
}

export async function getAllCodings() {
    const codings = await prisma.Coding.findMany();
    return codings;
}

export async function createCoding(data: any) {
    const coding = await prisma.Coding.create({
        data: data,
    });
    return coding;
}

export async function updateCoding(codingId: number, data: any) {
    const coding = await prisma.Coding.update({
        where: { id: codingId },
        data: data,
    });
    return coding;
}

export async function deleteCoding(codingId: number) {
    await prisma.Coding.delete({
        where: { id: codingId },
    });
}

export async function getAllTestCases() {
    const testCases = await prisma.Test_Case.findMany();
    return testCases;
}

export async function createTestCase(data: any) {
    const testCase = await prisma.Test_Case.create({
        data: data,
    });
    return testCase;
}

export async function updateTestCase(testCaseId: number, data: any) {
    const testCase = await prisma.Test_Case.update({
        where: { id: testCaseId },
        data: data,
    });
    return testCase;
}

export async function deleteTestCase(testCaseId: number) {
    await prisma.Test_Case.delete({
        where: { id: testCaseId },
    });
}

export async function getAllAnswers2() {
    const answers = await prisma.Answers.findMany();
    return answers;
}

export async function createAnswer2(data: any) {
    const answer = await prisma.Answers.create({
        data: data,
    });
    return answer;
}

export async function updateAnswer2(answerId: number, data: any) {
    const answer = await prisma.Answers.update({
        where: { id: answerId },
        data: data,
    });
    return answer;
}

export async function deleteAnswer2(answerId: number) {
    await prisma.Answers.delete({
        where: { id: answerId },
    });
}

export async function getAllUserAnswerHistories() {
    const userAnswerHistories = await prisma.User_Answer_History.findMany();
    return userAnswerHistories;
}

export async function createUserAnswerHistory(data: any) {
    const userAnswerHistory = await prisma.User_Answer_History.create({
        data: data,
    });
    return userAnswerHistory;
}

export async function updateUserAnswerHistory(userAnswerHistoryId: number, data: any) {
    const userAnswerHistory = await prisma.User_Answer_History.update({
        where: { id: userAnswerHistoryId },
        data: data,
    });
    return userAnswerHistory;
}

export async function deleteUserAnswerHistory(userAnswerHistoryId: number) {
    await prisma.User_Answer_History.delete({
        where: { id: userAnswerHistoryId },
    });
}

export async function getAllAnswerdGenreTables() {
    const answerdGenreTables = await prisma.Answerd_Genre_Table.findMany();
    return answerdGenreTables;
}

export async function createAnswerdGenreTable(data: any) {
    const answerdGenreTable = await prisma.Answerd_Genre_Table.create({
        data: data,
    });
    return answerdGenreTable;
}

export async function updateAnswerdGenreTable(answerdGenreTableId: number, data: any) {
    const answerdGenreTable = await prisma.Answerd_Genre_Table.update({
        where: { id: answerdGenreTableId },
        data: data,
    });
    return answerdGenreTable;
}

export async function deleteAnswerdGenreTable(answerdGenreTableId: number) {
    await prisma.Answerd_Genre_Table.delete({
        where: { id: answerdGenreTableId },
    });
}

export async function getAllAnswerAlgorithms() {
    const answerAlgorithms = await prisma.Answer_Algorithm.findMany();
    return answerAlgorithms;
}

export async function createAnswerAlgorithm(data: any) {
    const answerAlgorithm = await prisma.Answer_Algorithm.create({
        data: data,
    });
    return answerAlgorithm;
}

export async function updateAnswerAlgorithm(answerAlgorithmId: number, data: any) {
    const answerAlgorithm = await prisma.Answer_Algorithm.update({
        where: { id: answerAlgorithmId },
        data: data,
    });
    return answerAlgorithm;
}

export async function deleteAnswerAlgorithm(answerAlgorithmId: number) {
    await prisma.Answer_Algorithm.delete({
        where: { id: answerAlgorithmId },
    });
}

export async function getAllQuestionsAlgorithms() {
    const questionsAlgorithms = await prisma.Questions_Algorithm.findMany();
    return questionsAlgorithms;
}

export async function createQuestionsAlgorithm(data: any) {
    const questionsAlgorithm = await prisma.Questions_Algorithm.create({
        data: data,
    });
    return questionsAlgorithm;
}

export async function updateQuestionsAlgorithm(questionsAlgorithmId: number, data: any) {
    const questionsAlgorithm = await prisma.Questions_Algorithm.update({
        where: { id: questionsAlgorithmId },
        data: data,
    });
    return questionsAlgorithm;
}

export async function deleteQuestionsAlgorithm(questionsAlgorithmId: number) {
    await prisma.Questions_Algorithm.delete({
        where: { id: questionsAlgorithmId },
    });
}

export async function getAllLanguages() {
    const languages = await prisma.Language.findMany();
    return languages;
}

export async function createLanguage(data: any) {
    const language = await prisma.Language.create({
        data: data,
    });
    return language;
}

export async function updateLanguage(languageId: number, data: any) {
    const language = await prisma.Language.update({
        where: { id: languageId },
        data: data,
    });
    return language;
}

export async function deleteLanguage(languageId: number) {
    await prisma.Language.delete({
        where: { id: languageId },
    });
}

export async function getAllGenres() {
    const genres = await prisma.Genre.findMany();
    return genres;
}

export async function createGenre(data: any) {
    const genre = await prisma.Genre.create({
        data: data,
    });
    return genre;
}

export async function updateGenre(genreId: number, data: any) {
    const genre = await prisma.Genre.update({
        where: { id: genreId },
        data: data,
    });
    return genre;
}

export async function deleteGenre(genreId: number) {
    await prisma.Genre.delete({
        where: { id: genreId },
    });
}

export async function getAllQuestions() {
    const questions = await prisma.Questions.findMany();
    return questions;
}

export async function createQuestion(data: any) {
    const question = await prisma.Questions.create({
        data: data,
    });
    return question;
}

export async function updateQuestion(questionId: number, data: any) {
    const question = await prisma.Questions.update({
        where: { id: questionId },
        data: data,
    });
    return question;
}

export async function deleteQuestion(questionId: number) {
    await prisma.Questions.delete({
        where: { id: questionId },
    });
}
