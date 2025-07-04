import { problemLogicsMap } from '@/app/(main)/issue_list/basic_info_b_problem/data/problem-logics';
import type { Problem as AppProblem, AnswerOption, VariablesState } from '@/app/(main)/issue_list/basic_info_b_problem/data/problems';
import { prisma } from './prisma';
import { Questions_Algorithm as DbProblem } from '@prisma/client';

// Define SerializableProblem to explicitly match the output structure
export type SerializableProblem = {
  id: string;
  title: { ja: string; en: string };
  description: { ja: string; en: string };
  programLines: { ja: string[]; en: string[] };
  answerOptions: { ja: AnswerOption[]; en: AnswerOption[] };
  correctAnswer: string;
  explanationText: { ja: string; en: string };
  initialVariables: VariablesState;
  logicType: string; // Mapped from dbProblem.logictype
  traceOptions?: AppProblem['traceOptions']; // Optional, from AppProblem
  difficulty: number; // From dbProblem.difficultyId
  genre: number; // From dbProblem.subjectId
  language: number; // From dbProblem.language_id
};

function transformProblemToSerializable(dbProblem: DbProblem): SerializableProblem | null {
  if (!problemLogicsMap[dbProblem.logictype as keyof typeof problemLogicsMap]) {
    console.error(`Logic for type "${dbProblem.logictype}" not found.`);
    return null;
  }

  let answerOptions: { ja: AnswerOption[]; en: AnswerOption[] } = { ja: [], en: [] };
  if (dbProblem.answerOptions) {
    try {
      const parsed = JSON.parse(dbProblem.answerOptions);
      if (parsed && typeof parsed === 'object' && 'ja' in parsed && 'en' in parsed) {
        answerOptions = parsed;
      } else {
        console.warn('Parsed answerOptions is not in expected format, defaulting to empty arrays.', parsed);
      }
    } catch (e) {
      console.error('Failed to parse answerOptions, defaulting to empty arrays:', e);
    }
  }

  let traceOptions: AppProblem['traceOptions'] = undefined;
  if (dbProblem.options) {
    try {
      const parsed = typeof dbProblem.options === 'string' ? JSON.parse(dbProblem.options) : dbProblem.options;
      if (parsed && typeof parsed === 'object') {
        traceOptions = parsed;
      } else {
        console.warn('Parsed traceOptions is not in expected format, defaulting to undefined.', parsed);
      }
    } catch (e) {
      console.error('Failed to parse traceOptions/options, defaulting to undefined:', e);
    }
  }

  let programLines: { ja: string[]; en: string[] } = { ja: [], en: [] };
  if (dbProblem.programLines) {
    try {
      const parsed = JSON.parse(dbProblem.programLines);
      if (parsed && typeof parsed === 'object' && 'ja' in parsed && 'en' in parsed) {
        programLines = parsed;
      } else {
        console.warn('Parsed programLines is not in expected format, defaulting to empty arrays.', parsed);
      }
    } catch (e) {
      console.error('Failed to parse programLines, defaulting to empty arrays:', e);
    }
  }

  let initialVariables: VariablesState = {};
  if (dbProblem.initialVariable) {
    try {
      const parsed = typeof dbProblem.initialVariable === 'string' ? JSON.parse(dbProblem.initialVariable) : dbProblem.initialVariable;
      if (parsed && typeof parsed === 'object') {
        initialVariables = parsed;
      } else {
        console.warn('Parsed initialVariables is not in expected format, defaulting to empty object.', parsed);
      }
    } catch (e) {
      console.error('Failed to parse initialVariable, defaulting to empty object:', e);
    }
  }

  let explanationText: { ja: string; en: string } = { ja: '', en: '' };
  if (dbProblem.explanation) {
    explanationText = { ja: dbProblem.explanation, en: dbProblem.explanation };
  }

  return {
    id: String(dbProblem.id),
    title: { ja: dbProblem.title, en: dbProblem.title },
    description: { ja: dbProblem.description ?? '', en: dbProblem.description ?? '' },
    programLines: programLines,
    answerOptions: answerOptions,
    correctAnswer: dbProblem.correctAnswer ?? '',
    explanationText: explanationText,
    initialVariables: initialVariables,
    logicType: dbProblem.logictype, // Explicitly map logictype to logicType
    traceOptions: traceOptions,
    difficulty: dbProblem.difficultyId,
    genre: dbProblem.subjectId,
    language: dbProblem.language_id,
  };
}

