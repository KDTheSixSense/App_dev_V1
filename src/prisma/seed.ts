// prisma/seed.ts
import { Prisma, PrismaClient } from '@prisma/client';
import { addXp } from '../lib/actions';
import path from 'path';
import * as XLSX from 'xlsx';
import { problems as localProblems } from '../app/(main)/issue_list/basic_info_b_problem/data/problems';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`🚀 Start seeding ...`);

  // 1. マスターデータのシーディング
  console.log('Seeding difficulties...');
  const difficultiesToSeed = [
    { id: 1, name: 'やさしい', xp: 200 }, { id: 2, name: 'かんたん', xp: 400 }, { id: 3, name: 'ふつう', xp: 800 }, { id: 4, name: 'むずかしい', xp: 1200 }, { id: 5, name: '鬼むず', xp: 2000 }, { id: 6, name: '基本資格A問題', xp: 40 }, { id: 7, name: '基本資格B問題(かんたん)', xp: 120 }, { id: 8, name: '基本資格B問題(むずかしい)', xp: 280 }, { id: 9, name: '応用資格午前問題', xp: 60 }, { id: 10, name: '応用資格午後問題', xp: 1200 },
  ];
  for (const d of difficultiesToSeed) { await prisma.difficulty.upsert({ where: { id: d.id }, update: {}, create: d }); }
  console.log('✅ Difficulties seeded.');

  console.log('Seeding subjects...');
  const subjectsToSeed = [ { id: 1, name: 'プログラミング' }, { id: 2, name: '基本情報A問題'}, { id: 3, name: '基本情報B問題'} ];
  for (const s of subjectsToSeed) { await prisma.subject.upsert({ where: { id: s.id }, update: {}, create: s }); }
  console.log('✅ Subjects seeded.');
  
  console.log('Seeding genres...');
  const genresToSeed = [ { id: 1, genre: 'テクノロジ系' }, { id: 2, genre: 'マネジメント系' }, { id: 3, genre: 'ストラテジ系' } ];
  for (const g of genresToSeed) { await prisma.genre.upsert({ where: { id: g.id }, update: {}, create: g }); }
  console.log('✅ Genres seeded.');
  
  console.log('Seeding languages...');
  const languagesToSeed = [ { id: 1, name: '日本語' }, { id: 2, name: '擬似言語' } ];
  for (const l of languagesToSeed) { await prisma.language.upsert({ where: { id: l.id }, update: {}, create: l }); }
  console.log('✅ Languages seeded.');

  // 2. 既存データのクリア
  console.log('🗑️ Clearing old data...');
  await prisma.userAnswer.deleteMany({});
  await prisma.answer_Algorithm.deleteMany({});
  await prisma.questions.deleteMany({});
  await prisma.questions_Algorithm.deleteMany({});
  console.log('✅ Old data cleared.');

// 3. Userデータのシーディング
console.log('🌱 Seeding users...');
const usersToSeed = [
  { email: 'alice@example.com', password: 'password123', username: 'Alice Smith', year: 2020, class: 1, birth: new Date('2002-04-15') },
  { email: 'bob@example.com', password: 'securepassword', username: 'Bob Johnson', year: 2021, class: 2, birth: new Date('2003-08-20') },
  { email: 'charlie@example.com', password: 'anotherpassword', username: 'Charlie Brown', year: 2020, class: 3, birth: new Date('2002-11-05') },
  { email: 'GodOfGod@example.com', password: 'godisgod', username: 'God', level: 9999, xp: 9999999, totallogin: 999 },
];

