import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as XLSX from 'xlsx';
import { seedSchoolFestivalQuestions } from './school_festival_questions';
import { problems as localProblems } from '../../app/(main)/issue_list/basic_info_b_problem/data/problems';
import fs from 'fs';

const WORKSPACE_ROOT = process.cwd();

export async function seedProblems(prisma: PrismaClient) {

  console.log('🌱 Seeding problems...');

  // 1. localProblems からのシーディング
  console.log('🌱 Seeding questions from local data...');
  for (const p of localProblems) {
    const questionDataForDB = { id: parseInt(p.id, 10), title: p.title.ja, question: p.description.ja, explain: p.explanationText.ja, language_id: 1, genre_id: 1, genreid: 1, difficultyId: p.difficultyId, answerid: 1, term: "不明" };
    await prisma.questions.upsert({
      where: { id: questionDataForDB.id },
      update: {},
      create: questionDataForDB,
    });
  }
  console.log(`✅ Created ${localProblems.length} questions from local data.`);

  console.log('🌱 Seeding problems from Excel file...');
  await seedProblemsFromExcel(prisma);

  // 3. スプレッドシートからのプログラミング問題のシーディング
  console.log('🌱 Seeding programming problems from spreadsheet data...');
  await seedSampleProgrammingProblems(prisma);

  // 4. 選択問題のシーディング (サンプル + Excel)
  console.log('🌱 Seeding selection problems...');
  // サンプルは一旦コメントアウトするか、IDが被らないように注意（今回はExcelを優先するためコメントアウト推奨だが、残す場合はID管理が必要）
  await seedSampleSelectionProblems(prisma); 

  await seedSelectProblemsFromExcel(prisma);

  // 5.基本A問題のシーディング
  await seedBasicInfoAProblems(prisma);

  // 6. 応用情報午前問題のシーディング
  console.log('🌱 Seeding Applied Info AM problems...');
  await seedAppliedInfoAmProblems(prisma);

  // 7. 学園祭用の問題のシーディング
  console.log('🌱 Seeding School Festival problems...');
  await seedSchoolFestivalQuestions(prisma);
}

async function seedProblemsFromExcel(prisma: PrismaClient) {
  const excelFileName = 'PBL2 科目B問題.xlsx';
  const filePath = path.join(WORKSPACE_ROOT, 'app', '(main)', 'issue_list', 'basic_info_b_problem', 'data', excelFileName);

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

        const dataToUpsert = {
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
        };

        await prisma.questions_Algorithm.upsert({
          where: { title: dataToUpsert.title },
          update: dataToUpsert,
          create: dataToUpsert,
        });
      }
      console.log(`   ✅ Upserted questions from sheet: "${config.name}"`);
    }
  } catch (error) { console.error(`❌ Failed to read or process ${excelFileName}:`, error); }
}

async function seedSampleProgrammingProblems(prisma: PrismaClient, creatorId: number = 1) {
  // Googleスプレッドシートからエクスポートしたデータ（にテストケースを追加）
  const spreadsheetProblems = [
    {
        title: 'A + B',
        problemType: 'コーディング問題',
        difficulty: 1,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '標準入出力',
        tags: '["入門", "算術演算"]',
        description: '2つの整数 A と B が与えられます。A と B の和を計算して出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '1\n5', expectedOutput: '6', description: '1 + 5 = 6 です。', order: 1 },
                { input: '10\n20', expectedOutput: '30', description: '10 + 20 = 30 です。', order: 2 }
            ]
        },
        testCases: {
            create: [
                { input: '100\n200', expectedOutput: '300', name: 'ケース1', order: 1 },
                { input: '0\n0', expectedOutput: '0', name: 'ケース2', order: 2 },
                { input: '-5\n5', expectedOutput: '0', name: 'ケース3', order: 3 },
                { input: '12345\n67890', expectedOutput: '80235', name: 'ケース4', order: 4 }
            ]
        }
    },
    // ... (他の問題データは簡潔さのために省略)
  ];

  for (const p of spreadsheetProblems) {
    const { difficulty, ...restOfProblemData } = p;
    const eventDifficultyId = difficulty >= 6 ? 1 : difficulty;

    const data = {
      ...restOfProblemData,
      difficulty: difficulty,
      eventDifficultyId: eventDifficultyId,
    };

    await prisma.programmingProblem.upsert({
      where: { title: p.title },
      update: {
        ...data,
        sampleCases: {
          deleteMany: {},
          create: p.sampleCases.create,
        },
        testCases: {
          deleteMany: {},
          create: p.testCases.create,
        },
      },
      create: {
        ...data,
        sampleCases: {
          create: p.sampleCases.create,
        },
        testCases: {
          create: p.testCases.create,
        },
      },
    });
  }
  console.log(`✅ Upserted ${spreadsheetProblems.length} programming problems from spreadsheet.`);
}

