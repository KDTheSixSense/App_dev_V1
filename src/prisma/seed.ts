import { PrismaClient } from '@prisma/client';
import { seedMasterData } from './seed/master-data';
import { seedUsersAndGroups } from './seed/users-groups-data';
import { seedProblems } from './seed/questions';
import { runOperations } from './seed/run-operations';

const prisma = new PrismaClient();

async function main() {
  console.log(`🚀 Start seeding ...`);

  // 各シーディング処理を順番に呼び出す
  await seedMasterData(prisma);
  await seedUsersAndGroups(prisma);
  
  // 3. 作成者となるユーザーを取得
  // (users-groups-data.ts で作成される 'alice@example.com' を使用)
  const creatorUser = await prisma.user.findUnique({
    where: { email: 'alice@example.com' },
  });

  if (!creatorUser) {
    console.error('❌ Creator user (alice@example.com) not found. Aborting problem seed.');
    return;
  }
  await seedProblems(prisma);  
  console.log(`👤 Using user "${creatorUser.username}" (ID: ${creatorUser.id}) as creator.`);
  await runOperations(prisma);

  console.log('✅ Seeding finished.');
}

main()
  .catch(e => {
    console.error(`❌ Seeding failed:`, e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log(`\n🔌 Disconnected from database.`);
  });
