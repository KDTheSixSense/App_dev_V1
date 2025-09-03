import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as XLSX from 'xlsx';
import { problems as localProblems } from '../../app/(main)/issue_list/basic_info_b_problem/data/problems';

export async function seedProblems(prisma: PrismaClient) {
  console.log('🌱 Seeding problems...');

  // 既存の問題関連データをクリア
  console.log('🗑️ Clearing old problem data...');
  await prisma.userAnswer.deleteMany({});
  await prisma.answer_Algorithm.deleteMany({});
  await prisma.questions.deleteMany({});
  await prisma.questions_Algorithm.deleteMany({});
  await prisma.sampleCase.deleteMany({});
  await prisma.programmingProblem.deleteMany({});
  console.log('✅ Old problem data cleared.');

  // 1. localProblems からのシーディング
  console.log('🌱 Seeding questions from local data...');
  for (const p of localProblems) {
    const questionDataForDB = { id: parseInt(p.id, 10), title: p.title.ja, question: p.description.ja, explain: p.explanationText.ja, language_id: 1, genre_id: 1, genreid: 1, difficultyId: 1, answerid: 1, term: "不明" };
    await prisma.questions.create({ data: questionDataForDB });
  }
  console.log(`✅ Created ${localProblems.length} questions from local data.`);

  // 2. Excel からのシーディング
  console.log('🌱 Seeding problems from Excel file...');
  await seedProblemsFromExcel(prisma);

  // 3. サンプルプログラミング問題のシーディング
  console.log('🌱 Seeding sample programming problems...');
  await seedSampleProgrammingProblems(prisma);
}

async function seedProblemsFromExcel(prisma: PrismaClient) {
  const excelFileName = 'PBL2 科目B問題.xlsx';
  const filePath = path.join(__dirname, '..','..', 'app', '(main)', 'issue_list', 'basic_info_b_problem', 'data', excelFileName);
  
  const lastLocalQuestion = await prisma.questions.findFirst({ orderBy: { id: 'desc' } });
  let nextId = (lastLocalQuestion?.id || 0) + 1;
  console.log(`   Starting Excel questions from ID: ${nextId}`);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetConfigs = [
      { name: '基本情報科目B基礎', difficultyId: 7, range: 'B2:G16' },
      { name: '基本情報科目B応用', difficultyId: 8, range: 'B2:G16' }
    ];
    const headers = ['title_ja', 'description_ja', 'programLines_ja', 'answerOptions_ja', 'correctAnswer', 'explanation_ja'];

    for (const config of sheetConfigs) {
      const sheet = workbook.Sheets[config.name];
      if (!sheet) { console.warn(`   ⚠️ Sheet "${config.name}" not found.`); continue; }
      const records = XLSX.utils.sheet_to_json(sheet, { header: headers, range: config.range }) as any[];

      for (const record of records) {
        if (!record.title_ja) continue;
        
        await prisma.questions_Algorithm.create({
          data: {
            id: nextId,
            title: record.title_ja,
            description: record.description_ja,
            explanation: record.explanation_ja,
            programLines: record.programLines_ja,
            answerOptions: record.answerOptions_ja,
            correctAnswer: String(record.correctAnswer),
            language_id: 2, // 擬似言語
            subjectId: 3, // 基本情報B問題
            difficultyId: config.difficultyId,
            initialVariable: {}, 
            logictype: 'PSEUDO_CODE',
            options: {},
          }
        });
        nextId++;
      }
      console.log(`   ✅ Created questions from sheet: "${config.name}"`);
    }
  } catch (error) { console.error(`❌ Failed to read or process ${excelFileName}:`, error); }
}

async function seedSampleProgrammingProblems(prisma: PrismaClient) {
  const problems = [
    {
      title: 'はじめてのプログラミング：Hello World',
      description: '標準出力に "Hello, World!" と表示するプログラムを作成してください。',
      difficulty: 1, category: 'プログラミング基礎', topic: '標準入出力', isPublic: true, isPublished: true,
      sampleCases: { create: [{ input: '(なし)', expectedOutput: 'Hello, World!', description: '最も基本的な出力です。', order: 1 }] },
    },
    {
      title: '変数の計算：2つの数の和',
      description: '整数 `a` と `b` の和を計算し、結果を標準出力に出力するプログラムを作成してください。\n`a = 10`, `b = 25` とします。',
      difficulty: 2, category: 'プログラミング基礎', topic: '変数と型', isPublic: true, isPublished: true,
      sampleCases: { create: [{ input: 'a = 10\nb = 25', expectedOutput: '35', description: 'aとbの和を正しく計算します。', order: 1 }] },
    },
    {
      title: '条件分岐：偶数か奇数か',
      description: '与えられた整数 `n` が偶数であれば "even"、奇数であれば "odd" と出力するプログラムを作成してください。\n`n = 7` とします。',
      difficulty: 3, category: '制御構造', topic: '条件分岐 (if文)', isPublic: true, isPublished: true,
      sampleCases: { create: [
        { input: 'n = 7', expectedOutput: 'odd', description: '7は奇数なのでoddと出力されます。', order: 1 },
        { input: 'n = 12', expectedOutput: 'even', description: '12は偶数なのでevenと出力されます。', order: 2 },
      ]},
    },
  ];

  for (const p of problems) {
    await prisma.programmingProblem.create({ data: p });
  }
  console.log(`✅ Created ${problems.length} sample programming problems.`);
}