async function seedSampleSelectionProblems(prisma: PrismaClient) {
  // Sample selection problems (4択問題)
  const selectionProblems = [
    {
      title: 'Pythonの変数宣言について',
      description: 'Pythonで変数を宣言する際の正しい記述はどれですか？',
      explanation: 'Pythonでは変数の型を明示的に宣言する必要がありません。値を代入するだけで変数が作成されます。',
      answerOptions: ['int x = 5', 'var x = 5', 'x = 5', 'declare x = 5'],
      correctAnswer: 'x = 5',
      difficultyId: 11,
      subjectId: 4, // プログラミング選択問題
    },
    {
      title: 'JavaScriptの関数定義',
      description: 'JavaScriptで関数を定義する正しい方法はどれですか？',
      explanation: 'JavaScriptでは function キーワードを使って関数を定義します。',
      answerOptions: ['def myFunction():', 'function myFunction() {}', 'void myFunction() {}', 'func myFunction() {}'],
      correctAnswer: 'function myFunction() {}',
      difficultyId: 11,
      subjectId: 4,
    },
    {
      title: 'HTMLの基本構造',
      description: 'HTMLドキュメントの基本的な構造で必須の要素はどれですか？',
      explanation: 'HTMLドキュメントには<!DOCTYPE html>、<html>、<head>、<body>要素が必要です。',
      answerOptions: ['<div>', '<span>', '<html>', '<section>'],
      correctAnswer: '<html>',
      difficultyId: 11,
      subjectId: 4,
    },
    {
      title: 'CSSのセレクタ',
      description: 'CSSでクラス名を指定するセレクタはどれですか？',
      explanation: 'CSSでクラスを指定する際は、クラス名の前にドット(.)を付けます。',
      answerOptions: ['#className', '.className', '@className', '*className'],
      correctAnswer: '.className',
      difficultyId: 11,
      subjectId: 4,
    },
    {
      title: 'データベースの正規化',
      description: '第1正規形の条件として正しいものはどれですか？',
      explanation: '第1正規形では、各属性が原子値（分割できない値）を持つ必要があります。',
      answerOptions: ['重複する行がない', '部分関数従属がない', '推移関数従属がない', '各属性が原子値を持つ'],
      correctAnswer: '各属性が原子値を持つ',
      difficultyId: 11,
      subjectId: 4,
    },
    {
      title: 'アルゴリズムの計算量',
      description: 'バブルソートの最悪時間計算量はどれですか？',
      explanation: 'バブルソートは最悪の場合、すべての要素を比較・交換するため O(n²) の時間計算量になります。',
      answerOptions: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
      correctAnswer: 'O(n²)',
      difficultyId: 11,
      subjectId: 4,
    },
    {
      title: 'オブジェクト指向プログラミング',
      description: 'カプセル化の主な目的はどれですか？',
      explanation: 'カプセル化は、データと処理を一つにまとめ、外部からの直接アクセスを制限することで、データの整合性を保つことが主な目的です。',
      answerOptions: ['処理速度の向上', 'メモリ使用量の削減', 'データの隠蔽と保護', 'コードの短縮'],
      correctAnswer: 'データの隠蔽と保護',
      difficultyId: 11,
      subjectId: 4,
    },
    {
      title: 'ネットワークプロトコル',
      description: 'HTTPSで使用される暗号化プロトコルはどれですか？',
      explanation: 'HTTPSはHTTPにTLS/SSL暗号化を追加したプロトコルです。',
      answerOptions: ['FTP', 'SSH', 'TLS/SSL', 'SMTP'],
      correctAnswer: 'TLS/SSL',
      difficultyId: 11,
      subjectId: 4,
    },
    {
      title: 'データ構造：スタック',
      description: 'スタックのデータ取得方式として正しいものはどれですか？',
      explanation: 'スタックはLIFO（Last In, First Out）方式で、最後に入れたデータを最初に取り出します。',
      answerOptions: ['FIFO', 'LIFO', 'Random Access', 'Sequential Access'],
      correctAnswer: 'LIFO',
      difficultyId: 11,
      subjectId: 4,
    },
    {
      title: 'SQLの基本操作',
      description: 'データベースからデータを取得するSQLコマンドはどれですか？',
      explanation: 'SELECT文はデータベースからデータを検索・取得するために使用されます。',
      answerOptions: ['INSERT', 'UPDATE', 'DELETE', 'SELECT'],
      correctAnswer: 'SELECT',
      difficultyId: 11,
      subjectId: 4,
    }
  ];

  for (const problem of selectionProblems) {
    await prisma.selectProblem.upsert({
      where: { title: problem.title },
      update: problem,
      create: problem,
    });
  }
  console.log(`✅ Upserted ${selectionProblems.length} selection problems.`);
}



