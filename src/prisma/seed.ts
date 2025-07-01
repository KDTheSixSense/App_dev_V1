// prisma/seed.ts
import { Prisma, PrismaClient } from '@prisma/client';
// 実際のアプリケーションでは、パスワードハッシュ化ライブラリをインポートします
// 例: import bcrypt from 'bcrypt';

// ★重要★ あなたの環境の `problems.ts` ファイルへのパスが正しいか確認してください
import { problems as localProblems } from '../app/(main)/issue_list/basic_info_b_problem/data/problems'; 

import { addXp } from '../lib/action'; // 作成したaddXp関数をインポート


// PrismaClientを初期化
const prisma = new PrismaClient();

async function main() {
  console.log(`🚀 Start seeding ...`);

  // 既存のユーザーデータをクリーンアップする場合（開発環境のみで推奨）
  // await prisma.user.deleteMany({});
  // console.log("🗑️ Cleared existing user data.");

  // シーディングするユーザーデータ
  const usersToSeed = [
    {
      email: 'alice@example.com',
      password: 'password123', // ⚠️ 実際にはハッシュ化する
      username: 'Alice Smith',
      year: 2020,
      class: 1,
      birth: new Date('2002-04-15'), // Null不可なので必ず日付を指定
    },
    {
      email: 'bob@example.com',
      password: 'securepassword', // ⚠️ 実際にはハッシュ化する
      username: 'Bob Johnson',
      year: 2021,
      class: 2,
      birth: new Date('2003-08-20'),
    },
    {
      email: 'charlie@example.com',
      password: 'anotherpassword', // ⚠️ 実際にはハッシュ化する
      username: 'Charlie Brown',
      year: 2020,
      class: 3,
      birth: new Date('2002-11-05'),
    },
    {
      id: 9999, // 特別なユーザーIDを設定
      email: 'GodOfGod@example.com',
      password: 'godisgod', // ⚠️ 実際にはハッシュ化する
      username: 'God',
      level: 9999, // 特別なユーザーとしてレベルを設定
      xp: 9999999, // 特別なユーザーとしてXPを設定
    },
  ];

  // 各ユーザーデータをデータベースに挿入または更新
  for (const userData of usersToSeed) {
    // ⚠️ パスワードをハッシュ化する処理をここに追加してください
    // 例: const hashedPassword = await bcrypt.hash(userData.password, 10);
    // userData.password = hashedPassword; // ハッシュ化されたパスワードで上書き

    const user = await prisma.user.upsert({
      where: { email: userData.email }, // emailで既存ユーザーを検索
      update: userData, // 既存ユーザーがいれば更新
      create: userData, // 既存ユーザーがいなければ新規作成
    });
    console.log(`✅ Upserted user with ID: ${user.id} and email: ${user.email}`);
  }

  console.log(`🎉 Seeding finished successfully.`);
  console.log(`\n🌱 Seeding problems...`);

  // --- 既存の問題・解答データを一度リセットします ---
  // これにより、何度seedを実行してもデータが重複せず、常に最新の状態に保たれます。
  // 注意: UserAnswerはProblemに依存しているため、必ず先に削除する必要があります。
  if (await prisma.userAnswer.count() > 0) {
    await prisma.userAnswer.deleteMany();
    console.log("🗑️ Cleared existing user answer data.");
  }
  if (await prisma.problem.count() > 0) {
    await prisma.problem.deleteMany();
    console.log("🗑️ Cleared existing problem data.");
  }

  // --- `problems.ts` のデータをループしてDBに登録します ---
  for (const p of localProblems) {
    // `problems.ts`のデータ形式から、DBスキーマに合わせたオブジェクトを作成します
    const problemDataForDB = {
      // `problems.ts`のidは文字列なので、DBのInt型に合わせて数値に変換します
      id: parseInt(p.id, 10),
      
      // テキスト情報を格納
      title_ja: p.title.ja,
      title_en: p.title.en,
      description_ja: p.description.ja,
      description_en: p.description.en,
      explanation_ja: p.explanationText.ja,
      explanation_en: p.explanationText.en,
      programLines_ja: p.programLines.ja,
      programLines_en: p.programLines.en,
      
      // 正解と、JSON/配列型のカラム
      correctAnswer: p.correctAnswer,
      answerOptions_ja: p.answerOptions.ja as unknown as Prisma.JsonArray,
      answerOptions_en: p.answerOptions.en as unknown as Prisma.JsonArray,
      initialVariables: p.initialVariables as unknown as Prisma.JsonObject,
      options: (p.traceOptions as unknown as Prisma.JsonObject) ?? Prisma.JsonNull,
      
      logicType: p.logicType,
    };

    // 変換したデータを使って、データベースに新しい問題を作成します
    const problem = await prisma.problem.create({
      data: problemDataForDB,
    });
    console.log(`✅ Created problem: "${problem.title_ja}" (ID: ${problem.id})`);
  }

  console.log(`\n🎉 Seeding finished successfully.`);

  // =================================================================
  // Step 1: Difficulty（難易度）のマスターデータを作成する
  // =================================================================
  console.log('Seeding difficulties...');
  const difficultiesToSeed = [
    { id: 1,name: 'やさしい',   xp: 200 },
    { id: 2,name: 'かんたん', xp: 400 },
    { id: 3,name: 'ふつう',   xp: 800 },
    { id: 4,name: 'むずかしい',   xp: 1200 },
    { id: 5,name: '鬼むず',   xp: 2000 },
    { id: 6,name: '基本資格A問題',   xp: 40 },
    { id: 7,name: '基本資格B問題(かんたん)',   xp: 120 },
    { id: 8,name: '基本資格B問題(かんたん)',   xp: 280 },
    { id: 9,name: '応用資格午前問題',   xp: 60 },
    { id: 10,name: '応用資格午後問題',   xp: 1200 },
  ];

  for (const d of difficultiesToSeed) {
    await prisma.difficulty.upsert({
      where: { name: d.name },
      update: {},
      create: { name: d.name, xp: d.xp },
    });
  }
  console.log('✅ Difficulties seeded.');
  
  // =================================================================
  // Step 2: Subject（科目）のマスターデータを作成する
  // =================================================================
  console.log('Seeding subjects...');
  // ... (科目作成のコードは変更なし) ...
  const subjectsToSeed = [ 
    { id: 1, name: 'プログラミング' },
    { id: 2, name: '基本情報A問題'},
    { id: 3, name: '基本情報B問題'},
   ]; // 短縮例
  for (const s of subjectsToSeed) {
    await prisma.subject.upsert({
      where: { id: s.id }, update: {}, create: { id: s.id, name: s.name },
    });
  }
  console.log('✅ Subjects seeded.');

  // =================================================================
  // Step 3: Userデータを作成する
  // =================================================================
  console.log('Seeding users...');
  // ... (ユーザー作成のコードは変更なし) ...
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' }, update: {}, create: { email: 'alice@example.com', password: 'password123', username: 'Alice Smith', birth: new Date('2002-04-15') },
  });
  console.log('✅ Users seeded.');
  
  // =================================================================
  // Step 4: addXpのテストを、難易度名を使って行うように変更
  // =================================================================
  if (alice) {

    await addXp(alice.id, 1, 'むずかしい'); 
  }
  
    console.log('神の生成...');

  // --- GodユーザーのUserSubjectProgressを作成 ---

  // 1. 定数を定義
  const godUserId = 9999;
  const specialLevel = 9999;
  const specialXp = 99999999; // 指示通りの値
  const subjectIds = Array.from({ length: 3 }, (_, i) => i + 1); // [1, 2, ..., 10]

  // 2. 投入するデータを配列として準備
  const progressData = subjectIds.map((subjectId) => ({
    userId: godUserId,
    subjectId: subjectId,
    level: specialLevel,
    xp: specialXp,
  }));

  // 3. createMany を使ってデータを一括で作成
  // skipDuplicates: true は、もし同じ主キー(userId, subjectId)のデータが既に存在する場合にエラーを出さずスキップするオプションです。
  // これにより、シードスクリプトを何回実行しても安全になります。
  await prisma.userSubjectProgress.createMany({
    data: progressData,
    skipDuplicates: true,
  });

  console.log(`神の誕生に成功しました。`);

}

// スクリプトの実行と終了処理
main()
  .catch(e => {
    console.error(`❌ Seeding failed:`, e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log(`\n🔌 Disconnected from database.`);
  });