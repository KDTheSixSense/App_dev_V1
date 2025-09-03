// prisma/seed.ts
import { Prisma, PrismaClient, TitleType } from '@prisma/client';
import { addXp, updateUserLoginStats} from '../lib/actions';
import path from 'path';
import * as XLSX from 'xlsx';
import { problems as localProblems } from '../app/(main)/issue_list/basic_info_b_problem/data/problems';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid'

const prisma = new PrismaClient();

async function main() {
  console.log(`🚀 Start seeding ...`);

  // 1. マスターデータのシーディング
  console.log('Seeding difficulties...');
  const difficultiesToSeed = [
    { id: 1, name: 'やさしい', xp: 200 ,feed: 40}, { id: 2, name: 'かんたん', xp: 400 ,feed: 80}, { id: 3, name: 'ふつう', xp: 800 ,feed: 160}, { id: 4, name: 'むずかしい', xp: 1200 ,feed: 200}, { id: 5, name: '鬼むず', xp: 2000 ,feed: 200}, { id: 6, name: '基本資格A問題', xp: 40 ,feed: 8}, { id: 7, name: '基本資格B問題(かんたん)', xp: 120 ,feed: 24}, { id: 8, name: '基本資格B問題(むずかしい)', xp: 280 ,feed: 56}, { id: 9, name: '応用資格午前問題', xp: 60 ,feed: 12}, { id: 10, name: '応用資格午後問題', xp: 1200 ,feed: 200},
  ];
  for (const d of difficultiesToSeed) { await prisma.difficulty.upsert({ where: { id: d.id }, update: {}, create: d }); }
  console.log('✅ Difficulties seeded.');

  console.log('Seeding subjects...');
  const subjectsToSeed = [ { id: 1, name: 'プログラミング' }, { id: 2, name: '基本情報A問題'}, { id: 3, name: '基本情報B問題'},{ id: 4, name: 'プログラミング選択問題' } ];
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

  console.log('Seeding titles...');
  const titlesToSeed = [
    { id: 1, name: '駆け出し冒険者', description: 'ユーザーレベル10に到達した証。', type: TitleType.USER_LEVEL, requiredLevel: 10 },
    { id: 2, name: '見習いプログラマー', description: 'プログラミングレベル10に到達した証。', type: TitleType.SUBJECT_LEVEL, requiredLevel: 10, requiredSubjectId: 1 },
    { id: 3, name: 'B問題の新人', description: '基本情報B問題レベル10に到達した証。', type: TitleType.SUBJECT_LEVEL, requiredLevel: 10, requiredSubjectId: 3 },
    { id: 4, name: 'A問題の新人', description: '基本情報A問題レベル10に到達した証。', type: TitleType.SUBJECT_LEVEL, requiredLevel: 10, requiredSubjectId: 2 },
    { id: 5, name: 'ベテラン冒険者', description: 'ユーザーレベル20に到達した証。', type: TitleType.USER_LEVEL, requiredLevel: 20 },
    { id: 6, name: 'マスター冒険者', description: 'ユーザーレベル30に到達した証。', type: TitleType.USER_LEVEL, requiredLevel: 30 },
    { id: 7, name: '熟練プログラマー', description: 'プログラミングレベル20に到達した証。', type: TitleType.SUBJECT_LEVEL, requiredLevel: 20, requiredSubjectId: 1 },
    { id: 8, name: 'マスタープログラマー', description: 'プログラミングレベル30に到達した証。', type: TitleType.SUBJECT_LEVEL, requiredLevel: 30, requiredSubjectId: 1 },
    { id: 9, name: 'A問題の達人', description: '基本情報A問題レベル20に到達した証。', type: TitleType.SUBJECT_LEVEL, requiredLevel: 20, requiredSubjectId: 2 },
    { id: 10, name: 'B問題の達人', description: '基本情報B問題レベル20に到達した証。', type: TitleType.SUBJECT_LEVEL, requiredLevel: 20, requiredSubjectId: 3 },
  ];
  for (const t of titlesToSeed) { await prisma.title.upsert({ where: { id: t.id }, update: {}, create: t }); }
  console.log('✅ Titles seeded.');

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
  { email: 'diana@example.com', password: 'password456', username: 'Diana Prince', level: 25, xp: 24500, totallogin: 50 },
  { email: 'eva@example.com', password: 'password789', username: 'Eva Green', level: 5, xp: 4100, totallogin: 3 },
  { email: 'frank@example.com', password: 'password101', username: 'Frank Castle', level: 50, xp: 49900, totallogin: 100 },
  { email: 'grace@example.com', password: 'password112', username: 'Grace Hopper', level: 50, xp: 49900, totallogin: 200 },
  { email: 'tanaka@example.com', password: 'password131', username: '田中 恵子', level: 2, xp: 1500, totallogin: 1 },
  { email: 'suzuki@example.com', password: 'password415', username: '鈴木 一郎', level: 18, xp: 17500, totallogin: 25 },
  { email: 'sato@example.com', password: 'password617', username: '佐藤 美咲', level: 22, xp: 21300, totallogin: 42 },
];