/**
 * ▼▼▼ 新規追加: 選択問題をExcelからシードする関数 ▼▼▼
 */
async function seedSelectProblemsFromExcel(prisma: PrismaClient) {
  console.log('🌱 Seeding Selection Problems from Excel file...');

  // ファイル名とシート名
  const excelFileName = 'PBL3_4択問題ベースシート .xlsx';
  const sheetName = '4択問題統合用シート';

  // ファイルパス: /app/(main)/issue_list/selects_problems/data/ にあると想定
  // もしなければ適切なパスに変更してください
  const filePath = path.join(WORKSPACE_ROOT, 'app', '(main)', 'issue_list', 'selects_problems', 'data', excelFileName);

  // 難易度ID 11 (選択問題) と 科目ID 4 (選択問題)
  const TARGET_DIFFICULTY_ID = 11;
  const TARGET_SUBJECT_ID = 4;

  try {
    if (!fs.existsSync(filePath)) {
        console.warn(` ⚠️ File not found: ${filePath}. Skipping SelectProblem seeding.`);
        return;
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      console.warn(` ⚠️ Sheet "${sheetName}" not found in ${excelFileName}. Skipping.`);
      return;
    }

    // ヘッダー定義 (CSVの列順に合わせる)
    const headers = [
      'id',             // A列
      'title',          // B列
      'description',    // C列
      'explanation',    // D列
      'answerOptions',  // E列
      'correctAnswer',  // F列
      'difficultyId',   // G列 (Excel上は11になっているはず)
      'difficulty',     // H列
      'subjectId',      // I列 (Excel上は4)
      'subject',        // J列
      'assignment',     // K列
      'category',       // L列
      'sourceNumber',   // M列
      'sourceYear',     // N列
      'imageFileName',  // O列
    ];

    const records = XLSX.utils.sheet_to_json(sheet, {
        header: headers,
        range: 2 // 3行目からデータ開始 (0-indexedで2)
    }) as any[];

    console.log(` 🔍 Found ${records.length} records in sheet "${sheetName}".`);

    // 正解文字(A,B,C,D)をインデックス(0,1,2,3)に変換するマップ
    // 基本A問題と同様のロジックでテキストを抽出するため
    const answerIndexMap: { [key: string]: number } = { 
        'A': 0, 'B': 1, 'C': 2, 'D': 3,
        'ア': 0, 'イ': 1, 'ウ': 2, 'エ': 3 
    };

    let upsertedCount = 0;
    let processedRowCount = 0;

    for (const record of records) {
      processedRowCount++;

      // IDのパース
      const problemId = parseInt(String(record.id).trim(), 10);
      if (isNaN(problemId)) {
          // IDがない行はスキップ
          continue;
      }

      if (!record.title || String(record.title).trim() === '') {
          continue;
      }

      // 選択肢のパース
      const parsedOptions = parseAnswerOptionsText(record.answerOptions);
      if (!parsedOptions) {
        console.warn(` ⚠️ Failed to parse options for ID ${problemId}: "${record.title}". Skipping.`);
        continue;
      }

      // 正解の処理: "D" -> インデックス3 -> parsedOptions[3] (テキスト) を取得
      const correctChar = String(record.correctAnswer).trim().toUpperCase(); // "D"
      const correctIndex = answerIndexMap[correctChar];
      
      if (correctIndex === undefined || !parsedOptions[correctIndex]) {
          console.warn(` ⚠️ Invalid correct answer "${correctChar}" for ID ${problemId}. Skipping.`);
          continue;
      }
      // SelectProblemモデルは正解の「テキスト」を保存する仕様 (schema参照: correctAnswer String)
      const correctAnswerText = parsedOptions[correctIndex];
      
      // 暫定対応: description に画像を含める
      let descriptionToSave = String(record.description || "");
      const rawImageName = record.imageFileName ? String(record.imageFileName).trim() : null;
      if (rawImageName) {
          // フロントエンドがMarkdown画像を解釈できる前提
          descriptionToSave += `\n\n![問題画像](/images/select_problems/${rawImageName})`;
      }

      const dataToSave = {
          title: String(record.title),
          description: descriptionToSave,
          explanation: String(record.explanation || ""),
          answerOptions: parsedOptions, // JSON配列
          correctAnswer: correctAnswerText, // テキストで保存
          difficultyId: TARGET_DIFFICULTY_ID, // 11: 選択問題
          subjectId: TARGET_SUBJECT_ID,       // 4: 選択問題
      };

      try {
        await prisma.selectProblem.upsert({
            where: { title: dataToSave.title },
            update: dataToSave,
            create: dataToSave,
        });
        upsertedCount++;
      } catch (error: any) {
          console.error(`❌ Error upserting SelectProblem ID ${problemId}: ${error.message}`);
      }
    }

    console.log(` ✅ Processed ${records.length} rows. Upserted ${upsertedCount} Select Problems.`);

  } catch (error) {
    console.error(`❌ Failed to read or process ${excelFileName}:`, error);
  }
}

