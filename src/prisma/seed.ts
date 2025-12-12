import { PrismaClient } from '@prisma/client';
import { seedMasterData } from './seed/master-data';
import { seedUsersAndGroups } from './seed/users-groups-data';
import { seedProblems } from './seed/questions';
import { runOperations } from './seed/run-operations';
import { seedEventDifficulty } from './seed/event-difficulty-data';
import { seedHistoryDummy } from './seed/history-dummy';
import { seedSchoolFestivalQuestions } from './seed/school_festival_questions';
import { seedSampleSelectionProblems, seedSelectProblemsFromExcel } from './seed-selection-problems';

const prisma = new PrismaClient();

async function main() {
  console.log(`🚀 Start seeding ...`);

  // 各シーディング処理を順番に呼び出す
  await seedMasterData(prisma);
  await seedEventDifficulty(prisma);
  await seedProblems(prisma);
  await seedSchoolFestivalQuestions(prisma);
  await seedSampleSelectionProblems(prisma);
  await seedSelectProblemsFromExcel(prisma);
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

  console.log(`👤 Using user "${creatorUser.username}" (ID: ${creatorUser.id}) as creator.`);

  console.log('Verifying EventDifficulty data...');
  const seededEventDifficulties = await prisma.eventDifficulty.findMany();
  console.log(seededEventDifficulties);

  await runOperations(prisma);

  // History dummy data (Wait for users to be seeded)
  await seedHistoryDummy(prisma);

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
