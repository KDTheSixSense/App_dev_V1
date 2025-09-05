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
  await seedProblems(prisma);
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