/**
 * 画像ディレクトリをスキャンし、IDをキーとしたファイル名のマップを作成します。
 * (例: '1' => 'basic-a-examption-7-7-1.png')
 * @returns Map<string, string>
 */
function createImageFileMap(): Map<string, string> {
  // 1. /src/public/images/basic_a/ の絶対パスを取得
  const imageDir = path.join(
    WORKSPACE_ROOT,
    'public',
    'images',
    'basic_a'
  );
  console.log(` 🔍 Scanning for images in: ${imageDir}`);

  const fileNameMap = new Map<string, string>();
  
  try {
    // 2. ディレクトリ内の全ファイル名を同期的に読み込む
    const files = fs.readdirSync(imageDir);
    
    // 3. ファイル名からIDを抽出するための正規表現 (末尾の "-数字.png" にマッチ)
    const idRegex = /-(\d+)\.png$/;

    for (const fileName of files) {
      const match = fileName.match(idRegex);
      
      if (match && match[1]) {
        // match[1] にはキャプチャされた数字(ID)が入る
        const fileId = match[1];
        // マップに登録 (例: '1' => 'basic-a-examption-7-7-1.png')
        fileNameMap.set(fileId, fileName);
      }
    }
    console.log(` ✅ Found and mapped ${fileNameMap.size} image files.`);
  } catch (error: any) {
    // ディレクトリが存在しない場合などのエラー
    console.error(`❌ Error scanning image directory: ${error.message}`);
    console.warn(' ⚠️ Image path generation will fail. Make sure the directory exists: /public/images/basic_a/');
  }

  return fileNameMap;
}

/**
 * 応用情報AM問題: 画像ディレクトリをスキャン
 */
function createAppliedAmImageFileMap(): Map<string, string> {
  // 1. /src/public/images/applied_am/ の絶対パスを取得
const imageDir = path.join(
    // ✅ 修正: WORKSPACE_ROOT から 'public' を結合
    WORKSPACE_ROOT,
    'public',
    'images',
    'applied_am'
  );
  console.log(` 🔍 Scanning for images in: ${imageDir}`);

  const fileNameMap = new Map<string, string>();
  
  try {
    // 2. ディレクトリ内の全ファイル名を同期的に読み込む
    const files = fs.readdirSync(imageDir);
    
    // 3. ファイル名からIDを抽出するための正規表現 (末尾の "-数字.png" にマッチ)
    // (もしファイル名の命名規則が違う場合は、この正規表現を調整してください)
    const idRegex = /-(\d+)\.png$/; 

    for (const fileName of files) {
      const match = fileName.match(idRegex);
      
      if (match && match[1]) {
        const fileId = match[1];
        fileNameMap.set(fileId, fileName);
      }
    }
    console.log(` ✅ Found and mapped ${fileNameMap.size} image files.`);
  } catch (error: any) {
    // ディレクトリが存在しない場合などのエラー
    console.error(`❌ Error scanning image directory: ${error.message}`);
    console.warn(' ⚠️ Image path generation will fail. Make sure the directory exists: /public/images/applied_am/');
  }

  return fileNameMap;
}

/**
 * answerOptions のテキストを配列に変換するヘルパー関数
 * "A：... B：..." や "ア：... イ：..." に対応
 */
