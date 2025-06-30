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

  // 既存のユーザーデータをクリーンアップする場合（開発環境のみで推奨）
  // await prisma.user.deleteMany({});
  // console.log("🗑️ Cleared existing user data.");

  // シーディングするユーザーデータ
  const usersToSeed = [
    {
      email: 'alice@example.com',
      password: 'password123', // ⚠️ 実際にはハッシュ化する
      username: 'Alice Smith',
      year: 2020,
      class: 1,
      birth: new Date('2002-04-15'), // Null不可なので必ず日付を指定
    },
    {
      email: 'bob@example.com',
      password: 'securepassword', // ⚠️ 実際にはハッシュ化する
      username: 'Bob Johnson',
      year: 2021,
      class: 2,
      birth: new Date('2003-08-20'),
    },
    {
      email: 'charlie@example.com',
      password: 'anotherpassword', // ⚠️ 実際にはハッシュ化する
      username: 'Charlie Brown',
      year: 2020,
      class: 3,
      birth: new Date('2002-11-05'),
    },
  ];

  // 各ユーザーデータをデータベースに挿入または更新
  for (const userData of usersToSeed) {
    // ⚠️ パスワードをハッシュ化する処理をここに追加してください
    // 例: const hashedPassword = await bcrypt.hash(userData.password, 10);
    // userData.password = hashedPassword; // ハッシュ化されたパスワードで上書き

    const user = await prisma.user.upsert({
      where: { email: userData.email }, // emailで既存ユーザーを検索
      update: userData, // 既存ユーザーがいれば更新
      create: userData, // 既存ユーザーがいなければ新規作成
    });
    console.log(`✅ Upserted user with ID: ${user.id} and email: ${user.email}`);
  }

  console.log(`🎉 Seeding finished successfully.`);
  console.log(`\n🌱 Seeding problems...`);

  // --- 既存の問題・解答データを一度リセットします ---
  // これにより、何度seedを実行してもデータが重複せず、常に最新の状態に保たれます。
  // 注意: UserAnswerはProblemに依存しているため、必ず先に削除する必要があります。
  if (await prisma.userAnswer.count() > 0) {
    await prisma.userAnswer.deleteMany();
    console.log("🗑️ Cleared existing user answer data.");
  }
  if (await prisma.problem.count() > 0) {
    await prisma.problem.deleteMany();
    console.log("🗑️ Cleared existing problem data.");
  }

  // --- `problems.ts` のデータをループしてDBに登録します ---
  for (const p of localProblems) {
    // `problems.ts`のデータ形式から、DBスキーマに合わせたオブジェクトを作成します
    const problemDataForDB = {
      // `problems.ts`のidは文字列なので、DBのInt型に合わせて数値に変換します
      id: parseInt(p.id, 10),
      
      // テキスト情報を格納
      title_ja: p.title.ja,
      title_en: p.title.en,
      description_ja: p.description.ja,
      description_en: p.description.en,
      explanation_ja: p.explanationText.ja,
      explanation_en: p.explanationText.en,
      programLines_ja: p.programLines.ja,
      programLines_en: p.programLines.en,
      
      // 正解と、JSON/配列型のカラム
      correctAnswer: p.correctAnswer,
      answerOptions_ja: p.answerOptions.ja as unknown as Prisma.JsonArray,
      answerOptions_en: p.answerOptions.en as unknown as Prisma.JsonArray,
      initialVariables: p.initialVariables as unknown as Prisma.JsonObject,
      options: (p.traceOptions as unknown as Prisma.JsonObject) ?? Prisma.JsonNull,
      
      logicType: p.logicType,
    };

    // 変換したデータを使って、データベースに新しい問題を作成します
    const problem = await prisma.problem.create({
      data: problemDataForDB,
    });
    console.log(`✅ Created problem: "${problem.title_ja}" (ID: ${problem.id})`);
  }

  // --- Excelファイルからのデータ登録 ---
  console.log(`\n🌱 Seeding problems from Excel file...`);
  
  // 次に登録すべき問題IDを計算（ローカル問題の最後のID + 1）
  let nextProblemId = localProblems.length + 1;
  console.log(`   Starting Excel problems from ID: ${nextProblemId}`);
  
  const excelFileName = 'PBL2 科目B問題.xlsx';
  const sheetConfigs = [
    { name: '基本情報科目B基礎', range: 'B2:G16' },
    { name: '基本情報科目B応用', range: 'B2:G16' }
  ];
  const headers = [
    'title_ja', 'description_ja', 'programLines_ja', 'answerOptions_ja', 'correctAnswer', 'explanation_ja'
  ];

  const filePath = path.join(__dirname, '..', 'app', '(main)', 'issue_list', 'basic_info_b_problem', 'data', excelFileName);
  console.log(`  - Reading Excel file: ${filePath}`);

    try {
      const workbook = XLSX.readFile(filePath);
    
      for (const config of sheetConfigs) {
          console.log(`  - Processing sheet: "${config.name}"`);
          const sheet = workbook.Sheets[config.name];
          if (!sheet) {
              console.warn(`  ⚠️ Sheet "${config.name}" not found in the Excel file. Skipping.`);
              continue;
          }
        
          // 指定した範囲とヘッダーでデータを抽出
          const records = XLSX.utils.sheet_to_json(sheet, {
            range: config.range,
            header: headers
        });
        
          // 各行をデータベースに登録
          for (const record of records) {
              const problemData = transformRowToProblem(record);
              
              // IDを明示的に指定して登録
              await prisma.problem.create({
                  data: {
                    id: nextProblemId, // ★カウンターからIDを指定
                    ...problemData
                },
              });
              console.log(`  ✅ Created problem from Excel: "${problemData.title_ja}" (ID: ${nextProblemId})`);
              nextProblemId++; // ★次の問題のためにIDをインクリメント
          }
      }
    } catch (error) {
      console.error(`❌ Failed to read or process ${excelFileName}:`, error);
    }

  console.log(`\n🎉 Seeding finished successfully.`);

  // =================================================================
  // Step 1: Difficulty（難易度）のマスターデータを作成する
  // =================================================================
  console.log('Seeding difficulties...');
  const difficultiesToSeed = [
    { name: 'やさしい',   xp: 200 },
    { name: 'かんたん', xp: 400 },
    { name: 'ふつう',   xp: 800 },
    { name: 'むずかしい',   xp: 1200 },
    { name: '鬼むず',   xp: 2000 },
    { name: '基本資格A問題',   xp: 40 },
    { name: '基本資格B問題(かんたん)',   xp: 120 },
    { name: '基本資格B問題(かんたん)',   xp: 280 },
    { name: '応用資格午前問題',   xp: 60 },
    { name: '応用資格午後問題',   xp: 1200 },
  ];

  for (const d of difficultiesToSeed) {
    await prisma.difficulty.upsert({
      where: { name: d.name },
      update: {},
      create: { name: d.name, xp: d.xp },
    });
  }
  console.log('✅ Difficulties seeded.');
  
  // =================================================================
  // Step 2: Subject（科目）のマスターデータを作成する
  // =================================================================
  console.log('Seeding subjects...');
  // ... (科目作成のコードは変更なし) ...
  const subjectsToSeed = [ 
    { id: 1, name: 'プログラミング' },
    { id: 2, name: '基本情報A問題'},
    { id: 3, name: '基本情報B問題'},
   ]; // 短縮例
  for (const s of subjectsToSeed) {
    await prisma.subject.upsert({
      where: { id: s.id }, update: {}, create: { id: s.id, name: s.name },
    });
  }
  console.log('✅ Subjects seeded.');

  // =================================================================
  // Step 3: Userデータを作成する
  // =================================================================
  console.log('Seeding users...');
  // ... (ユーザー作成のコードは変更なし) ...
  const alice = await prisma.user.upsert({
    where: { email: 'bob@example.com' }, update: {}, create: { email: 'alice@example.com', password: 'password123', username: 'Alice Smith', birth: new Date('2002-04-15') },
  });
  console.log('✅ Users seeded.');
  
  // =================================================================
  // Step 4: addXpのテストを、難易度名を使って行うように変更
  // =================================================================
  console.log('Testing addXp function with difficulty...');
  if (alice) {
    // Aliceさんに「プログラミング(subjectId: 1)」を「むずかしい」難易度でクリアしたとしてXPを加算
    // addXp関数側で 'むずかしい' に対応するXP(1200)を調べて加算してくれる
    await addXp(alice.id, 1, 'むずかしい'); 
  }
  
  console.log('🎉 Seeding and testing finished successfully.');

}

