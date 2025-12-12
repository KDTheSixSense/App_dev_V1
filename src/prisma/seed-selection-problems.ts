import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as XLSX from 'xlsx';
import fs from 'fs';

const prisma = new PrismaClient();

//
// 以下の関数群は prisma/seed/questions.ts から移植・改変したものです
//

/**
 * answerOptions のテキストを配列に変換するヘルパー関数
 */
function parseAnswerOptionsText(text: string): string[] | null {
  if (!text || typeof text !== 'string') { return null; }
  const cleanedText = text.replace(/[\r\n]+/g, ' ').replace(/[　\t ]+/g, ' ').trim();
  const markersJP = ['ア：', 'イ：', 'ウ：', 'エ：'];
  const markersEnFull = ['A：', 'B：', 'C：', 'D：'];
  const markersEnHalf = ['A:', 'B:', 'C:', 'D:'];
  let markers = markersJP;
  if (cleanedText.includes(markersEnFull[0])) { markers = markersEnFull; }
  else if (cleanedText.includes(markersEnHalf[0])) { markers = markersEnHalf; }
  const markerPositions: { [key: string]: number } = {};
  let searchStartIndex = 0;
  for (const marker of markers) {
    const index = cleanedText.indexOf(marker, searchStartIndex);
    if (index === -1) { return null; }
    markerPositions[marker] = index;
    searchStartIndex = index + 1;
  }
  const options: string[] = [];
  try {
    const offset0 = markerPositions[markers[0]] + markers[0].length;
    const offset1 = markerPositions[markers[1]] + markers[1].length;
    const offset2 = markerPositions[markers[2]] + markers[2].length;
    const offset3 = markerPositions[markers[3]] + markers[3].length;
    options.push(cleanedText.substring(offset0, markerPositions[markers[1]]).trim());
    options.push(cleanedText.substring(offset1, markerPositions[markers[2]]).trim());
    options.push(cleanedText.substring(offset2, markerPositions[markers[3]]).trim());
    options.push(cleanedText.substring(offset3).trim());
    if (options.length === 4 && options.every(opt => opt && opt.length > 0)) {
      return options;
    } else {
      return null;
    }
  } catch (e) {
    console.error(` ❌ Error parsing options: "${text}"`, e);
    return null;
  }
}

/**
 * ハードコードされたサンプル選択問題をDBに登録
 */
export async function seedSampleSelectionProblems(prisma: PrismaClient) {
  console.log('🌱 Seeding sample selection problems...');
  const selectionProblems = [
    // ... (元ファイルからコピー)
    {
      title: 'Pythonの変数宣言について',
      description: 'Pythonで変数を宣言する際の正しい記述はどれですか？',
      explanation: 'Pythonでは変数の型を明示的に宣言する必要がありません。値を代入するだけで変数が作成されます。',
      answerOptions: ['int x = 5', 'var x = 5', 'x = 5', 'declare x = 5'],
      correctAnswer: 'x = 5',
      difficultyId: 11,
      subjectId: 4,
    },
    // 他の問題も同様に定義
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const problem of selectionProblems) {
    await prisma.selectProblem.upsert({
      where: { title: problem.title },
      update: problem,
      create: problem,
    });
    // ログのためにupsertの結果を知りたい場合は個別にfindFirst->update/createする
  }
  console.log(`✅ Finished seeding sample selection problems.`);
}

/**
 * Excelファイルから選択問題をDBに登録
 */
export async function seedSelectProblemsFromExcel(prisma: PrismaClient) {
  console.log('🌱 Seeding Selection Problems from Excel file...');
  const excelFileName = 'PBL3_4択問題ベースシート.xlsx';
  const sheetName = '4択問題統合用シート';
  const filePath = path.join(__dirname, '..', '..', 'app', '(main)', 'issue_list', 'selects_problems', 'data', excelFileName);
  const TARGET_DIFFICULTY_ID = 11;
  const TARGET_SUBJECT_ID = 4;

  try {
    if (!fs.existsSync(filePath)) {
        console.warn(` ⚠️ File not found: ${filePath}. Skipping Excel seeding for SelectProblem.`);
        return;
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(` ⚠️ Sheet "${sheetName}" not found in ${excelFileName}. Skipping.`);
      return;
    }

    const headers = ['id', 'title', 'description', 'explanation', 'answerOptions', 'correctAnswer', 'difficultyId', 'difficulty', 'subjectId', 'subject', 'assignment', 'category', 'sourceNumber', 'sourceYear', 'imageFileName'];
    const records = XLSX.utils.sheet_to_json(sheet, { header: headers, range: 2 }) as any[];

    const answerIndexMap: { [key: string]: number } = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'ア': 0, 'イ': 1, 'ウ': 2, 'エ': 3 };
    let createdCount = 0;
    let updatedCount = 0;

    for (const record of records) {
      if (!record.title || String(record.title).trim() === '') continue;

      const parsedOptions = parseAnswerOptionsText(record.answerOptions);
      if (!parsedOptions) {
        console.warn(` ⚠️ Failed to parse options for problem: "${record.title}". Skipping.`);
        continue;
      }

      const correctChar = String(record.correctAnswer).trim().toUpperCase();
      const correctIndex = answerIndexMap[correctChar];
      if (correctIndex === undefined || !parsedOptions[correctIndex]) {
          console.warn(` ⚠️ Invalid correct answer "${correctChar}" for problem: "${record.title}". Skipping.`);
          continue;
      }
      const correctAnswerText = parsedOptions[correctIndex];

      let descriptionToSave = String(record.description || "");
      const rawImageName = record.imageFileName ? String(record.imageFileName).trim() : null;
      if (rawImageName) {
          descriptionToSave += `\n\n![問題画像](/images/select_problems/${rawImageName})`;
      }

      const dataToSave = {
          title: String(record.title),
          description: descriptionToSave,
          explanation: String(record.explanation || ""),
          answerOptions: parsedOptions,
          correctAnswer: correctAnswerText,
          difficultyId: TARGET_DIFFICULTY_ID,
          subjectId: TARGET_SUBJECT_ID,
      };

      const existingProblem = await prisma.selectProblem.findUnique({
        where: { title: dataToSave.title },
      });

      if (existingProblem) {
        await prisma.selectProblem.update({ where: { id: existingProblem.id }, data: dataToSave });
        updatedCount++;
      } else {
        await prisma.selectProblem.create({ data: dataToSave });
        createdCount++;
      }
    }
    console.log(` ✅ Finished Excel seeding for Select Problems. Created: ${createdCount}, Updated: ${updatedCount}.`);

  } catch (error) {
    console.error(`❌ Failed to read or process ${excelFileName}:`, error);
  }
}

