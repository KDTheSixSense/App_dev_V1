import { PrismaClient } from '@prisma/client';
// 注意: actions.ts はサーバーコンポーネントの機能('use server')に依存しているため、
// seedスクリプトから直接インポートするとエラーになる可能性があります。
// そのため、ロジックをこのファイルに再実装するか、actions.tsから'use server'を含まないヘルパー関数として
// ロジックを切り出して、それをseedとactionの両方から使うのが望ましいです。
// ここでは、簡単のため、元のロジックを参考に一部を再実装します。

async function addXpForSeed(prisma: PrismaClient, user_id: number, subject_id: number, difficulty_id: number) {
  const difficulty = await prisma.difficulty.findUnique({ where: { id: difficulty_id } });
  if (!difficulty) return;
  const xpAmount = difficulty.xp;
  
  await prisma.user.update({
    where: { id: user_id },
    data: { xp: { increment: xpAmount } },
  });
  await prisma.userSubjectProgress.upsert({
    where: { user_id_subject_id: { user_id, subject_id } },
    create: { user_id, subject_id, xp: xpAmount, level: 1 },
    update: { xp: { increment: xpAmount } },
  });
}

export async function runOperations(prisma: PrismaClient) {
  console.log('🧪 Running post-seeding operations...');

  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const godUser = await prisma.user.findUnique({ where: { email: 'GodOfGod@example.com' } });
  
  if (alice) {
    // console.log("🧪 Testing addXp function for Alice...");
    // await addXpForSeed(prisma, alice.id, 1, 1);
    
    // for (let i = 0; i < 40; i++) {
    //   await addXpForSeed(prisma, alice.id, 2, 8); // Basic Info A
    //   await addXpForSeed(prisma, alice.id, 3, 8); // Basic Info B
    // }
    // console.log(`✅ Alice's XP updated.`);
  }

  if (godUser) {
    console.log('👼 Creating God Mode progress...');
    const subjects = await prisma.subject.findMany();
    const progressData = subjects.map((subject) => ({ user_id: godUser.id, subject_id: subject.id, level: 9999, xp: 99999999 }));
    await prisma.userSubjectProgress.createMany({ data: progressData, skipDuplicates: true });
    console.log(`✅ God Mode progress created.`);
  }
}