for (const u of usersToSeed) {
  const hashedPassword = await bcrypt.hash(u.password, 10);

// upsertを使って、ユーザーが存在すれば更新、なければ作成する
    await prisma.user.upsert({
      where: { email: u.email },
      // ユーザーが存在する場合の更新内容
      update: {
        username: u.username,
        password: hashedPassword,
        level: u.level,
        xp: u.xp,
        totallogin: u.totallogin,
      },
      // ユーザーが存在しない場合に作成する内容
      create: {
        email: u.email,
        username: u.username,
        password: hashedPassword,
        level: u.level,
        xp: u.xp,
        totallogin: u.totallogin,
        // --- ★★★ ネストされた書き込み ★★★ ---
        // User作成と同時に、関連するペットのステータスも作成する
        status_Kohaku: {
          create: {
            status: '空腹',
            hungerlevel: 49, // 満腹度の初期値
          },
        },
      },
    });
    console.log(`✅ Upserted user with email: ${u.email}`);
    }
    console.log('✅ Users seeded.');

    // ★★★ ユーザー取得を一度にまとめる ★★★
    // これから何度も使うユーザー情報をここで一度だけ取得します。
    const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    const godUser = await prisma.user.findUnique({ where: { email: 'GodOfGod@example.com' } });

    // ユーザーが見つからない場合は、エラーを出して処理を中断します。
    if (!alice || !godUser) {
        console.error("❌ Seeding users (alice, GodOfGod) not found. Aborting subsequent operations.");
        return;
    }

    // ★★★【ここから追加】★★★
    console.log('🌱 Seeding groups and memberships...');
    
    // 既存のグループ関連データをクリア（冪等性を保つため）
    await prisma.groups_User.deleteMany({});
    await prisma.groups.deleteMany({});

    // 1. 新しいグループを作成
    const pblGroup = await prisma.groups.create({
        data: {
            groupname: 'プログラミングクラブ',
            body: 'プログラミングについて学ぶグループです',
            invite_code: nanoid(8),
            // hashedIdはデフォルトでcuid()が生成するため不要
        },
    });
    console.log(`✅ Created group: "${pblGroup.groupname}" (ID: ${pblGroup.id})`);

    // 2. Aliceをメンバーとしてグループに追加
    await prisma.groups_User.create({
        data: {
            user_id: alice.id,
            group_id: pblGroup.id,
            admin_flg: false, // false = member
        },
    });
    console.log(`✅ Added Alice to "${pblGroup.groupname}" as a member.`);

    // 3. Godを管理者としてグループに追加
    await prisma.groups_User.create({
        data: {
            user_id: godUser.id,
            group_id: pblGroup.id,
            admin_flg: true, // true = admin
        },
    });
    console.log(`✅ Added God to "${pblGroup.groupname}" as an admin.`);
    // ★★★【ここまで追加】★★★

    // ★★★【Aliceに全ての称号を付与】★★★
    console.log('👑 Granting all titles to Alice...');
    const allTitles = await prisma.title.findMany({ select: { id: true } });
    const aliceUnlockedTitles = allTitles.map(title => ({
      userId: alice.id,
      titleId: title.id,
    }));
    await prisma.userUnlockedTitle.createMany({
      data: aliceUnlockedTitles,
      skipDuplicates: true,
    });
    console.log(`✅ Granted ${allTitles.length} titles to Alice.`);
    // ★★★【ここまで】★★★


    console.log('✅ Seeding finished.');

  // 4. 問題データのシーディング (`localProblems` から)
  console.log('🌱 Seeding questions from local data...');
  for (const p of localProblems) {
    const questionDataForDB = { id: parseInt(p.id, 10), title: p.title.ja, question: p.description.ja, explain: p.explanationText.ja, language_id: 1, genre_id: 1, genreid: 1, difficultyId: 1, answerid: 1, term: "不明" };
    await prisma.questions.create({ data: questionDataForDB });
    console.log(`✅ Created question from local data: "${questionDataForDB.title}" (ID: ${questionDataForDB.id})`);
  }

  // 5. 問題データのシーディング (Excel から)
  console.log(`
🌱 Seeding problems from Excel file...`);
  const excelFileName = 'PBL2 科目B問題.xlsx';
  const filePath = path.join(__dirname, '..', 'app', '(main)', 'issue_list', 'basic_info_b_problem', 'data', excelFileName);
  const defaultSubjectId = 3; 
  const defaultDifficultyB_Easy_Id = 7;
  const defaultDifficultyB_Hard_Id = 8;
  const pseudoLanguageId = 2;

  const lastLocalQuestion = await prisma.questions.findFirst({ orderBy: { id: 'desc' } });
  let nextId = (lastLocalQuestion?.id || 0) + 1;
  console.log(`   Starting Excel questions from ID: ${nextId}`);

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
            id: nextId,
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
        nextId++;
      }
    }
  } catch (error) { console.error(`❌ Failed to read or process ${excelFileName}:`, error); }

  // 6. 最後に、作成したデータを使った処理を実行
  if (alice) {
    console.log('🧪 Testing addXp function...');
    await addXp(alice.id, 1, 1);
    console.log(`✅ Alice's XP updated.`);

    // Increment XP for basic_info_a (subjectId: 2) to reach level 10
    for (let i = 0; i < 40; i++) { // 40 calls * 280 XP/call = 11200 XP
      await addXp(alice.id, 2, 8);
    }
    console.log(`✅ Alice's Basic Info A XP updated.`);

    // Increment XP for basic_info_b (subjectId: 3) to reach level 10
    for (let i = 0; i < 40; i++) { // 40 calls * 280 XP/call = 11200 XP
      await addXp(alice.id, 3, 8);
    }
    console.log(`✅ Alice's Basic Info B XP updated.`)
    await updateUserLoginStats(alice.id);
  }
