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
    const cleanedText = text.replace(/[
]+/g, ' ').replace(/[　 ]+/g, ' ').trim();
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
 * 応用情報午前問題 をデータベースに登録する
 */
async function seedAppliedInfoAmProblems(prisma: PrismaClient) {
  console.log('🌱 Seeding Applied Info AM problems from Excel file...');

  const excelFileName = 'PBL3応用午前統合版.xlsx';
  const sheetName = '応用情報午前問題統合用シート';
  const filePath = path.join(__dirname, '..', '..', 'app', '(main)', 'issue_list', 'applied_info_morning_problem', 'data', excelFileName);

  try {
    if (!fs.existsSync(filePath)) {
        console.warn(` ⚠️ File not found: ${filePath}. Skipping Applied AM seeding.`);
        return;
    }
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(` ⚠️ Sheet "${sheetName}" not found in ${excelFileName}. Skipping.`);
      return;
    }

    const headers = [ 'id', 'title', 'description', 'explanation', 'answerOptions', 'correctAnswer', 'difficultyId', 'difficulty', 'subjectId', 'subject', 'assignment', 'category', 'source', 'sourceYear', 'imageFileName' ];
    const records = XLSX.utils.sheet_to_json(sheet, { header: headers, range: 2 }) as any[];

    // マスタデータ取得
    const categories = await prisma.category.findMany();
    const categoryNameToDbNameMap: { [key: string]: string } = {
        '1': 'テクノロジ系', '2': 'マネジメント系', '3': 'ストラテジ系',
        '基礎理論': 'テクノロジ系', 'コンピュータシステム': 'テクノロジ系', '開発技術': 'テクノロジ系', 'ネットワーク': 'テクノロジ系', 'セキュリティ': 'テクノロジ系', 'データベース': 'テクノロジ系',
        'プロジェクトマネジメント': 'マネジメント系', 'サービスマネジメント': 'マネジメント系', 'システム監査': 'マネジメント系',
        'システム戦略': 'ストラテジ系', '企業と法務': 'ストラテジ系', '経営戦略': 'ストラテジ系',
        'テクノロジ系': 'テクノロジ系', 'マネジメント系': 'マネジメント系', 'ストラテジ系': 'ストラテジ系'
    };
    const defaultDifficulty = await prisma.difficulty.findUnique({ where: { name: '応用資格午前問題' } });
    const defaultSubject = await prisma.subject.findUnique({ where: { name: '応用情報午前問題' } });

    if (!defaultDifficulty || !defaultSubject) {
        console.error('❌ Master data error: Default Difficulty or Subject for Applied AM not found.');
        return;
    }
    const answerMap: { [key: string]: number } = { 'ア': 0, 'イ': 1, 'ウ': 2, 'エ': 3 };

    let createdCount = 0;
    let updatedCount = 0;

    for (const record of records) {
        const problemId = parseInt(String(record.id || '').trim(), 10);
        if (isNaN(problemId) || !record.title || String(record.title).trim() === '') {
            continue;
        }

        const rawCategoryValue = String(record.category || '').trim();
        const mappedDbCategoryName = categoryNameToDbNameMap[rawCategoryValue] || 'テクノロジ系';
        const category = categories.find(c => c.name === mappedDbCategoryName);

        if (!category) {
            console.warn(`⚠️ Category not found for "${rawCategoryValue}". Skipping problem ID ${problemId}.`);
            continue;
        }

        const parsedOptions = parseAnswerOptionsText(record.answerOptions);
        if (!parsedOptions) {
            console.warn(`⚠️ Failed to parse answerOptions for problem ID ${problemId}. Skipping.`);
            continue;
        }

        const correctAnswerIndex = answerMap[String(record.correctAnswer).trim()];
        if (correctAnswerIndex === undefined) {
            console.warn(`⚠️ Invalid correct answer for problem ID ${problemId}. Skipping.`);
            continue;
        }

        const rawImageName = record.imageFileName ? String(record.imageFileName).trim() : null;
        const imagePath = rawImageName ? `/images/applied_am/${rawImageName}` : null;

        const dataToSave = {
            title: String(record.title),
            description: String(record.description || ""),
            explanation: String(record.explanation || ""),
            answerOptions: parsedOptions,
            correctAnswer: correctAnswerIndex,
            sourceYear: String(record.sourceYear || '不明').trim(),
            sourceNumber: String(record.source || '不明').trim(),
            difficultyId: defaultDifficulty.id,
            subjectId: defaultSubject.id,
            categoryId: category.id,
            imagePath: imagePath,
        };

        const existingProblem = await prisma.applied_am_Question.findUnique({
            where: { id: problemId },
        });
        
        if (existingProblem) {
            await prisma.applied_am_Question.update({ where: { id: problemId }, data: dataToSave });
            updatedCount++;
        } else {
            await prisma.applied_am_Question.create({ data: { ...dataToSave, id: problemId } });
            createdCount++;
        }
    }
    console.log(`✅ Finished Applied Info AM seeding. Created: ${createdCount}, Updated: ${updatedCount}.`);

  } catch (error) {
    console.error(`❌ Failed to read or process ${excelFileName}:`, error);
  }
}

async function main() {
  console.log(`🚀 Start seeding Applied Info AM problems...`);
  await seedAppliedInfoAmProblems(prisma);
  console.log('✅ Seeding for Applied Info AM problems finished.');
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
