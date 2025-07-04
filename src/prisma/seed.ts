// prisma/seed.ts
import { Prisma, PrismaClient } from '@prisma/client';
// 実際のアプリケーションでは、パスワードハッシュ化ライブラリをインポートします
// 例: import bcrypt from 'bcrypt';

// ★重要★ あなたの環境の `problems.ts` ファイルへのパスが正しいか確認してください
import { problems as localProblems } from '../app/(main)/issue_list/basic_info_b_problem/data/problems'; 

import { addXp } from '../lib/action'; // 作成したaddXp関数をインポート
import { promises as fs } from 'fs'; // ★ ファイル読み込みのためにfsをインポート
import { parse } from 'csv-parse/sync'; // ★ CSVパーサーをインポート
import path from 'path'; // ★ ファイルパスを解決するためにpathをインポート
import * as XLSX from 'xlsx';

// PrismaClientを初期化
const prisma = new PrismaClient();

async function main() {
  console.log(`🚀 Start seeding ...`);

  // =================================================================
  // 1. マスターデータのシーディング (親となるテーブル)
  // =================================================================

  console.log('Seeding difficulties...');
  const difficultiesToSeed = [
    { id: 1, name: 'やさしい', xp: 200 },
    { id: 2, name: 'かんたん', xp: 400 },
    { id: 3, name: 'ふつう', xp: 800 },
    { id: 4, name: 'むずかしい', xp: 1200 },
    { id: 5, name: '鬼むず', xp: 2000 },
    { id: 6, name: '基本資格A問題', xp: 40 },
    { id: 7, name: '基本資格B問題(かんたん)', xp: 120 },
    { id: 8, name: '基本資格B問題(むずかしい)', xp: 280 },
    { id: 9, name: '応用資格午前問題', xp: 60 },
    { id: 10, name: '応用資格午後問題', xp: 1200 },
  ];
  for (const d of difficultiesToSeed) {
    await prisma.difficulty.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    });
  }
  console.log('✅ Difficulties seeded.');

  console.log('Seeding subjects...');
  const subjectsToSeed = [ 
    { id: 1, name: 'プログラミング' },
    { id: 2, name: '基本情報A問題'},
    { id: 3, name: '基本情報B問題'},
  ];
  for (const s of subjectsToSeed) {
    await prisma.subject.upsert({
      where: { id: s.id }, update: {}, create: s,
    });
  }
  console.log('✅ Subjects seeded.');
  
  console.log('Seeding genres...');
  const genresToSeed = [
    { id: 1, genre: 'テクノロジ系' },
    { id: 2, genre: 'マネジメント系' },
    { id: 3, genre: 'ストラテジ系' },
  ];
  for (const g of genresToSeed) {
    await prisma.genre.upsert({
      where: { id: g.id },
      update: {},
      create: g,
    });
  }
  console.log('✅ Genres seeded.');

  console.log('Seeding languages...');
  const languagesToSeed = [
    { id: 1, title_ja: '日本語' },
    { id: 2, title_ja: '擬似言語' },
  ];
  for (const l of languagesToSeed) {
    await prisma.language.upsert({
      where: { id: l.id },
      update: {},
      create: { id: l.id, title_ja: l.title_ja },
    });
  }
  console.log('✅ Languages seeded.');

  // =================================================================
  // 2. 依存関係のあるデータのシーディング (子となるテーブル)
  // =================================================================
  
  console.log('Seeding users...');
  const usersToSeed = [
    { id: 1, email: 'alice@example.com', password: 'password123', username: 'Alice Smith', year: 2020, class: 1, birth: new Date('2002-04-15') },
    { id: 2, email: 'bob@example.com', password: 'securepassword', username: 'Bob Johnson', year: 2021, class: 2, birth: new Date('2003-08-20') },
    { id: 3, email: 'charlie@example.com', password: 'anotherpassword', username: 'Charlie Brown', year: 2020, class: 3, birth: new Date('2002-11-05') },
    { id: 9999, email: 'GodOfGod@example.com', password: 'godisgod', username: 'God', level: 9999, xp: 9999999 },
  ];
  for (const userData of usersToSeed) {
    await prisma.user.upsert({
      where: { id: userData.id },
      update: userData,
      create: userData,
    });
    console.log(`✅ Upserted user with ID: ${userData.id} and email: ${userData.email}`);
  }

  console.log('Seeding questions...');
  await prisma.userAnswer.deleteMany({});
  await prisma.questions.deleteMany({});
  console.log("🗑️ Cleared existing questions and user answers data.");

  // `problems.ts` のデータを登録
  for (const p of localProblems) {
    const questionDataForDB = {
      id: parseInt(p.id, 10),
      title: p.title.ja,
      question: p.description.ja,
      explain: p.explanationText.ja,
      language_id: 1,
      genre_id: 1,
      difficultyid: 1,
      genreid: 1,
      answerid: 1,
      term: "不明",
    };
    const createdQuestion = await prisma.questions.create({
      data: questionDataForDB,
    });
    console.log(`✅ Created question from local data: "${createdQuestion.title}" (ID: ${createdQuestion.id})`);
  }
   // =================================================================
    // Problem Seeding from Excel
    // =================================================================
    console.log(`
🌱 Seeding problems from Excel file...`);
    const excelFileName = 'PBL2 科目B問題.xlsx';
    const filePath = path.join(__dirname, '..', 'app', '(main)', 'issue_list', 'basic_info_b_problem', 'data', excelFileName);
    
    const defaultSubjectId = 3; // '基本情報B問題'
    const defaultDifficultyB_Easy_Id = 7; // '基本情報B問題(かんたん)'
    const defaultDifficultyB_Hard_Id = 8; // '基本情報B問題(むずかしい)'

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetConfigs = [
            { name: '基本情報科目B基礎', difficultyId: defaultDifficultyB_Easy_Id, range: 'B2:G16' },
            { name: '基本情報科目B応用', difficultyId: defaultDifficultyB_Hard_Id, range: 'B2:G16' }
        ];
        const headers = ['title_ja', 'description_ja', 'programLines_ja', 'answerOptions_ja', 'correctAnswer', 'explanation_ja'];

        for (const config of sheetConfigs) {
            console.log(`  - Processing sheet: "${config.name}"`);
            const sheet = workbook.Sheets[config.name];
            if (!sheet) {
                console.warn(`  ⚠️ Sheet "${config.name}" not found. Skipping.`);
                continue;
            }

            const records = XLSX.utils.sheet_to_json(sheet, { range: config.range, header: headers });

            for (const record of records) {
                const typedRecord = record as { [key: string]: string };

                if (!typedRecord.title_ja) continue; // Skip empty rows

                // 1. Create Language entry
                const languageEntry = await prisma.language.create({
                    data: {
                        title_ja: typedRecord.title_ja,
                        description_ja: typedRecord.description_ja,
                        explanation_ja: typedRecord.explanation_ja,
                        programLines_ja: typedRecord.programLines_ja,
                        answerOptions_ja: typedRecord.answerOptions_ja,
                        correctAnswer: String(typedRecord.correctAnswer),
                    }
                });

                // 2. Create Question Algorithm entry
                const questionAlgoEntry = await prisma.questions_Algorithm.create({
                    data: {
                        language_id: languageEntry.id,
                        subjectId: defaultSubjectId,
                        difficultyId: config.difficultyId,
                        initialVariable: {}, 
                        logictype: 'PSEUDO_CODE',
                        options: {},
                    }
                });
                console.log(`  ✅ Created problem from Excel: "${languageEntry.title_ja}" (QID: ${questionAlgoEntry.id}, LID: ${languageEntry.id})`);
            }
        }
    } catch (error) {
        console.error(`❌ Failed to read or process ${excelFileName}:`, error);
    }



  // =================================================================
  // 3. 最後に、作成したデータを使った処理を実行
  // =================================================================

  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  if (alice) {
    await addXp(alice.id, 1, 1); // difficultyId=1 (やさしい) を指定
  }

  console.log('神の生成...');
  const godUser = await prisma.user.findUnique({ where: { email: 'GodOfGod@example.com' } });
  if (godUser) {
    const progressData = subjectsToSeed.map((subject) => ({
      user_id: godUser.id,
      subject_id: subject.id,
      level: 9999,
      xp: 99999999,
    }));
    await prisma.userSubjectProgress.createMany({
      data: progressData,
      skipDuplicates: true,
    });
    console.log(`神の誕生に成功しました。`);
  }
}

