"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const master_data_1 = require("./seed/master-data");
const users_groups_data_1 = require("./seed/users-groups-data");
const questions_1 = require("./seed/questions");
const run_operations_1 = require("./seed/run-operations");
const event_difficulty_data_1 = require("./seed/event-difficulty-data");
const history_dummy_1 = require("./seed/history-dummy");
const school_festival_questions_1 = require("./seed/school_festival_questions");
const seed_selection_problems_1 = require("./seed-selection-problems");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log(`🚀 Start seeding ...`);
    // 各シーディング処理を順番に呼び出す
    await (0, master_data_1.seedMasterData)(prisma);
    await (0, event_difficulty_data_1.seedEventDifficulty)(prisma);
    await (0, questions_1.seedProblems)(prisma);
    await (0, school_festival_questions_1.seedSchoolFestivalQuestions)(prisma);
    await (0, seed_selection_problems_1.seedSampleSelectionProblems)(prisma);
    await (0, seed_selection_problems_1.seedSelectProblemsFromExcel)(prisma);
    await (0, users_groups_data_1.seedUsersAndGroups)(prisma);
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
    await (0, run_operations_1.runOperations)(prisma);
    // History dummy data (Wait for users to be seeded)
    await (0, history_dummy_1.seedHistoryDummy)(prisma);
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