for (const userData of usersToSeed)
  console.log('👼 Creating God Mode progress...');
  if (godUser) {
    const progressData = subjectsToSeed.map((subject) => ({ user_id: godUser.id, subject_id: subject.id, level: 9999, xp: 99999999 }));
    await prisma.userSubjectProgress.createMany({ data: progressData, skipDuplicates: true });
    console.log(`✅ God Mode progress created.`);
  }
  
  console.log('Creating sample proggramings...');

  // 既存のデータを削除（冪等性を保つため）
  await prisma.sampleCase.deleteMany({});
  await prisma.programmingProblem.deleteMany({});
  
  // サンプル問題データ
  const problems = [
    {
      title: 'はじめてのプログラミング：Hello World',
      description: '標準出力に "Hello, World!" と表示するプログラムを作成してください。',
      difficulty: 1,
      category: 'プログラミング基礎',
      topic: '標準入出力',
      isPublic: true,
      isPublished: true,
      sampleCases: {
        create: [
          { input: '(なし)', expectedOutput: 'Hello, World!', description: '最も基本的な出力です。', order: 1 },
        ],
      },
    },
    {
      title: '変数の計算：2つの数の和',
      description: '整数 `a` と `b` の和を計算し、結果を標準出力に出力するプログラムを作成してください。\n`a = 10`, `b = 25` とします。',
      difficulty: 2,
      category: 'プログラミング基礎',
      topic: '変数と型',
      isPublic: true,
      isPublished: true,
      sampleCases: {
        create: [
          { input: 'a = 10\nb = 25', expectedOutput: '35', description: 'aとbの和を正しく計算します。', order: 1 },
        ],
      },
    },
    {
      title: '条件分岐：偶数か奇数か',
      description: '与えられた整数 `n` が偶数であれば "even"、奇数であれば "odd" と出力するプログラムを作成してください。\n`n = 7` とします。',
      difficulty: 3,
      category: '制御構造',
      topic: '条件分岐 (if文)',
      isPublic: true,
      isPublished: true,
      sampleCases: {
        create: [
          { input: 'n = 7', expectedOutput: 'odd', description: '7は奇数なのでoddと出力されます。', order: 1 },
          { input: 'n = 12', expectedOutput: 'even', description: '12は偶数なのでevenと出力されます。', order: 2 },
        ],
      },
    },
  ];

  // データベースに問題を作成
  for (const p of problems) {
    const problem = await prisma.programmingProblem.create({
      data: p,
    });
    console.log(`Created problem with id: ${problem.id}`);
  }

  console.log('✅ Seeding finished.');
}

main().catch(e => {
  console.error(`❌ Seeding failed:`, e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
  console.log(`\n🔌 Disconnected from database.`);
});