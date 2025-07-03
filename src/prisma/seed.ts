import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; // bcryptをインポート

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 既存データの削除 (開発時のみ推奨)
  // 依存関係の逆順で削除すると安全です
  await prisma.userSubjectProgress.deleteMany({});
  await prisma.answer_Algorithm.deleteMany({});
  await prisma.userAnswer.deleteMany({});
  await prisma.answerd_Genre_Table.deleteMany({});
  await prisma.user_Answer_History.deleteMany({});
  await prisma.groups_User.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.submissions.deleteMany({});
  await prisma.status_Kohaku.deleteMany({});
  await prisma.submission_Files_Table.deleteMany({});
  await prisma.questions_Algorithm.deleteMany({});
  await prisma.questions.deleteMany({});
  await prisma.coding.deleteMany({});
  await prisma.test_Case.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.language.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.difficulty.deleteMany({});
  await prisma.groups.deleteMany({});
  await prisma.degree.deleteMany({});

  // -------------------------------------------------------------------
  // 1. 依存関係のないモデルからシード
  // -------------------------------------------------------------------

  // Subject
  const subject1 = await prisma.subject.create({
    data: { name: '基本情報技術者試験', description: '情報処理の基礎知識' },
  });
  const subject2 = await prisma.subject.create({
    data: { name: '応用情報技術者試験', description: '情報処理の応用知識' },
  });
  console.log(`Created subjects: ${subject1.name}, ${subject2.name}`);

  // Language
  const langJa = await prisma.language.create({
    data: { title_ja: '日本語', title_en: 'Japanese' },
  });
  const langEn = await prisma.language.create({
    data: { title_ja: '英語', title_en: 'English' },
  });
  console.log(`Created languages: ${langJa.title_ja}, ${langEn.title_ja}`);

  // Genre
  const genreIT = await prisma.genre.create({
    data: { genre: 'ITパスポート' },
  });
  const genreBasicA = await prisma.genre.create({
    data: { genre: '基本情報午前' },
  });
  console.log(`Created genres: ${genreIT.genre}, ${genreBasicA.genre}`);

  // Difficulty
  const diffEasy = await prisma.difficulty.create({
    data: { name: 'Easy', xp: 10 },
  });
  const diffNormal = await prisma.difficulty.create({
    data: { name: 'Normal', xp: 20 },
  });
  const diffHard = await prisma.difficulty.create({
    data: { name: 'Hard', xp: 30 },
  });
  console.log(`Created difficulties: ${diffEasy.name}, ${diffNormal.name}, ${diffHard.name}`);

  // Groups
  const group1 = await prisma.groups.create({
    data: { groupname: '開発チームA', body: 'プロジェクトAの開発メンバー' },
  });
  const group2 = await prisma.groups.create({
    data: { groupname: '学習会B', body: '基本情報技術者試験の学習グループ' },
  });
  console.log(`Created groups: ${group1.groupname}, ${group2.groupname}`);

  // Degree
  const degree1 = await prisma.degree.create({
    data: { degree: '学士' },
  });
  const degree2 = await prisma.degree.create({
    data: { degree: '修士' },
  });
  console.log(`Created degrees: ${degree1.degree}, ${degree2.degree}`);

  // User (パスワードはハッシュ化)
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const hashedPassword2 = await bcrypt.hash('securepass', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'test1@example.com',
      password: hashedPassword1,
      username: 'テストユーザー1',
      year: 2023,
      class: 1,
      birth: new Date('2000-01-01'),
      totallogin: 5,
    },
  });
  const user2 = await prisma.user.create({
    data: {
      email: 'test2@example.com',
      password: hashedPassword2,
      username: 'テストユーザー2',
      year: 2024,
      class: 2,
      birth: new Date('2001-05-15'),
      totallogin: 10,
    },
  });
  console.log(`Created users: ${user1.email}, ${user2.email}`);

  // Coding
  const coding1 = await prisma.coding.create({
    data: {
      title: 'FizzBuzz問題',
      question: '1から100までの数でFizzBuzzを実装せよ。',
      answer: 'console.log("FizzBuzz");',
      sample_case: '15',
      testcase_id: 1,
      image: 'fizzbuzz.png',
      explain: 'FizzBuzzの基本的な実装です。',
      difficulty: 'Easy',
      xpid: 10,
    },
  });
  console.log(`Created coding: ${coding1.title}`);

  // Test_Case
  const testCase1 = await prisma.test_Case.create({
    data: { testcase: '入力: 15, 期待値: FizzBuzz' },
  });
  console.log(`Created test case: ${testCase1.testcase}`);

  // -------------------------------------------------------------------
  // 2. 依存関係のあるモデルをシード
  // -------------------------------------------------------------------

  // Questions_Algorithm
  const qAlgo1 = await prisma.questions_Algorithm.create({
    data: {
      language_id: langJa.id,
      initialVariable: { x: 1, y: 2, z: 3 },
      logictype: 'VARIABLE_SWAP',
      options: { presets: [1, 2, 3] },
      subjectId: subject1.id,
      difficultyId: diffEasy.id,
    },
  });
  console.log(`Created Questions_Algorithm: ${qAlgo1.id}`);

  // Questions
  const q1 = await prisma.questions.create({
    data: {
      language_id: langJa.id,
      genre_id: genreBasicA.id,
      title: '基本情報午前 問1',
      genreid: genreBasicA.id, // genre_idと同じ値を設定
      question: 'これは基本情報午前試験のサンプル問題です。',
      answerid: 1, // 仮の値。UserAnswerが作成されたら更新する
      term: '令和5年春',
      year: new Date('2023-04-01'),
      explain: 'この問題は、基本的な概念を問うものです。',
      image: 'q1.png',
      difficultyid: diffNormal.id,
    },
  });
  console.log(`Created Questions: ${q1.title}`);

  // Answer_Algorithm
  const ansAlgo1 = await prisma.answer_Algorithm.create({
    data: {
      questionId: qAlgo1.id,
      userId: user1.id,
      symbol: 'A',
      isCorrect: true,
      text: '正しいアルゴリズムの回答です。',
    },
  });
  console.log(`Created Answer_Algorithm: ${ansAlgo1.id}`);

  // UserAnswer
  const userAnswer1 = await prisma.userAnswer.create({
    data: {
      userId: user1.id,
      questionId: q1.id,
      answer: '選択肢A',
      isCorrect: true,
    },
  });
  console.log(`Created UserAnswer: ${userAnswer1.id}`);

  // Answerd_Genre_Table
  const answeredGenre1 = await prisma.answerd_Genre_Table.create({
    data: {
      user_id: user1.id,
      Answer_IT: 5,
      Answer_Basic_A: 10,
      Answer_Basic_B: 8,
      Answer_Applied_Am: 7,
      Answer_Applied_Pm: 6,
      Answer_Info_Test: 9,
      Answer_Python: 3,
      Answer_Java: 4,
    },
  });
  console.log(`Created Answerd_Genre_Table: ${answeredGenre1.id}`);

  // User_Answer_History
  const userHistory1 = await prisma.user_Answer_History.create({
    data: {
      user_id: user1.id,
      answerd_genre_id: answeredGenre1.id,
      user_selectedanswer: '選択肢A',
      isCorrect: true,
      term: '令和5年春',
      year: new Date('2023-04-01'),
      Answer_Timestamp: new Date(),
    },
  });
  console.log(`Created User_Answer_History: ${userHistory1.id}`);

  // UserSubjectProgress
  const userProgress1 = await prisma.userSubjectProgress.create({
    data: {
      user_id: user1.id,
      subject_id: subject1.id,
      level: 5,
      xp: 150,
    },
  });
  console.log(`Created UserSubjectProgress: ${userProgress1.user_id}-${userProgress1.subject_id}`);

  // Groups_User
  const groupUser1 = await prisma.groups_User.create({
    data: {
      user_id: user1.id,
      group_id: group1.id,
      admin_flg: true,
    },
  });
  console.log(`Created Groups_User: ${groupUser1.id}`);

  // Assignment
  const assignment1 = await prisma.assignment.create({
    data: {
      groupid: group1.id,
      title: '週次レポート提出',
      description: '今週の進捗を報告してください。',
      due_date: new Date('2025-07-10T23:59:59Z'),
    },
  });
  console.log(`Created Assignment: ${assignment1.title}`);

  // Submissions
  const submission1 = await prisma.submissions.create({
    data: {
      assignment_id: assignment1.id,
      userid: user1.id,
      description: 'レポート提出済み',
      status: '提出済み',
      codingid: coding1.id,
    },
  });
  console.log(`Created Submission: ${submission1.id}`);

  // Status_Kohaku
  const statusKohaku1 = await prisma.status_Kohaku.create({
    data: {
      id: 1, // idは自動増分ではないので明示的に指定
      user_id: user1.id,
      status: '元気',
      hungerlevel: 50,
    },
  });
  console.log(`Created Status_Kohaku: ${statusKohaku1.status}`);

  // Submission_Files_Table (submissionidは外部キーだがリレーション定義がないため、既存のsubmission1.idを使用)
  const submissionFile1 = await prisma.submission_Files_Table.create({
    data: {
      submissionid: submission1.id,
      filename: 'report.pdf',
      filepath: '/uploads/report.pdf',
      filesize: 1024,
    },
  });
  console.log(`Created Submission_Files_Table: ${submissionFile1.filename}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