function parseAnswerOptionsText(text: string): string[] | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // 前処理: 改行をスペースに、連続するスペース（全角含む）を単一の半角スペースに
  const cleanedText = text
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\s　]+/g, ' ')
    .trim();

  // パターン1: ア： イ： ウ： エ：
  const markersJP = ['ア：', 'イ：', 'ウ：', 'エ：'];
  // パターン2: A： B： C： D： (全角コロン)
  const markersEnFull = ['A：', 'B：', 'C：', 'D：'];
  // パターン3: A: B: C: D: (半角コロン)
  const markersEnHalf = ['A:', 'B:', 'C:', 'D:'];

  let markers = markersJP;
  
  // どのマーカーセットを使うか判定
  if (cleanedText.includes(markersEnFull[0])) {
    markers = markersEnFull;
  } else if (cleanedText.includes(markersEnHalf[0])) {
    markers = markersEnHalf;
  }

  const markerPositions: { [key: string]: number } = {};
  let searchStartIndex = 0;

  for (const marker of markers) {
    const index = cleanedText.indexOf(marker, searchStartIndex);
    if (index === -1) {
      // マーカーが見つからない場合、他のパターンも試すか、失敗としてnullを返す
      // ここでは厳密に4つ揃うことを期待する
      // console.warn(` ⚠️ Marker "${marker}" not found.`);
      return null; 
    }
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
 * 基本情報A問題（PBL3基本Aデータ使用.xlsx - 基本情報A問題統合用シート）をデータベースにシードする
 * [修正版] 新しいExcelファイル/シートに対応 + createに戻す
 */
async function seedBasicInfoAProblems(prisma: PrismaClient) {
  console.log('🌱 Seeding Basic Info A problems from Excel file...');

  const excelFileName = 'PBL3基本Aデータ使用.xlsx';
  const sheetName = '基本情報A問題統合用シート';
  const filePath = path.join(WORKSPACE_ROOT, 'app', '(main)', 'issue_list', 'basic_info_a_problem', 'data', excelFileName);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      console.warn(` ⚠️ Sheet "${sheetName}" not found in ${excelFileName}. Skipping.`);
      return;
    }

    const headers = [ 'id', 'title', 'description', 'explanation', 'answerOptions', 'correctAnswer', 'difficultyId', 'difficulty', 'subjectId', 'subject', 'assignment', 'category', 'source', 'sourceYear', 'imageFileName' ];
    const records = XLSX.utils.sheet_to_json(sheet, { header: headers, range: 2 }) as any[];

    console.log(` 🔍 Found ${records.length} records in sheet "${sheetName}".`);
    if (records.length === 0) {
      console.warn(' ⚠️ No data records found.');
      return;
    }

    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const categoryNameToDbNameMap: { [key: string]: string } = { '1': 'テクノロジ系', '2': 'マネジメント系', '3': 'ストラテジ系', '基礎理論': 'テクノロジ系', 'コンピュータシステム': 'テクノロジ系', '開発技術': 'テクノロジ系', 'ネットワーク': 'テクノロジ系', 'セキュリティ': 'テクノロジ系', 'データベース': 'テクノロジ系', 'プロジェクトマネジメント': 'マネジメント系', 'サービスマネジメント': 'マネジメント系', 'システム監査': 'マネジメント系', 'システム戦略': 'ストラテジ系', '企業と法務': 'ストラテジ系', '経営戦略': 'ストラテジ系', 'AIとディープラーニング': 'テクノロジ系', 'モータの回転速度の制御方法': 'テクノロジ系', 'オブジェクト指向プログラミング（オーバーライド）': 'テクノロジ系', 'USB3.0の技術': 'テクノロジ系', 'メモリリーク': 'テクノロジ系', 'APIについて': 'テクノロジ系', 'DBMSとスキーマ': 'テクノロジ系', 'E-R図の説明': 'テクノロジ系', 'SQL文の条件式': 'テクノロジ系', 'Javaとデータベース、API': 'テクノロジ系', 'TCP/IPとプロトコル': 'テクノロジ系', 'Webサーバとネット中継': 'テクノロジ系', 'リバースブルートフォース攻撃の説明': 'テクノロジ系', 'メッセージのハッシュ値とデジタル署名': 'テクノロジ系', 'サイバー情報共有イニシアチブ': 'テクノロジ系', 'VDIのセキュリティと保護動作': 'テクノロジ系', 'オブジェクト指向とカプセル化': 'テクノロジ系', 'プログラムのテストとデータ': 'テクノロジ系', 'ソフトウェアとリバースエンジニアリング': 'テクノロジ系', 'スクラムと生産量': 'マネジメント系', 'エクストリームプログラミングとリファクタリング': 'マネジメント系', 'オペレーションサービスと必要人数': 'マネジメント系', 'システム監査と真正性の検証': 'マネジメント系', 'エンタープライスアーキテクチャと業務と情報システム': 'ストラテジ系', 'ハイブリッドクラウドとは？': 'ストラテジ系', 'CSRの調達': 'ストラテジ系', 'プロダクトポートフォリオマネジメントと4つの分類': 'ストラテジ系', '戦略遂行と施策を策定する経営管理手法': 'ストラテジ系', '３PLの説明': 'ストラテジ系', 'セル生産方式の利点': 'ストラテジ系', 'マトリックス組織について': 'ストラテジ系', '定量発注方式と発注点計算': 'ストラテジ系', '売上原価の計算': 'ストラテジ系', '著作権とクリエイティブコモンズ': 'ストラテジ系', '真理値表': 'テクノロジ系', 'ASCIIコード': 'テクノロジ系', 'アクセス時間の計算': 'テクノロジ系', '稼働率': 'テクノロジ系', 'ロジックマッシュアップ': 'テクノロジ系', '液晶ディスプレイなどの表示装置': 'テクノロジ系', 'DBMS に実装すべき原子性': 'テクノロジ系', 'LAN 間接続装置': 'テクノロジ系', 'ペネトレーションテスト': 'テクノロジ系', 'SQL インジェクションの対策': 'テクノロジ系', 'ソフトウェアの結合テスト': 'テクノロジ系', 'アジャイル開発手法': 'マネジメント系', 'アローダイアグラム': 'マネジメント系', '新規サービスの設計及び移行を進めるための方法': 'マネジメント系', 'ビッグデータ分析': 'ストラテジ系', 'コアコンピタンス': 'ストラテジ系', 'ブルーオーシャン': 'ストラテジ系', 'HR テック': 'ストラテジ系', '散布図': 'ストラテジ系', '産業財産権': 'ストラテジ系', 'テクノロジ系': 'テクノロジ系', 'マネジメント系': 'マネジメント系', 'ストラテジ系': 'ストラテジ系' };
    const defaultDifficulty = await prisma.difficulty.findUnique({ where: { name: '基本資格A問題' } });
    const defaultSubject = await prisma.subject.findUnique({ where: { name: '基本情報A問題' } });

    if (!defaultDifficulty || !defaultSubject) {
        console.error('❌ Master data error: Default Difficulty or Subject not found.');
        return;
    }
    const answerMap: { [key: string]: number } = { 'ア': 0, 'イ': 1, 'ウ': 2, 'エ': 3 };

    let upsertedCount = 0;
    let processedRowCount = 0;

    for (const record of records) {
      processedRowCount++;

      if (!record.id || !record.title || String(record.title).trim() === '') {
          continue;
      }

      const rawCategoryValue = record.category ? String(record.category).trim() : undefined;
      let mappedDbCategoryName: string | undefined = rawCategoryValue ? categoryNameToDbNameMap[rawCategoryValue] : undefined;
      let category = categories.find(c => c.name === mappedDbCategoryName) || categories.find(c => c.name === 'テクノロジ系');
      
      if (!category) {
        console.warn(` ⚠️ [Category mismatch/unmapped] Row ${processedRowCount + 2}: Excel value: "${rawCategoryValue}". Skipping: "${record.title}"`);
        continue;
      }

      const parsedOptions = parseAnswerOptionsText(record.answerOptions);
      if (!parsedOptions) {
        console.warn(` ⚠️ Failed to parse answerOptions text for Row ${processedRowCount + 2}, problem: "${record.title}". Skipping.`);
        continue;
      }
      
      const correctAnswerIndex = answerMap[String(record.correctAnswer).trim()];
      if (correctAnswerIndex === undefined) {
         console.warn(` ⚠️ Invalid correct answer "${String(record.correctAnswer).trim()}" for Row ${processedRowCount + 2}, problem: "${record.title}". Skipping.`);
         continue;
      }

      const rawImageName = record.imageFileName ? String(record.imageFileName).trim() : null;
      let imagePath = rawImageName ? `/images/basic_a/${rawImageName}` : null;

      const dataToSave = {
          title: String(record.title),
          description: String(record.description || ""),
          explanation: String(record.explanation || ""),
          answerOptions: parsedOptions,
          correctAnswer: correctAnswerIndex,
          sourceYear: String(record.sourceYear || '不明'),
          sourceNumber: String(record.source || '不明'),
          difficultyId: defaultDifficulty.id,
          subjectId: defaultSubject.id,
          categoryId: category.id,
          imagePath: imagePath
      };

      try {
          await prisma.basic_Info_A_Question.upsert({
            where: { title: dataToSave.title },
            update: dataToSave,
            create: dataToSave,
          });
          upsertedCount++;
      } catch (error: any) {
          console.error(`❌ Error upserting record for Row ${processedRowCount + 2}, Title: "${record.title}". Error: ${error.message}`);
      }
    }

    console.log(` ✅ Processed ${records.length} rows. Upserted ${upsertedCount} Basic Info A questions.`);

  } catch (error) {
    console.error(`❌ Failed to read or process ${excelFileName}:`, error);
  }
}