export async function getProblemForClient(id: number): Promise<SerializableProblem | null> {
  try {
    const problemFromDb = await prisma.questions_Algorithm.findUnique({
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
    const nextProblem = await prisma.questions_Algorithm.findFirst({
        where: { id: { gt: currentId } },
        orderBy: { id: 'asc' },
        select: { id: true }
    });
    return nextProblem ? nextProblem.id : null;
}

export async function getPreviousProblemId(currentId: number): Promise<number | null> {
    const previousProblem = await prisma.questions_Algorithm.findFirst({
        where: { id: { lt: currentId } },
        orderBy: { id: 'desc' },
        select: { id: true }
    });
    return previousProblem ? previousProblem.id : null;
}

export async function getUserProgress(userId: number): Promise<number[]> {
    const userAnswers = await prisma.userAnswer.findMany({
        where: {
            userId: userId,
            isCorrect: true,
        },
        select: {
            questionId: true,
        },
    });
    return userAnswers.map((answer: { questionId: number }) => answer.questionId);
}

export async function saveUserAnswer(userId: number, questionId: number, answer: string, isCorrect: boolean) {
    await prisma.userAnswer.create({
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
    const problemsFromDb = await prisma.questions_Algorithm.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return problemsFromDb
      .map((p: DbProblem) => transformProblemToSerializable(p))
      .filter((p): p is SerializableProblem => p !== null);
  } catch (error) {
    console.error("Failed to fetch problems by IDs:", error);
    return [];
  }
}

export async function getAllProblemIdsAndTitles() {
  try {
    const problems = await prisma.questions_Algorithm.findMany({
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
    return problems.map((p: { id: number; title: string }) => ({ id: p.id, title: p.title }));
  } catch (error) {
    console.error("Failed to fetch all problem IDs and titles:", error);
    return [];
  }
}

export async function getAnswerHistory(userId: number) {
    const answerHistory = await prisma.userAnswer.findMany({
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
    const subjectProgress = await prisma.userSubjectProgress.findMany({
        where: { user_id: userId },
        include: {
            subject: true,
        },
    });
    return subjectProgress;
}

export async function getRanking() {
    const users = await prisma.user.findMany({
        orderBy: {
            xp: 'desc',
        },
        take: 10,
    });
    return users;
}

export async function getUser(userId: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    return user;
}

export async function updateUser(userId: number, data: any) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: data,
    });
    return user;
}

export async function deleteUser(userId: number) {
    await prisma.user.delete({
        where: { id: userId },
    });
}

export async function createUser(data: any) {
    const user = await prisma.user.create({
        data: data,
    });
    return user;
}

export async function getAllUsers() {
    const users = await prisma.user.findMany();
    return users;
}

export async function getAllProblems() {
    const problems = await prisma.questions_Algorithm.findMany();
    return problems;
}

export async function createProblem(data: any) {
    const problem = await prisma.questions_Algorithm.create({
        data: data,
    });
    return problem;
}

export async function updateProblem(problemId: number, data: any) {
    const problem = await prisma.questions_Algorithm.update({
        where: { id: problemId },
        data: data,
    });
    return problem;
}

export async function deleteProblem(problemId: number) {
    await prisma.questions_Algorithm.delete({
        where: { id: problemId },
    });
}

export async function getAllAnswers() {
    const answers = await prisma.userAnswer.findMany();
    return answers;
}

export async function createAnswer(data: any) {
    const answer = await prisma.userAnswer.create({
        data: data,
    });
    return answer;
}

export async function updateAnswer(answerId: number, data: any) {
    const answer = await prisma.userAnswer.update({
        where: { id: answerId },
        data: data,
    });
    return answer;
}

export async function deleteAnswer(answerId: number) {
    await prisma.userAnswer.delete({
        where: { id: answerId },
    });
}

export async function getAllSubjects() {
    const subjects = await prisma.subject.findMany();
    return subjects;
}

export async function createSubject(data: any) {
    const subject = await prisma.subject.create({
        data: data,
    });
    return subject;
}

export async function updateSubject(subjectId: number, data: any) {
    const subject = await prisma.subject.update({
        where: { id: subjectId },
        data: data,
    });
    return subject;
}

export async function deleteSubject(subjectId: number) {
    await prisma.subject.delete({
        where: { id: subjectId },
    });
}

export async function getAllDifficulties() {
    const difficulties = await prisma.difficulty.findMany();
    return difficulties;
}

export async function createDifficulty(data: any) {
    const difficulty = await prisma.difficulty.create({
        data: data,
    });
    return difficulty;
}

export async function updateDifficulty(difficultyId: number, data: any) {
    const difficulty = await prisma.difficulty.update({
        where: { id: difficultyId },
        data: data,
    });
    return difficulty;
}

export async function deleteDifficulty(difficultyId: number) {
    await prisma.difficulty.delete({
        where: { id: difficultyId },
    });
}

export async function getAllUserProgress() {
    const userProgress = await prisma.userSubjectProgress.findMany();
    return userProgress;
}

export async function createUserProgress(data: any) {
    const userProgress = await prisma.userSubjectProgress.create({
        data: data,
    });
    return userProgress;
}

export async function updateUserProgress(userId: number, subjectId: number, data: any) {
    const userProgress = await prisma.userSubjectProgress.update({
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
    await prisma.userSubjectProgress.delete({
        where: {
            user_id_subject_id: {
                user_id: userId,
                subject_id: subjectId,
            },
        },
    });
}

export async function getAllGroups() {
    const groups = await prisma.groups.findMany();
    return groups;
}

export async function createGroup(data: any) {
    const group = await prisma.groups.create({
        data: data,
    });
    return group;
}

export async function updateGroup(groupId: number, data: any) {
    const group = await prisma.groups.update({
        where: { id: groupId },
        data: data,
    });
    return group;
}

export async function deleteGroup(groupId: number) {
    await prisma.groups.delete({
        where: { id: groupId },
    });
}

export async function getAllGroupMembers() {
    const groupMembers = await prisma.groups_User.findMany();
    return groupMembers;
}

export async function createGroupMember(data: any) {
    const groupMember = await prisma.groups_User.create({
        data: data,
    });
    return groupMember;
}

export async function updateGroupMember(groupMemberId: number, data: any) {
    const groupMember = await prisma.groups_User.update({
        where: { id: groupMemberId },
        data: data,
    });
    return groupMember;
}

export async function deleteGroupMember(groupMemberId: number) {
    await prisma.groups_User.delete({
        where: { id: groupMemberId },
    });
}

export async function getAllSubmissions() {
    const submissions = await prisma.submissions.findMany();
    return submissions;
}

export async function createSubmission(data: any) {
    const submission = await prisma.submissions.create({
        data: data,
    });
    return submission;
}

export async function updateSubmission(submissionId: number, data: any) {
    const submission = await prisma.submissions.update({
        where: { id: submissionId },
        data: data,
    });
    return submission;
}

export async function deleteSubmission(submissionId: number) {
    await prisma.submissions.delete({
        where: { id: submissionId },
    });
}

export async function getAllAssignments() {
    const assignments = await prisma.assignment.findMany();
    return assignments;
}

export async function createAssignment(data: any) {
    const assignment = await prisma.assignment.create({
        data: data,
    });
    return assignment;
}

export async function updateAssignment(assignmentId: number, data: any) {
    const assignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: data,
    });
    return assignment;
}

export async function deleteAssignment(assignmentId: number) {
    await prisma.assignment.delete({
        where: { id: assignmentId },
    });
}

export async function getAllSubmissionFiles() {
    const submissionFiles = await prisma.submission_Files_Table.findMany();
    return submissionFiles;
}

export async function createSubmissionFile(data: any) {
    const submissionFile = await prisma.submission_Files_Table.create({
        data: data,
    });
    return submissionFile;
}

export async function updateSubmissionFile(submissionFileId: number, data: any) {
    const submissionFile = await prisma.submission_Files_Table.update({
        where: { id: submissionFileId },
        data: data,
    });
    return submissionFile;
}

export async function deleteSubmissionFile(submissionFileId: number) {
    await prisma.submission_Files_Table.delete({
        where: { id: submissionFileId },
    });
}

export async function getAllDegrees() {
    const degrees = await prisma.degree.findMany();
    return degrees;
}

export async function createDegree(data: any) {
    const degree = await prisma.degree.create({
        data: data,
    });
    return degree;
}

export async function updateDegree(degreeId: number, data: any) {
    const degree = await prisma.degree.update({
        where: { id: degreeId },
        data: data,
    });
    return degree;
}

export async function deleteDegree(degreeId: number) {
    await prisma.degree.delete({
        where: { id: degreeId },
    });
}

export async function getAllKohakuStatuses() {
    const kohakuStatuses = await prisma.status_Kohaku.findMany();
    return kohakuStatuses;
}

export async function createKohakuStatus(data: any) {
    const kohakuStatus = await prisma.status_Kohaku.create({
        data: data,
    });
    return kohakuStatus;
}

export async function updateKohakuStatus(kohakuStatusId: number, data: any) {
    const kohakuStatus = await prisma.status_Kohaku.update({
        where: { id: kohakuStatusId },
        data: data,
    });
    return kohakuStatus;
}

export async function deleteKohakuStatus(kohakuStatusId: number) {
    await prisma.status_Kohaku.delete({
        where: { id: kohakuStatusId },
    });
}

export async function getAllCodings() {
    const codings = await prisma.coding.findMany();
    return codings;
}

export async function createCoding(data: any) {
    const coding = await prisma.coding.create({
        data: data,
    });
    return coding;
}

export async function updateCoding(codingId: number, data: any) {
    const coding = await prisma.coding.update({
        where: { id: codingId },
        data: data,
    });
    return coding;
}

export async function deleteCoding(codingId: number) {
    await prisma.coding.delete({
        where: { id: codingId },
    });
}

export async function getAllTestCases() {
    const testCases = await prisma.test_Case.findMany();
    return testCases;
}

export async function createTestCase(data: any) {
    const testCase = await prisma.test_Case.create({
        data: data,
    });
    return testCase;
}

export async function updateTestCase(testCaseId: number, data: any) {
    const testCase = await prisma.test_Case.update({
        where: { id: testCaseId },
        data: data,
    });
    return testCase;
}

export async function deleteTestCase(testCaseId: number) {
    await prisma.test_Case.delete({
        where: { id: testCaseId },
    });
}

export async function getAllAnswers2() {
    const answers = await prisma.answers.findMany();
    return answers;
}

export async function createAnswer2(data: any) {
    const answer = await prisma.answers.create({
        data: data,
    });
    return answer;
}

export async function updateAnswer2(answerId: number, data: any) {
    const answer = await prisma.answers.update({
        where: { id: answerId },
        data: data,
    });
    return answer;
}

export async function deleteAnswer2(answerId: number) {
    await prisma.answers.delete({
        where: { id: answerId },
    });
}

export async function getAllUserAnswerHistories() {
    const userAnswerHistories = await prisma.user_Answer_History.findMany();
    return userAnswerHistories;
}

export async function createUserAnswerHistory(data: any) {
    const userAnswerHistory = await prisma.user_Answer_History.create({
        data: data,
    });
    return userAnswerHistory;
}

export async function updateUserAnswerHistory(userAnswerHistoryId: number, data: any) {
    const userAnswerHistory = await prisma.user_Answer_History.update({
        where: { id: userAnswerHistoryId },
        data: data,
    });
    return userAnswerHistory;
}

export async function deleteUserAnswerHistory(userAnswerHistoryId: number) {
    await prisma.user_Answer_History.delete({
        where: { id: userAnswerHistoryId },
    });
}

export async function getAllAnswerdGenreTables() {
    const answerdGenreTables = await prisma.answerd_Genre_Table.findMany();
    return answerdGenreTables;
}

export async function createAnswerdGenreTable(data: any) {
    const answerdGenreTable = await prisma.answerd_Genre_Table.create({
        data: data,
    });
    return answerdGenreTable;
}

export async function updateAnswerdGenreTable(answerdGenreTableId: number, data: any) {
    const answerdGenreTable = await prisma.answerd_Genre_Table.update({
        where: { id: answerdGenreTableId },
        data: data,
    });
    return answerdGenreTable;
}

export async function deleteAnswerdGenreTable(answerdGenreTableId: number) {
    await prisma.answerd_Genre_Table.delete({
        where: { id: answerdGenreTableId },
    });
}

export async function getAllAnswerAlgorithms() {
    const answerAlgorithms = await prisma.answer_Algorithm.findMany();
    return answerAlgorithms;
}

export async function createAnswerAlgorithm(data: any) {
    const answerAlgorithm = await prisma.answer_Algorithm.create({
        data: data,
    });
    return answerAlgorithm;
}

export async function updateAnswerAlgorithm(answerAlgorithmId: number, data: any) {
    const answerAlgorithm = await prisma.answer_Algorithm.update({
        where: { id: answerAlgorithmId },
        data: data,
    });
    return answerAlgorithm;
}

export async function deleteAnswerAlgorithm(answerAlgorithmId: number) {
    await prisma.answer_Algorithm.delete({
        where: { id: answerAlgorithmId },
    });
}

export async function getAllQuestionsAlgorithms() {
    const questionsAlgorithms = await prisma.questions_Algorithm.findMany();
    return questionsAlgorithms;
}

export async function createQuestionsAlgorithm(data: any) {
    const questionsAlgorithm = await prisma.questions_Algorithm.create({
        data: data,
    });
    return questionsAlgorithm;
}

export async function updateQuestionsAlgorithm(questionsAlgorithmId: number, data: any) {
    const questionsAlgorithm = await prisma.questions_Algorithm.update({
        where: { id: questionsAlgorithmId },
        data: data,
    });
    return questionsAlgorithm;
}

export async function deleteQuestionsAlgorithm(questionsAlgorithmId: number) {
    await prisma.questions_Algorithm.delete({
        where: { id: questionsAlgorithmId },
    });
}

export async function getAllLanguages() {
    const languages = await prisma.language.findMany();
    return languages;
}

export async function createLanguage(data: any) {
    const language = await prisma.language.create({
        data: data,
    });
    return language;
}

export async function updateLanguage(languageId: number, data: any) {
    const language = await prisma.language.update({
        where: { id: languageId },
        data: data,
    });
    return language;
}

export async function deleteLanguage(languageId: number) {
    await prisma.language.delete({
        where: { id: languageId },
    });
}

export async function getAllGenres() {
    const genres = await prisma.genre.findMany();
    return genres;
}

export async function createGenre(data: any) {
    const genre = await prisma.genre.create({
        data: data,
    });
    return genre;
}

export async function updateGenre(genreId: number, data: any) {
    const genre = await prisma.genre.update({
        where: { id: genreId },
        data: data,
    });
    return genre;
}

export async function deleteGenre(genreId: number) {
    await prisma.genre.delete({
        where: { id: genreId },
    });
}

export async function getAllQuestions() {
    const questions = await prisma.questions_Algorithm.findMany();
    return questions;
}

export async function createQuestion(data: any) {
    const question = await prisma.questions_Algorithm.create({
        data: data,
    });
    return question;
}

export async function updateQuestion(questionId: number, data: any) {
    const question = await prisma.questions_Algorithm.update({
        where: { id: questionId },
        data: data,
    });
    return question;
}

export async function deleteQuestion(questionId: number) {
    await prisma.questions_Algorithm.delete({
        where: { id: questionId },
    });
}