function transformRowToProblem(row: any): Omit<Prisma.ProblemCreateInput, 'id'> {
    /**
     * プログラムコード（複数行の文字列）を改行で分割して文字列の配列に変換するヘルパー関数
     * @param str Excelから読み込んだプログラムの文字列
     * @returns Prismaの programLines_ja にセットするための文字列配列 (例: ["part1", "part2"])
     */
    const parseProgramLines = (str: string | undefined): string[] => {
        if (!str) return [];
        // 文字列を改行文字で分割する
        return str.split(/\r?\n/).filter(part => part.trim() !== '');
    };

    /**
     * 選択肢（複数行の文字列）を "ラベル" と "値" のオブジェクト配列に変換するヘルパー関数
     * @param str Excelから読み込んだ選択肢の文字列 (例: "ア. Option A\nイ. Option B")
     * @returns Prismaの answerOptions_ja にセットするためのJSONオブジェクト配列 (例: [{label: "ア", value: "Option A"},...])
     */
    const parseAnswerOptions = (str: string | undefined): Prisma.JsonArray => {
        if (!str) return [];
        const options: { label: string; value: string }[] = [];
        let parts = str.split(/　+(?=[ア-ン])/).filter(part => part.trim() !== '');

        // 1. 入力文字列に改行文字が含まれているかチェック
        if (str.includes('\n')) {
            // 【応用形式の処理】改行で分割する
            parts = str.split(/\r?\n/);
        } else {
            // 【基礎形式の処理】「全角スペース＋カタカナ」で分割する
            parts = str.split(/　+(?=[ア-ン])/);
        }

        parts.forEach(part => {
            // "ア." や "ア " のような形式からラベルと選択肢本文を抽出する正規表現
            const match = part.match(/^([ア-ン])[\s．.](.*)$/);
            if (match) {
                options.push({
                    label: match[1].trim(), // 例: "ア"
                    value: match[2].trim()  // 例: "Option A"
                });
            } else if (part.trim()) {
                // 正規表現にマッチしないが、空行でもない場合（単純な選択肢など）
                 // 暫定的にlabelを空、valueをその行のテキストとして追加するなど、仕様に応じて調整
                 // ここでは、ラベルがないものは無視する実装とします。
            }
        });
        return options as unknown as Prisma.JsonArray;
    };
 
    // initialVariablesをJSONオブジェクトに変換
    // こちらは既存のままで問題ない可能性が高いですが、念のため堅牢化します。
    const parseJsonObject = (str: string) => {
        try {
            if (!str || str.trim() === '{}' || str.trim() === '') return {};
            // シングルクォートをダブルクォートに置換してJSONとしてパース
            return JSON.parse(str.replace(/'/g, '"'));
        } catch(e) {
            // JSONパースに失敗した場合は空のオブジェクトを返す
            // console.error(`Could not parse JSON object: ${str}`, e);
            return {};
        }
    };

    return {
        title_ja: row.title_ja || '',
        title_en: row.title_en || '',
        description_ja: row.description_ja || '',
        description_en: row.description_en || '',
        // ★修正点: 新しいヘルパー関数を使って変換する
        answerOptions_ja: parseAnswerOptions(row.answerOptions_ja),
        answerOptions_en: parseAnswerOptions(row.answerOptions_en), // 英語も同様に
        correctAnswer: String(row.correctAnswer || ''), // 念のため文字列に変換
        explanation_ja: row.explanation_ja || '',
        explanation_en: row.explanation_en || '',
        // ★修正点: 新しいヘルパー関数を使って変換する
        programLines_ja: parseProgramLines(row.programLines_ja),
        programLines_en: parseProgramLines(row.programLines_en), // 英語も同様に
        initialVariables: parseJsonObject(row.initialVariables || '{}'),
        logicType: row.logicType || 'STATIC_QA', // デフォルト値を設定
        options: parseJsonObject(row.options || '{}'),
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