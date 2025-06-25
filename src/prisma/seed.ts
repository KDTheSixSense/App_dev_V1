// prisma/seed.ts
import { Prisma, PrismaClient } from '@prisma/client';
// 実際のアプリケーションでは、パスワードハッシュ化ライブラリをインポートします
// 例: import bcrypt from 'bcrypt';

// ★重要★ あなたの環境の `problems.ts` ファイルへのパスが正しいか確認してください
import { problems as localProblems } from '../app/(main)/issue_list/basic_info_b_problem/data/problems'; 

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
      
      // ★重要★ ロジック（関数）の代わりに、その種類を示す文字列を保存します
      logicType: p.id === '1' ? 'VARIABLE_SWAP' : (p.id === '2' ? 'FIZZ_BUZZ' : 'ARRAY_SUM'),
    };

    // 変換したデータを使って、データベースに新しい問題を作成します
    const problem = await prisma.problem.create({
      data: problemDataForDB,
    });
    console.log(`✅ Created problem: "${problem.title_ja}" (ID: ${problem.id})`);
  }

  console.log(`\n🎉 Seeding finished successfully.`);
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