/**
 * Excelの1行分のデータを、PrismaのQuestionsモデルの形式に変換する関数
 */
function transformRowToQuestion(row: {
  title_ja?: string;
  description_ja?: string;
  explanation_ja?: string;
}): Omit<Prisma.QuestionsUncheckedCreateInput, 'id'> {
  return {
    title: row.title_ja || 'タイトルなし',
    question: row.description_ja || '問題文なし',
    explain: row.explanation_ja || '解説なし',
    
    // 外部キーのID（Excelの内容に応じて変更が必要な場合があります）
    language_id: 1,    // '日本語'
    genre_id: 1,       // 'テクノロジ系'
    difficultyid: 7,   // '基本資格B問題(かんたん)'
    
    // その他の必須フィールド
    genreid: 1,
    answerid: 1,       // Excelに解答列があれば、そこから取得するのが望ましい
    term: "不明",
  };
}


// スクリプトの実行と終了処理
main()
  .catch(e => {
    console.error(`❌ Seeding failed:`, e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log(`\n🔌 Disconnected from database.`);
  });
answer_Algorithm.deleteMany({});
    await prisma.questions.deleteMany({});
    await prisma.questions_Algorithm.deleteMany({});
    await prisma.language.deleteMany({}); // Language is now part of the problem data
    console.log('✅ Old data cleared.');


    // =================================================================
    // User Seeding
    // =================================================================
    console.log('🌱 Seeding users...');
    const usersToSeed = [
        { id: 1, email: 'alice@example.com', password: 'password123', username: 'Alice Smith', year: 2020, class: 1, birth: new Date('2002-04-15') },
        { id: 2, email: 'bob@example.com', password: 'securepassword', username: 'Bob Johnson', year: 2021, class: 2, birth: new Date('2003-08-20') },
        { id: 3, email: 'charlie@example.com', password: 'anotherpassword', username: 'Charlie Brown', year: 2020, class: 3, birth: new Date('2002-11-05') },
        { id: 9999, email: 'GodOfGod@example.com', password: 'godisgod', username: 'God', level: 9999, xp: 9999999 },
    ];

    for (const userData of usersToSeed) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: userData,
        });
        console.log(`✅ Upserted user with ID: ${user.id} and email: ${user.email}`);
    }
    const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    console.log('✅ Users seeded.');


    // =================================================================
    // Problem Seeding from Excel
    // =================================================================
    console.log(`
🌱 Seeding problems from Excel file...`);
    const excelFileName = 'PBL2 科目B問題.xlsx';
    const filePath = path.join(__dirname, '..', 'app', '(main)', 'issue_list', 'basic_info_b_problem', 'data', excelFileName);
    
    const defaultSubjectId = 3; // '基本情報B問題'
    const defaultDifficultyB_Easy_Id = 7; // '基本情報B問題(かんたん)'
    const defaultDifficultyB_Hard_Id = 8; // '基本情報B問題(むずかしい)'

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetConfigs = [
            { name: '基本情報科目B基礎', difficultyId: defaultDifficultyB_Easy_Id, range: 'B2:G16' },
            { name: '基本情報科目B応用', difficultyId: defaultDifficultyB_Hard_Id, range: 'B2:G16' }
        ];
        const headers = ['title_ja', 'description_ja', 'programLines_ja', 'answerOptions_ja', 'correctAnswer', 'explanation_ja'];

        for (const config of sheetConfigs) {
            console.log(`  - Processing sheet: "${config.name}"`);
            const sheet = workbook.Sheets[config.name];
            if (!sheet) {
                console.warn(`  ⚠️ Sheet "${config.name}" not found. Skipping.`);
                continue;
            }

            const records = XLSX.utils.sheet_to_json(sheet, { range: config.range, header: headers });

            for (const record of records) {
                const typedRecord = record as { [key: string]: string };

                if (!typedRecord.title_ja) continue; // Skip empty rows

                // 1. Create Language entry
                const languageEntry = await prisma.language.create({
                    data: {
                        title_ja: typedRecord.title_ja,
                        description_ja: typedRecord.description_ja,
                        explanation_ja: typedRecord.explanation_ja,
                        programLines_ja: typedRecord.programLines_ja,
                        answerOptions_ja: typedRecord.answerOptions_ja,
                        correctAnswer: String(typedRecord.correctAnswer),
                    }
                });

                // 2. Create Question Algorithm entry
                const questionAlgoEntry = await prisma.questions_Algorithm.create({
                    data: {
                        language_id: languageEntry.id,
                        subjectId: defaultSubjectId,
                        difficultyId: config.difficultyId,
                        initialVariable: {}, 
                        logictype: 'PSEUDO_CODE',
                        options: {},
                    }
                });
                console.log(`  ✅ Created problem from Excel: "${languageEntry.title_ja}" (QID: ${questionAlgoEntry.id}, LID: ${languageEntry.id})`);
            }
        }
    } catch (error) {
        console.error(`❌ Failed to read or process ${excelFileName}:`, error);
    }

    // =================================================================
    // XP and Progress Seeding
    // =================================================================
    if (alice) {
        console.log('🧪 Testing addXp function...');
        const easyProblemDifficulty = await prisma.difficulty.findUnique({ where: { id: 7 } });
        if (easyProblemDifficulty) {
            await addXp(alice.id, 3, easyProblemDifficulty.id); // Add XP for subject 3 (基本情報B問題)
            console.log(`✅ Added ${easyProblemDifficulty.xp} XP to Alice for Subject 3.`);
        }
    }

    console.log('👼 Creating God Mode progress...');
    const godUserId = 9999;
    const specialLevel = 9999;
    const specialXp = 99999999;
    const allSubjectIds = (await prisma.subject.findMany({ select: { id: true } })).map(s => s.id);

    const progressData = allSubjectIds.map((subjectId) => ({
        user_id: godUserId,
        subject_id: subjectId,
        level: specialLevel,
        xp: specialXp,
    }));

    await prisma.userSubjectProgress.createMany({
        data: progressData,
        skipDuplicates: true,
    });
    console.log(`✅ God Mode progress created.`);
}

main()
    .catch(e => {
        console.error(`❌ Seeding failed:`, e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log(`
🔌 Disconnected from database.`);
    });

