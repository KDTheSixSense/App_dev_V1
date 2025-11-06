"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const master_data_1 = require("./seed/master-data");
const users_groups_data_1 = require("./seed/users-groups-data");
const questions_1 = require("./seed/questions");
const run_operations_1 = require("./seed/run-operations");
const event_difficulty_data_1 = require("./seed/event-difficulty-data");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log(`🚀 Start seeding ...`);
    // 各シーディング処理を順番に呼び出す
    await (0, master_data_1.seedMasterData)(prisma);
    await (0, event_difficulty_data_1.seedEventDifficulty)(prisma);
    await (0, users_groups_data_1.seedUsersAndGroups)(prisma);
    await (0, questions_1.seedProblems)(prisma);
    await (0, run_operations_1.runOperations)(prisma);
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