/**
 * 応用情報午前問題 をデータベースにシードする
 * (seedBasicInfoAProblems をコピーして作成)
 */
async function seedAppliedInfoAmProblems(prisma: PrismaClient) {
  console.log('🌱 Seeding Applied Info AM problems from Excel file...');

  const excelFileName = 'PBL3応用午前統合版.xlsx';
  const sheetName = '応用情報午前問題統合用シート';
  const filePath = path.join(WORKSPACE_ROOT, 'app', '(main)', 'issue_list', 'applied_info_morning_problem', 'data', excelFileName);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      console.warn(` ⚠️ Sheet "${sheetName}" not found in ${excelFileName}. Skipping Applied AM seeding.`);
      return;
    }

    const headers = [ 'id', 'title', 'description', 'explanation', 'answerOptions', 'correctAnswer', 'difficultyId', 'difficulty', 'subjectId', 'subject', 'assignment', 'category', 'source', 'sourceYear', 'imageFileName', ];
    const records = XLSX.utils.sheet_to_json(sheet, { header: headers, range: 2 }) as any[];

    console.log(` 🔍 Found ${records.length} records in sheet "${sheetName}".`);
    if (records.length === 0) {
      console.warn(' ⚠️ No data records found.');
      return;
    }

    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const categoryNameToDbNameMap: { [key: string]: string } = { '1': 'テクノロジ系', '2': 'マネジメント系', '3': 'ストラテジ系', '基礎理論': 'テクノロジ系', 'コンピュータシステム': 'テクノロジ系', '開発技術': 'テクノロジ系', 'ネットワーク': 'テクノロジ系', 'セキュリティ': 'テクノロジ系', 'データベース': 'テクノロジ系', 'プロジェクトマネジメント': 'マネジメント系', 'サービスマネジメント': 'マネジメント系', 'システム監査': 'マネジメント系', 'システム戦略': 'ストラテジ系', '企業と法務': 'ストラテジ系', '経営戦略': 'ストラテジ系', 'AIとディープラーニング': 'テクノロジ系', 'モータの回転速度の制御方法': 'テクノロジ系', 'オブジェクト指向プログラミング（オーバーライド）': 'テクノロジ系', 'USB3.0の技術': 'テクノロジ系', 'メモリリーク': 'テクノロジ系', 'APIについて': 'テクノロジ系', 'DBMSとスキーマ': 'テクノロジ系', 'E-R図の説明': 'テクノロジ系', 'SQL文の条件式': 'テクノロジ系', 'Javaとデータベース、API': 'テクノロジ系', 'TCP/IPとプロトコル': 'テクノロジ系', 'Webサーバとネット中継': 'テクノロジ系', 'リバースブルートフォース攻撃の説明': 'テクノロジ系', 'メッセージのハッシュ値とデジタル署名': 'テクノロジ系', 'サイバー情報共有イニシアチブ': 'テクノロジ系', 'VDIのセキュリティと保護動作': 'テクノロジ系', 'オブジェクト指向とカプセル化': 'テクノロジ系', 'プログラムのテストとデータ': 'テクノロジ系', 'ソフトウェアとリバースエンジニアリング': 'テクノロジ系', 'スクラムと生産量': 'マネジメント系', 'エクストリームプログラミングとリファクタリング': 'マネジメント系', 'オペレーションサービスと必要人数': 'マネジメント系', 'システム監査と真正性の検証': 'マネジメント系', 'エンタープライスアーキテクチャと業務と情報システム': 'ストラテジ系', 'ハイブリッドクラウドとは？': 'ストラテジ系', 'CSRの調達': 'ストラテジ系', 'プロダクトポートフォリオマネジメントと4つの分類': 'ストラテジ系', '戦略遂行と施策を策定する経営管理手法': 'ストラテジ系', '３PLの説明': 'ストラテジ系', 'セル生産方式の利点': 'ストラテジ系', 'マトリックス組織について': 'ストラテジ系', '定量発注方式と発注点計算': 'ストラテジ系', '売上原価の計算': 'ストラテジ系', '著作権とクリエイティブコモンズ': 'ストラテジ系', '真理値表': 'テクノロジ系', 'ASCIIコード': 'テクノロジ系', 'アクセス時間の計算': 'テクノロジ系', '稼働率': 'テクノロジ系', 'ロジックマッシュアップ': 'テクノロジ系', '液晶ディスプレイなどの表示装置': 'テクノロジ系', 'DBMS に実装すべき原子性': 'テクノロジ系', 'LAN 間接続装置': 'テクノロジ系', 'ペネトレーションテスト': 'テクノロジ系', 'SQL インジェクションの対策': 'テクノロジ系', 'ソフトウェアの結合テスト': 'テクノロジ系', 'アジャイル開発手法': 'マネジメント系', 'アローダイアグラム': 'マネジメント系', '新規サービスの設計及び移行を進めるための方法': 'マネジメント系', 'ビッグデータ分析': 'ストラテジ系', 'コアコンピタンス': 'ストラテジ系', 'ブルーオーシャン': 'ストラテジ系', 'HR テック': 'ストラテジ系', '散布図': 'ストラテジ系', '産業財産権': 'ストラテジ系', 'テクノロジ系': 'テクノロジ系', 'マネジメント系': 'マネジメント系', 'ストラテジ系': 'ストラテジ系' };
    const defaultDifficulty = await prisma.difficulty.findUnique({ where: { name: '応用資格午前問題' } });
    const defaultSubject = await prisma.subject.findUnique({ where: { name: '応用情報午前問題' } });

    if (!defaultDifficulty || !defaultSubject) {
      console.error('❌ Master data error: Default Difficulty (応用資格午前問題) or Subject (応用情報午前問題) not found.');
      return;
    }
    const answerMap: { [key: string]: number } = { 'ア': 0, 'イ': 1, 'ウ': 2, 'エ': 3 };

    let upsertedCount = 0;
    let processedRowCount = 0;

    for (const record of records) {
      processedRowCount++;

      if (!record.id || !record.title || String(record.title).trim() === '') {
        continue;
      }

      const rawCategoryValue = record.category ? String(record.category).trim() : undefined;
      let mappedDbCategoryName: string | undefined = rawCategoryValue ? categoryNameToDbNameMap[rawCategoryValue] : undefined;
      let category = categories.find(c => c.name === mappedDbCategoryName) || categories.find(c => c.name === 'テクノロジ系');
      if (!category) {
        console.warn(` ⚠️ [Category mismatch/unmapped] Row ${processedRowCount + 2}: Excel value: "${rawCategoryValue}". Skipping: "${record.title}"`);
        continue;
      }

      const parsedOptions = parseAnswerOptionsText(record.answerOptions);
      if (!parsedOptions) {
        console.warn(` ⚠️ Failed to parse answerOptions text for Row ${processedRowCount + 2}, problem: "${record.title}". Skipping.`);
        continue;
      }

      const correctAnswerIndex = answerMap[String(record.correctAnswer).trim()];
      if (correctAnswerIndex === undefined) {
        console.warn(` ⚠️ Invalid correct answer "${String(record.correctAnswer).trim()}" for Row ${processedRowCount + 2}, problem: "${record.title}". Skipping.`);
        continue;
      }

      const rawImageName = record.imageFileName ? String(record.imageFileName).trim() : null;
      let imagePath = rawImageName ? `/images/applied_am/${rawImageName}` : null;

      const dataToSave = {
        title: String(record.title),
        description: String(record.description || ""),
        explanation: String(record.explanation || ""),
        answerOptions: parsedOptions,
        correctAnswer: correctAnswerIndex,
        sourceYear: String(record.sourceYear || '不明'),
        sourceNumber: String(record.source || '不明'),
        difficultyId: defaultDifficulty.id,
        subjectId: defaultSubject.id,
        categoryId: category.id,
        imagePath: imagePath
      };

      try {
        await prisma.applied_am_Question.upsert({
          where: { title: dataToSave.title },
          update: dataToSave,
          create: dataToSave,
        });
        upsertedCount++;
      } catch (error: any) {
        console.error(`❌ Error upserting record for Row ${processedRowCount + 2}, Title: "${record.title}". Error: ${error.message}`);
      }
    }
    console.log(` ✅ Processed ${records.length} rows. Upserted ${upsertedCount} Applied Info AM questions.`);
  } catch (error) {
    console.error(`❌ Failed to read or process ${excelFileName}:`, error);
  }
}