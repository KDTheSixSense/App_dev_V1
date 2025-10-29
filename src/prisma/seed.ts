import { PrismaClient } from '@prisma/client';
import { seedMasterData } from './seed/master-data';
import { seedUsersAndGroups } from './seed/users-groups-data';
import { seedProblems } from './seed/questions';
import { runOperations } from './seed/run-operations';
import { seedEventDifficulty } from './seed/event-difficulty-data';

const prisma = new PrismaClient();

async function main() {
  console.log(`🚀 Start seeding ...`);

  // 各シーディング処理を順番に呼び出す
  await seedMasterData(prisma);
  await seedProblems(prisma);
  await seedUsersAndGroups(prisma);
  await seedEventDifficulty(prisma);

  console.log('Verifying EventDifficulty data...');
  const seededEventDifficulties = await prisma.eventDifficulty.findMany();
  console.log(seededEventDifficulties);

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