for (const userData of usersToSeed) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  await prisma.user.upsert({
    where: { email: userData.email }, 
    update: { 
        ...userData,
        password: hashedPassword,
    },
    create: { 
      ...userData, 
      password: hashedPassword, 
    },
  });
  console.log(`✅ Upserted user with email: ${userData.email}`);
}
console.log('✅ Users seeded.');

  // 4. 問題データのシーディング (`localProblems` から)
  console.log('🌱 Seeding questions from local data...');
  for (const p of localProblems) {
    const questionDataForDB = { id: parseInt(p.id, 10), title: p.title.ja, question: p.description.ja, explain: p.explanationText.ja, language_id: 1, genre_id: 1, difficultyid: 1, genreid: 1, answerid: 1, term: "不明" };
    await prisma.questions.create({ data: questionDataForDB });
    console.log(`✅ Created question from local data: "${questionDataForDB.title}" (ID: ${questionDataForDB.id})`);
  }

  // 5. 問題データのシーディング (Excel から)
  console.log(`\n🌱 Seeding problems from Excel file...`);
  const excelFileName = 'PBL2 科目B問題.xlsx';
  const filePath = path.join(__dirname, '..', 'app', '(main)', 'issue_list', 'basic_info_b_problem', 'data', excelFileName);
  const defaultSubjectId = 3; 
  const defaultDifficultyB_Easy_Id = 7;
  const defaultDifficultyB_Hard_Id = 8;
  const pseudoLanguageId = 2;

  // ▼▼▼【ここから修正】次のIDを動的に計算するロジックを追加 ▼▼▼
  const lastLocalQuestion = await prisma.questions.findFirst({ orderBy: { id: 'desc' } });
  let nextId = (lastLocalQuestion?.id || 0) + 1;
  console.log(`   Starting Excel questions from ID: ${nextId}`);
  // ▲▲▲【ここまで修正】▲▲▲

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetConfigs = [ { name: '基本情報科目B基礎', difficultyId: defaultDifficultyB_Easy_Id, range: 'B2:G16' }, { name: '基本情報科目B応用', difficultyId: defaultDifficultyB_Hard_Id, range: 'B2:G16' } ];
    const headers = ['title_ja', 'description_ja', 'programLines_ja', 'answerOptions_ja', 'correctAnswer', 'explanation_ja'];

    for (const config of sheetConfigs) {
      const sheet = workbook.Sheets[config.name];
      if (!sheet) { console.warn(`  ⚠️ Sheet "${config.name}" not found.`); continue; }
      const records = XLSX.utils.sheet_to_json(sheet, { header: headers, range: config.range }) as any[];

      for (const record of records) {
        if (!record.title_ja) continue;
        
        const questionAlgoEntry = await prisma.questions_Algorithm.create({
          data: {
            id: nextId, // ▼▼▼【修正】手動でIDを割り当てる
            title: record.title_ja,
            description: record.description_ja,
            explanation: record.explanation_ja,
            programLines: record.programLines_ja,
            answerOptions: record.answerOptions_ja,
            correctAnswer: String(record.correctAnswer),
            language_id: pseudoLanguageId,
            subjectId: defaultSubjectId,
            difficultyId: config.difficultyId,
            initialVariable: {}, 
            logictype: 'PSEUDO_CODE',
            options: {},
          }
        });
        console.log(`  ✅ Created algorithm question from Excel: "${questionAlgoEntry.title}" (ID: ${questionAlgoEntry.id})`);
        nextId++; // ▼▼▼【修正】次のIDのためにインクリメント
      }
    }
  } catch (error) { console.error(`❌ Failed to read or process ${excelFileName}:`, error); }

  // 6. 最後に、作成したデータを使った処理を実行
  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  if (alice) {
    console.log('🧪 Testing addXp function...');
    await addXp(alice.id, 1, 1);
  }

  console.log('👼 Creating God Mode progress...');
  const godUser = await prisma.user.findUnique({ where: { email: 'GodOfGod@example.com' } });
  if (godUser) {
    const progressData = subjectsToSeed.map((subject) => ({ user_id: godUser.id, subject_id: subject.id, level: 9999, xp: 99999999 }));
    await prisma.userSubjectProgress.createMany({ data: progressData, skipDuplicates: true });
    console.log(`✅ God Mode progress created.`);
  }
}

main().catch(e => {
  console.error(`❌ Seeding failed:`, e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
  console.log(`\n🔌 Disconnected from database.`);
});
