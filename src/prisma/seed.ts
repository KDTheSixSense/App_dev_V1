// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
// 実際のアプリケーションでは、パスワードハッシュ化ライブラリをインポートします
// 例: import bcrypt from 'bcrypt';

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
}

// シーディングスクリプトの実行とエラーハンドリング
main()
  .catch(e => {
    console.error(`❌ Seeding failed:`, e);
    process.exit(1); // エラーでプロセスを終了
  })
  .finally(async () => {
    await prisma.$disconnect(); // データベース接続を閉じる
    console.log(`🔌 Disconnected from database.`);
  });