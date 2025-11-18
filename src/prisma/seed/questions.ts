import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as XLSX from 'xlsx';
import { problems as localProblems } from '../../app/(main)/issue_list/basic_info_b_problem/data/problems';
import fs from 'fs';

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

export async function seedProblems(prisma: PrismaClient) {

  console.log('🌱 Seeding problems...');

  // 既存の問題関連データをクリア
  console.log('🗑️ Clearing old problem data...');
  
  // 改行やインデントをすべて削除し、1行の文字列にします
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Submissions", "SampleCase", "TestCase", "ProblemFile", "UserAnswer", "Answer_Algorithm", "Basic_Info_A_Question", "Assignment", "Event_Issue_List", "ProgrammingProblem", "SelectProblem", "Questions", "Questions_Algorithm" RESTART IDENTITY CASCADE;`
  );

  console.log('✅ Old problem data cleared.');

  // 1. localProblems からのシーディング
  console.log('🌱 Seeding questions from local data...');
  for (const p of localProblems) {
    const questionDataForDB = { id: parseInt(p.id, 10), title: p.title.ja, question: p.description.ja, explain: p.explanationText.ja, language_id: 1, genre_id: 1, genreid: 1, difficultyId: p.difficultyId, answerid: 1, term: "不明" };
    await prisma.questions.create({ data: questionDataForDB });
  }
  console.log(`✅ Created ${localProblems.length} questions from local data.`);

  // 2. Excel からのシーディング
  console.log('🌱 Seeding problems from Excel file...');
  await seedProblemsFromExcel(prisma);

  // 3. スプレッドシートからのプログラミング問題のシーディング
  console.log('🌱 Seeding programming problems from spreadsheet data...');
  await seedSampleProgrammingProblems(prisma);

  // 4. 選択問題のシーディング
  console.log('🌱 Seeding selection problems...');
  await seedSampleSelectionProblems(prisma);

  // 5.基本A問題のシーディング
  await seedBasicInfoAProblems(prisma);

  // 6. 応用情報午前問題のシーディング
  console.log('🌱 Seeding Applied Info AM problems...');
  await seedAppliedInfoAmProblems(prisma);
}

async function seedProblemsFromExcel(prisma: PrismaClient) {
  const excelFileName = 'PBL2 科目B問題.xlsx';
  const filePath = path.join(__dirname, '..','..','..','..', 'app', '(main)', 'issue_list', 'basic_info_b_problem', 'data', excelFileName);

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

async function seedSampleProgrammingProblems(prisma: PrismaClient, creatorId: number = 1) {
  // Googleスプレッドシートからエクスポートしたデータ
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
                { input: '1 5', expectedOutput: '6', description: '1 + 5 = 6 です。', order: 1 },
                { input: '10 20', expectedOutput: '30', description: '10 + 20 = 30 です。', order: 2 }
            ]
        }
    },
    {
        title: '複数行の入力',
        problemType: 'コーディング問題',
        difficulty: 1,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '標準入出力',
        tags: '["入門", "複数行入力"]',
        description: '3行にわたって3つの整数 A, B, C が与えられます。A, B, C の和を計算して出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '1\n2\n3', expectedOutput: '6', description: '1 + 2 + 3 = 6 です。', order: 1 },
                { input: '10\n-5\n2', expectedOutput: '7', description: '10 + (-5) + 2 = 7 です。', order: 2 }
            ]
        }
    },
    {
        title: 'N個の整数の和',
        problemType: 'コーディング問題',
        difficulty: 1,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: 'ループ',
        tags: '["入門", "ループ", "for文"]',
        description: '最初に整数 N が与えられます。続く N 行で N 個の整数が与えられます。これらの整数の合計値を計算して出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '3\n10\n20\n30', expectedOutput: '60', description: '10 + 20 + 30 = 60 です。', order: 1 },
                { input: '5\n1\n2\n3\n4\n5', expectedOutput: '15', description: '1から5までの和は15です。', order: 2 }
            ]
        }
    },
    {
        title: '奇数か偶数か',
        problemType: 'コーディング問題',
        difficulty: 1,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '条件分岐',
        tags: '["入門", "if文", "条件分岐"]',
        description: '1つの整数 N が与えられます。N が偶数なら `Even`、奇数なら `Odd` と出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '10', expectedOutput: 'Even', description: '10は偶数です。', order: 1 },
                { input: '7', expectedOutput: 'Odd', description: '7は奇数です。', order: 2 },
                { input: '0', expectedOutput: 'Even', description: '0は偶数です。', order: 3 }
            ]
        }
    },
    {
        title: '文字列の連結',
        problemType: 'コーディング問題',
        difficulty: 1,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '文字列操作',
        tags: '["入門", "文字列"]',
        description: '2つの文字列 S と T が2行で与えられます。S と T をこの順で連結した新しい文字列を出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: 'hello\nworld', expectedOutput: 'helloworld', description: '単純な文字列連結です。', order: 1 },
                { input: 'apple\npie', expectedOutput: 'applepie', order: 2 }
            ]
        }
    },
    {
        title: '最大値の発見',
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '配列',
        tags: '["基本", "配列", "最大値"]',
        description: 'N個の整数が空白区切りで1行で与えられます。これらの整数の中で最大のものを探し、出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '5\n1 4 3 5 2', expectedOutput: '5', description: '与えられた5つの数の中で最大は5です。', order: 1 },
                { input: '3\n-10 -5 -20', expectedOutput: '-5', description: '負の数を含む場合でも最大値を探します。', order: 2 }
            ]
        }
    },
    {
        title: 'FizzBuzz',
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: 'ループと条件分岐',
        tags: '["基本", "ループ", "if文", "FizzBuzz"]',
        description: '整数 N が与えられます。1から N までの数を順番に出力してください。ただし、その数が3で割り切れるなら数の代わりに `Fizz` を、5で割り切れるなら `Buzz` を、3でも5でも割り切れるなら `FizzBuzz` を出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', description: '1から15までのFizzBuzzです。', order: 1 }
            ]
        }
    },
    {
        title: '配列の逆順',
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '配列',
        tags: '["基本", "配列", "反転"]',
        description: 'N個の整数が空白区切りで1行で与えられます。これらの整数を逆の順序で空白区切りで出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1', description: '配列を逆順に出力します。', order: 1 }
            ]
        }
    },
    {
        title: '文字のカウント',
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '文字列操作',
        tags: '["基本", "文字列", "カウント"]',
        description: '1行の文字列 S と、1文字 C が与えられます。文字列 S の中に文字 C が何個含まれているかを数えて出力してください。大文字と小文字は区別します。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: 'abracadabra\na', expectedOutput: '5', description: '`a`は5回出現します。', order: 1 },
                { input: 'Hello World\nl', expectedOutput: '3', order: 2 }
            ]
        }
    },
    {
        title: '階乗の計算',
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '再帰',
        tags: '["基本", "再帰", "数学"]',
        description: '非負整数 N が与えられます。N の階乗 (N!) を計算して出力してください。0! = 1 とします。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '5', expectedOutput: '120', description: '5! = 5 * 4 * 3 * 2 * 1 = 120', order: 1 },
                { input: '0', expectedOutput: '1', description: '0の階乗は1です。', order: 2 }
            ]
        }
    },
    {
        title: '素数判定',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '数学',
        tags: '["中級", "数学", "素数"]',
        description: '2以上の整数 N が与えられます。N が素数であれば `Yes`、素数でなければ `No` と出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '7', expectedOutput: 'Yes', description: '7は素数です。', order: 1 },
                { input: '10', expectedOutput: 'No', description: '10は2や5で割り切れるため素数ではありません。', order: 2 },
                { input: '2', expectedOutput: 'Yes', description: '2は最小の素数です。', order: 3 }
            ]
        }
    },
    {
        title: '二分探索',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '探索',
        tags: '["中級", "探索", "二分探索"]',
        description: 'ソート済みの N 個の整数からなる配列と、探したい整数 K が与えられます。配列内に K が存在すればそのインデックス（0-indexed）を、存在しなければ `-1` を出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '5 3\n1 2 3 4 5', expectedOutput: '2', description: '3はインデックス2にあります。', order: 1 },
                { input: '5 6\n1 2 3 4 5', expectedOutput: '-1', description: '6は配列内に存在しません。', order: 2 }
            ]
        }
    },
    {
        title: 'ユークリッドの互除法',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '数学',
        tags: '["中級", "数学", "最大公約数"]',
        description: '2つの正の整数 A と B が与えられます。A と B の最大公約数（GCD）を求めてください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '51 15', expectedOutput: '3', description: '51と15の最大公約数は3です。', order: 1 },
                { input: '10 20', expectedOutput: '10', order: 2 }
            ]
        }
    },
    {
        title: 'バブルソート',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: 'ソート',
        tags: '["中級", "ソート", "バブルソート"]',
        description: 'N個の整数からなる配列が与えられます。この配列をバブルソートを使って昇順に並び替え、結果を空白区切りで出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '5\n5 3 2 4 1', expectedOutput: '1 2 3 4 5', order: 1 }
            ]
        }
    },
    {
        title: '累積和',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: 'データ構造',
        topic: '累積和',
        tags: '["中級", "データ構造", "累積和"]',
        description: 'N個の整数からなる配列 A があります。Q個のクエリが与えられ、各クエリでは区間 [L, R] (1-indexed) が指定されます。各クエリに対して、A[L] から A[R] までの和を求めてください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '5\n1 2 3 4 5\n2\n2 4\n1 5', expectedOutput: '9\n15', description: '区間[2,4]の和は2+3+4=9, 区間[1,5]の和は1+2+3+4+5=15です。', order: 1 }
            ]
        }
    },
    {
        title: '深さ優先探索 (DFS)',
        problemType: 'コーディング問題',
        difficulty: 4,
        timeLimit: 3,
        category: 'グラフ理論',
        topic: '探索',
        tags: '["上級", "グラフ", "DFS"]',
        description: '単純な無向グラフが与えられます。頂点1から出発して深さ優先探索（DFS）で到達可能な頂点を、訪れた順に（頂点番号が小さい方を優先）出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '4 3\n1 2\n1 3\n2 4', expectedOutput: '1\n2\n4\n3', description: '頂点1->2->4->3の順に訪問します。', order: 1 }
            ]
        }
    },
    {
        title: '幅優先探索 (BFS)',
        problemType: 'コーディング問題',
        difficulty: 4,
        timeLimit: 3,
        category: 'グラフ理論',
        topic: '探索',
        tags: '["上級", "グラフ", "BFS"]',
        description: '単純な無向グラフが与えられます。頂点1から出発して幅優先探索（BFS）で到達可能な頂点を、訪れた順に出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '4 3\n1 2\n1 3\n2 4', expectedOutput: '1\n2\n3\n4', description: '頂点1->2->3->4の順に訪問します。', order: 1 }
            ]
        }
    },
    {
        title: '動的計画法 (DP): Fibonacci',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: 'アルゴリズム',
        topic: '動的計画法',
        tags: '["中級", "DP", "フィボナッチ"]',
        description: '整数 N が与えられます。N 番目のフィボナッチ数を求めてください。F(0)=0, F(1)=1 とします。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '10', expectedOutput: '55', order: 1 }
            ]
        }
    },
    {
        title: 'ナップサック問題',
        problemType: 'コーディング問題',
        difficulty: 4,
        timeLimit: 3,
        category: 'アルゴリズム',
        topic: '動的計画法',
        tags: '["上級", "DP", "ナップサック"]',
        description: 'N個の品物と容量 W のナップサックがあります。各品物 i は重さ w_i と価値 v_i を持ちます。重さの合計が W を超えないように品物を選んだときの、価値の合計の最大値を求めてください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '3 8\n3 30\n4 50\n5 60', expectedOutput: '90', description: '品物1(重さ3,価値30)と品物3(重さ5,価値60)を選ぶと、重さ合計8で価値合計90となり最大です。', order: 1 }
            ]
        }
    },
    {
        title: 'ダイクストラ法',
        problemType: 'コーディング問題',
        difficulty: 4,
        timeLimit: 3,
        category: 'グラフ理論',
        topic: '最短経路',
        tags: '["上級", "グラフ", "最短経路"]',
        description: '重み付き有向グラフと始点 S が与えられます。始点 S から他の全ての頂点への最短経路長を求めてください。到達不可能な場合は `INF` と出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '4 5 0\n0 1 1\n0 2 4\n1 2 2\n2 3 1\n1 3 5', expectedOutput: '0\n1\n3\n4', order: 1 }
            ]
        }
    },
    {
        title: 'カレンダーの計算',
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 2,
        category: 'シミュレーション',
        topic: '日付計算',
        tags: '["基本", "日付"]',
        description: '西暦 Y 年 M 月 D 日が与えられます。その翌日の日付を YYYY MM DD の形式で出力してください。うるう年も考慮してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '2024 2 28', expectedOutput: '2024 2 29', description: '2024年はうるう年です。', order: 1 },
                { input: '2023 12 31', expectedOutput: '2024 1 1', description: '年末の翌日は元旦です。', order: 2 }
            ]
        }
    },
    {
        title: '括弧の整合性',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: 'データ構造',
        topic: 'スタック',
        tags: '["中級", "スタック"]',
        description: '`()`, `{}`, `[]` を含む文字列が与えられます。この文字列の括弧が正しく対応しているか判定してください。正しければ `Yes`、そうでなければ `No` と出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '{[()]}', expectedOutput: 'Yes', order: 1 },
                { input: '([)]', expectedOutput: 'No', order: 2 },
                { input: '())', expectedOutput: 'No', order: 3 }
            ]
        }
    },
    {
        title: '座標圧縮',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 3,
        category: 'アルゴリズム',
        topic: '座標圧縮',
        tags: '["中級", "座標圧縮"]',
        description: 'N個の整数からなる配列 A が与えられます。各要素を、その値が配列全体の中で何番目に小さいか（0-indexed）という値に置き換えて出力してください。同じ値がある場合は同じ順位とします。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '5\n10 50 30 50 20', expectedOutput: '0 3 2 3 1', order: 1 }
            ]
        }
    },
    {
        title: '平均点の計算',
        problemType: 'コーディング問題',
        difficulty: 1,
        timeLimit: 2,
        category: '数学',
        topic: '算術演算',
        tags: '["入門", "数学", "平均"]',
        description: 'N 人の生徒のテストの点数が与えられます。平均点を計算し、小数点以下を切り捨てて整数で出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '3\n70 80 90', expectedOutput: '80', order: 1 },
                { input: '4\n100 85 90 77', expectedOutput: '88', order: 2 }
            ]
        }
    },
    {
        title: 'ROT13',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: '文字列',
        topic: '暗号',
        tags: '["中級", "文字列", "暗号"]',
        description: '英大文字と英小文字からなる文字列 S が与えられます。S の各文字を、アルファベット上で13文字後の文字に置き換えた文字列（ROT13）を出力してください。アルファベットの最後を超えた場合は先頭に戻ります。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: 'HelloWorld', expectedOutput: 'UryybJbeyq', order: 1 },
                { input: 'Programming', expectedOutput: 'Cebtenzzvat', order: 2 }
            ]
        }
    },
    {
        title: 'カードゲームシミュレーション',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: 'シミュレーション',
        topic: 'シミュレーション',
        tags: '["中級", "シミュレーション"]',
        description: '太郎君と花子さんがカードゲームをします。Nラウンド行い、各ラウンドで太郎君と花子さんが出したカードの数字が与えられます。数字が大きい方がそのラウンドの勝者です。引き分けもあります。最終的に太郎君が勝った回数と花子さんが勝った回数を空白区切りで出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '3\n10 5\n3 8\n7 7', expectedOutput: '1 1', description: '太郎君が1勝、花子さんが1勝、1引き分けです。', order: 1 }
            ]
        }
    },
    {
        title: '約数の列挙',
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 2,
        category: '数学',
        topic: '約数',
        tags: '["基本", "数学", "約数"]',
        description: '正の整数 N が与えられます。N の全ての正の約数を昇順で1行ずつ出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '12', expectedOutput: '1\n2\n3\n4\n6\n12', order: 1 }
            ]
        }
    },
    {
        title: '回文判定',
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 2,
        category: '文字列',
        topic: '回文',
        tags: '["基本", "文字列", "回文"]',
        description: '文字列 S が与えられます。S が回文（前から読んでも後ろから読んでも同じ文字列）であれば `Yes`、そうでなければ `No` と出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: 'level', expectedOutput: 'Yes', order: 1 },
                { input: 'hello', expectedOutput: 'No', order: 2 }
            ]
        }
    },
    {
        title: '行列の積',
        problemType: 'コーディング問題',
        difficulty: 4,
        timeLimit: 3,
        category: '線形代数',
        topic: '行列',
        tags: '["上級", "数学", "行列"]',
        description: 'N x M 行列 A と M x L 行列 B が与えられます。これらの積である N x L 行列 C を計算し、出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '2 3 2\n1 2 3\n4 5 6\n7 8\n9 10\n11 12', expectedOutput: '58 64\n139 154', order: 1 }
            ]
        }
    },
    {
        title: 'ビット演算: XOR',
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 2,
        category: 'ビット演算',
        topic: 'XOR',
        tags: '["中級", "ビット演算"]',
        description: '2つの非負整数 A と B が与えられます。A と B のビット単位の排他的論理和 (XOR) を計算した結果を出力してください。',
        codeTemplate: '',
        isPublic: true,
        allowTestCaseView: true,
        isDraft: false,
        isPublished: true,
        sampleCases: {
            create: [
                { input: '5 3', expectedOutput: '6', description: '5 (101) XOR 3 (011) = 6 (110)', order: 1 }
            ]
        }
    }
  ];

  for (const p of spreadsheetProblems) {
    const { difficulty, ...restOfProblemData } = p;

    // ユーザーの指示に基づき eventDifficultyId を決定
    // 難易度6以上は、eventDifficultyId を 1 にする
    // それ以外は、元の difficulty の値をそのまま使う
    const eventDifficultyId = difficulty >= 6 ? 1 : difficulty;

    await prisma.programmingProblem.create({
      data: {
        ...restOfProblemData,
        difficulty: difficulty, // 元の difficulty フィールドも残しておく
        eventDifficultyId: eventDifficultyId,
      },
    });
  }
  console.log(`✅ Created ${spreadsheetProblems.length} programming problems from spreadsheet.`);
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
      difficultyId: 1,
      subjectId: 4, // プログラミング選択問題
    },
    {
      title: 'JavaScriptの関数定義',
      description: 'JavaScriptで関数を定義する正しい方法はどれですか？',
      explanation: 'JavaScriptでは function キーワードを使って関数を定義します。',
      answerOptions: ['def myFunction():', 'function myFunction() {}', 'void myFunction() {}', 'func myFunction() {}'],
      correctAnswer: 'function myFunction() {}',
      difficultyId: 2,
      subjectId: 4,
    },
    {
      title: 'HTMLの基本構造',
      description: 'HTMLドキュメントの基本的な構造で必須の要素はどれですか？',
      explanation: 'HTMLドキュメントには<!DOCTYPE html>、<html>、<head>、<body>要素が必要です。',
      answerOptions: ['<div>', '<span>', '<html>', '<section>'],
      correctAnswer: '<html>',
      difficultyId: 1,
      subjectId: 4,
    },
    {
      title: 'CSSのセレクタ',
      description: 'CSSでクラス名を指定するセレクタはどれですか？',
      explanation: 'CSSでクラスを指定する際は、クラス名の前にドット(.)を付けます。',
      answerOptions: ['#className', '.className', '@className', '*className'],
      correctAnswer: '.className',
      difficultyId: 2,
      subjectId: 4,
    },
    {
      title: 'データベースの正規化',
      description: '第1正規形の条件として正しいものはどれですか？',
      explanation: '第1正規形では、各属性が原子値（分割できない値）を持つ必要があります。',
      answerOptions: ['重複する行がない', '部分関数従属がない', '推移関数従属がない', '各属性が原子値を持つ'],
      correctAnswer: '各属性が原子値を持つ',
      difficultyId: 3,
      subjectId: 4,
    },
    {
      title: 'アルゴリズムの計算量',
      description: 'バブルソートの最悪時間計算量はどれですか？',
      explanation: 'バブルソートは最悪の場合、すべての要素を比較・交換するため O(n²) の時間計算量になります。',
      answerOptions: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
      correctAnswer: 'O(n²)',
      difficultyId: 4,
      subjectId: 4,
    },
    {
      title: 'オブジェクト指向プログラミング',
      description: 'カプセル化の主な目的はどれですか？',
      explanation: 'カプセル化は、データと処理を一つにまとめ、外部からの直接アクセスを制限することで、データの整合性を保つことが主な目的です。',
      answerOptions: ['処理速度の向上', 'メモリ使用量の削減', 'データの隠蔽と保護', 'コードの短縮'],
      correctAnswer: 'データの隠蔽と保護',
      difficultyId: 3,
      subjectId: 4,
    },
    {
      title: 'ネットワークプロトコル',
      description: 'HTTPSで使用される暗号化プロトコルはどれですか？',
      explanation: 'HTTPSはHTTPにTLS/SSL暗号化を追加したプロトコルです。',
      answerOptions: ['FTP', 'SSH', 'TLS/SSL', 'SMTP'],
      correctAnswer: 'TLS/SSL',
      difficultyId: 4,
      subjectId: 4,
    },
    {
      title: 'データ構造：スタック',
      description: 'スタックのデータ取得方式として正しいものはどれですか？',
      explanation: 'スタックはLIFO（Last In, First Out）方式で、最後に入れたデータを最初に取り出します。',
      answerOptions: ['FIFO', 'LIFO', 'Random Access', 'Sequential Access'],
      correctAnswer: 'LIFO',
      difficultyId: 3,
      subjectId: 4,
    },
    {
      title: 'SQLの基本操作',
      description: 'データベースからデータを取得するSQLコマンドはどれですか？',
      explanation: 'SELECT文はデータベースからデータを検索・取得するために使用されます。',
      answerOptions: ['INSERT', 'UPDATE', 'DELETE', 'SELECT'],
      correctAnswer: 'SELECT',
      difficultyId: 2,
      subjectId: 4,
    }
  ];

  for (const problem of selectionProblems) {
    await prisma.selectProblem.create({ data: problem });
  }
  console.log(`✅ Created ${selectionProblems.length} selection problems.`);
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
    console.warn(' ⚠️ Image path generation will fail. Make sure the directory exists: /src/public/images/basic_a/');
  }

  return fileNameMap;
}

/**
 * 応用情報AM問題: 画像ディレクトリをスキャン
 */
function createAppliedAmImageFileMap(): Map<string, string> {
  // 1. /src/public/images/applied_am/ の絶対パスを取得
const imageDir = path.join(
    // ❌ 古いパス: __dirname, '..',  '..',  '..', 'public', ...
    // ✅ 修正: WORKSPACE_ROOT から 'src' と 'public' を結合
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
    console.warn(' ⚠️ Image path generation will fail. Make sure the directory exists: /src/public/images/applied_am/');
  }

  return fileNameMap;
}

/**
 * answerOptions のテキスト ("アX イY ウZ エW" など、多様な形式に対応) を
 * ["X", "Y", "Z", "W"] の配列に変換するヘルパー関数 [さらに改善版]
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

  const markers = ['ア：', 'イ：', 'ウ：', 'エ：'];
  const markerPositions: { [key: string]: number } = {};
  let searchStartIndex = 0;

  //  ▼▼▼ 改善点: 全マーカーの位置を先に特定 ▼▼▼ 
  for (const marker of markers) {
    const index = cleanedText.indexOf(marker, searchStartIndex);
    if (index === -1) {
      console.warn(` ⚠️ Marker "${marker}" not found in cleaned text (starting search from index ${searchStartIndex}): "${cleanedText}"`);
      return null; // マーカーが1つでも見つからなければ失敗
    }
    markerPositions[marker] = index;
    // 次のマーカー検索開始位置を、見つかったマーカーの直後に設定
    // これにより、選択肢テキスト内に同じマーカー文字があっても影響されにくくなる
    searchStartIndex = index + 1;
  }
  //   マーカー位置特定ここまで  

  const options: string[] = [];
  try {
    // テキスト本体のみを正しく抽出するように substring の開始位置を調整します。
    const offsetA = markerPositions['ア：'] + 'ア：'.length;
    const offsetI = markerPositions['イ：'] + 'イ：'.length;
    const offsetU = markerPositions['ウ：'] + 'ウ：'.length;
    const offsetE = markerPositions['エ：'] + 'エ：'.length;

    options.push(cleanedText.substring(offsetA, markerPositions['イ：']).trim());
    options.push(cleanedText.substring(offsetI, markerPositions['ウ：']).trim());
    options.push(cleanedText.substring(offsetU, markerPositions['エ：']).trim());
    options.push(cleanedText.substring(offsetE).trim());

    // すべての選択肢が空文字列でないことを確認
    if (options.length === 4 && options.every(opt => opt && opt.length > 0)) {
      return options;
    } else {
      console.warn(` ⚠️ Failed to extract 4 non-empty options from cleaned text: "${cleanedText}"`, options);
      return null;
    }
  } catch (e) {
    console.error(` ❌ Error during option extraction from text: "${text}"`, e);
    return null;
  }
}


/**
 * 基本情報A問題（PBL3基本Aデータ使用.xlsx - 基本情報A問題統合用シート）をデータベースにシードする
 * [修正版] 新しいExcelファイル/シートに対応 + createに戻す
 */
async function seedBasicInfoAProblems(prisma: PrismaClient) {
  console.log('🌱 Seeding Basic Info A problems from Excel file...');

  //const imageFileMap = createImageFileMap();

  //  変更点 1: Excelファイル名とシート名を更新 
  const excelFileName = 'PBL3基本Aデータ使用.xlsx'; // 新しいファイル名
  const sheetName = '基本情報A問題統合用シート';   // 新しいシート名
  //   

  const filePath = path.join(__dirname, '..','..','..','..', 'app', '(main)', 'issue_list', 'basic_info_a_problem', 'data', excelFileName);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      console.warn(` ⚠️ Sheet "${sheetName}" not found in ${excelFileName}. Skipping.`);
      return;
    }

    // 2: ヘッダー配列を新しいシートの列に合わせる (CSV内容から推測)
    //    Excelの実際の列と順番が合っているか確認してください。
    const headers = [
      'id',             // A列
      'title',          // B列
      'description',    // C列
      'explanation',    // D列
      'answerOptions',  // E列
      'correctAnswer',  // F列
      'difficultyId',   // G列
      'difficulty',     // H列
      'subjectId',      // I列
      'subject',        // J列
      'assignment',     // K列
      'category',       // L列
      'source',         // M列
      'sourceYear',     // N列
      'imageFileName',  // O列
    ];


    const records = XLSX.utils.sheet_to_json(sheet, {
        header: headers,
        range: 2 // データ開始行 (0-indexed なので3行目は 2)
    }) as any[];

    console.log(` 🔍 Found ${records.length} records in sheet "${sheetName}".`);
    if (records.length === 0) {
      console.warn(' ⚠️ No data records found.');
      return;
    }

    //  カテゴリ、難易度、科目のマスタデータ取得とマッピング定義 (変更なし) 
    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const numericCategoryMap: { [key: string]: string } = {
      '1': 'テクノロジ系',
      '2': 'マネジメント系',
      '3': 'ストラテジ系',
    };
     const categoryNameToDbNameMap: { [key: string]: string } = {
      // 数値マッピング
      '1': 'テクノロジ系',
      '2': 'マネジメント系',
      '3': 'ストラテジ系',
      // 文字列マッピング (Excelの値 -> DBのカテゴリ名)
      '基礎理論': 'テクノロジ系',
      'コンピュータシステム': 'テクノロジ系',
      '開発技術': 'テクノロジ系',
      'ネットワーク': 'テクノロジ系',
      'セキュリティ': 'テクノロジ系',
      'データベース': 'テクノロジ系',
      'プロジェクトマネジメント': 'マネジメント系',
      'サービスマネジメント': 'マネジメント系',
      'システム監査': 'マネジメント系',
      'システム戦略': 'ストラテジ系',
      '企業と法務': 'ストラテジ系',
      '経営戦略': 'ストラテジ系',
      'AIとディープラーニング': 'テクノロジ系',
      'モータの回転速度の制御方法': 'テクノロジ系',
      'オブジェクト指向プログラミング（オーバーライド）': 'テクノロジ系',
      'USB3.0の技術': 'テクノロジ系',
      'メモリリーク': 'テクノロジ系',
      'APIについて': 'テクノロジ系',
      'DBMSとスキーマ': 'テクノロジ系',
      'E-R図の説明': 'テクノロジ系',
      'SQL文の条件式': 'テクノロジ系',
      'Javaとデータベース、API': 'テクノロジ系',
      'TCP/IPとプロトコル': 'テクノロジ系',
      'Webサーバとネット中継': 'テクノロジ系',
      'リバースブルートフォース攻撃の説明': 'テクノロジ系',
      'メッセージのハッシュ値とデジタル署名': 'テクノロジ系',
      'サイバー情報共有イニシアチブ': 'テクノロジ系',
      'VDIのセキュリティと保護動作': 'テクノロジ系',
      'オブジェクト指向とカプセル化': 'テクノロジ系',
      'プログラムのテストとデータ': 'テクノロジ系',
      'ソフトウェアとリバースエンジニアリング': 'テクノロジ系',
      'スクラムと生産量': 'マネジメント系',
      'エクストリームプログラミングとリファクタリング': 'マネジメント系',
      'オペレーションサービスと必要人数': 'マネジメント系',
      'システム監査と真正性の検証': 'マネジメント系',
      'エンタープライスアーキテクチャと業務と情報システム': 'ストラテジ系',
      'ハイブリッドクラウドとは？': 'ストラテジ系', // CSVに合わせて ? を削除
      'CSRの調達': 'ストラテジ系',
      'プロダクトポートフォリオマネジメントと4つの分類': 'ストラテジ系',
      '戦略遂行と施策を策定する経営管理手法': 'ストラテジ系',
      '３PLの説明': 'ストラテジ系', // 全角数字対応
      'セル生産方式の利点': 'ストラテジ系',
      'マトリックス組織について': 'ストラテジ系',
      '定量発注方式と発注点計算': 'ストラテジ系',
      '売上原価の計算': 'ストラテジ系',
      '著作権とクリエイティブコモンズ': 'ストラテジ系',
      '真理値表': 'テクノロジ系', // 追加
      'ASCIIコード': 'テクノロジ系', // 追加
      'アクセス時間の計算': 'テクノロジ系', // 追加
      '稼働率': 'テクノロジ系', // 追加
      'ロジックマッシュアップ': 'テクノロジ系', // 追加
      '液晶ディスプレイなどの表示装置': 'テクノロジ系', // 追加
      'DBMS に実装すべき原子性': 'テクノロジ系', // 追加
      'LAN 間接続装置': 'テクノロジ系', // 追加
      'ペネトレーションテスト': 'テクノロジ系', // 追加
      'SQL インジェクションの対策': 'テクノロジ系', // 追加
      'ソフトウェアの結合テスト': 'テクノロジ系', // 追加
      'アジャイル開発手法': 'マネジメント系', // 追加
      'アローダイアグラム': 'マネジメント系', // 追加
      '新規サービスの設計及び移行を進めるための方法': 'マネジメント系', // 追加
      'ビッグデータ分析': 'ストラテジ系', // 追加
      'コアコンピタンス': 'ストラテジ系', // 追加
      'ブルーオーシャン': 'ストラテジ系', // 追加
      'HR テック': 'ストラテジ系', // 追加
      '散布図': 'ストラテジ系', // 追加
      '産業財産権': 'ストラテジ系', // 追加
      // 既存のDB名もそのままマッピング
      'テクノロジ系': 'テクノロジ系',
      'マネジメント系': 'マネジメント系',
      'ストラテジ系': 'ストラテジ系',
    };
    const defaultDifficulty = await prisma.difficulty.findUnique({ where: { name: '基本資格A問題' } });
    const defaultSubject = await prisma.subject.findUnique({ where: { name: '基本情報A問題' } });

    // console.log(' 🔍 DB Categories:', categories.map(c => c.name));
    if (!defaultDifficulty || !defaultSubject) {
        console.error('❌ Master data error: Default Difficulty or Subject not found.');
        return;
    }
    const answerMap: { [key: string]: number } = { 'ア': 0, 'イ': 1, 'ウ': 2, 'エ': 3 };

    let createdCount = 0;
    let processedRowCount = 0;

    for (const record of records) {
      processedRowCount++;

      const problemId = parseInt(String(record.id).trim(), 10);
      if (isNaN(problemId)) {
          console.log(` ⏹️ Found invalid or empty ID at row ${processedRowCount + 2}. Stopping import.`);
          break;
      }

      if (!record.title || String(record.title).trim() === '') {
          console.log(` ⏩ Skipping row ${processedRowCount + 2} due to empty title.`);
          continue;
      }

      //  カテゴリマッピング (変更なし、マッピングテーブルは上で更新) 
      const rawCategoryValue = record.category ? String(record.category).trim() : undefined;
      let mappedDbCategoryName: string | undefined = undefined;
      if (rawCategoryValue && categoryNameToDbNameMap[rawCategoryValue]) {
           mappedDbCategoryName = categoryNameToDbNameMap[rawCategoryValue];
      }
      let category = categories.find(c => c.name === mappedDbCategoryName);
      if (!category && !rawCategoryValue) {
          // console.warn(` ⚠️ Category is undefined for Row ${processedRowCount + 2}. Assigning default category 'テクノロジ系'.`);
          category = categories.find(c => c.name === 'テクノロジ系');
      }
      if (!category) {
        console.warn(` ⚠️ [Category mismatch/unmapped] Row ${processedRowCount + 2}: Excel value: "${rawCategoryValue}". Skipping: "${record.title}"`);
        continue;
      }
      //  カテゴリマッピングここまで 


      //  変更点 4: 難易度と科目をExcelから読み込み、無効ならデフォルト値 
      let difficultyId = defaultDifficulty.id; // デフォルト値
      const excelDifficultyId = record.difficultyId ? parseInt(String(record.difficultyId).trim(), 10) : NaN;
      if (!isNaN(excelDifficultyId)) {
          // TODO: 存在する難易度IDかチェックする方がより安全
          difficultyId = excelDifficultyId;
      } else if (record.difficultyId) { // G列に何か入っていたが無効な数値だった場合
          console.warn(` ⚠️ Invalid difficultyId "${record.difficultyId}" found in Excel Row ${processedRowCount + 2}. Using default ID ${defaultDifficulty.id}.`);
      }

      let subjectId = defaultSubject.id; // デフォルト値
      const excelSubjectId = record.subjectId ? parseInt(String(record.subjectId).trim(), 10) : NaN;
       if (!isNaN(excelSubjectId)) {
           // TODO: 存在する科目IDかチェックする方がより安全
           subjectId = excelSubjectId;
       } else if (record.subjectId) { // I列に何か入っていたが無効な数値だった場合
           console.warn(` ⚠️ Invalid subjectId "${record.subjectId}" found in Excel Row ${processedRowCount + 2}. Using default ID ${defaultSubject.id}.`);
       }
      //   


      //  選択肢パース (V7 - 変更なし) 
      const parsedOptions = parseAnswerOptionsText(record.answerOptions);
      if (!parsedOptions) {
        console.warn(` ⚠️ Failed to parse answerOptions text for Row ${processedRowCount + 2}, problem: "${record.title}". Skipping.`);
        continue;
      }
      //  選択肢パースここまで 


      //  正解インデックス (変更なし) 
      const correctAnswerIndex = answerMap[String(record.correctAnswer).trim()];
      if (correctAnswerIndex === undefined) {
         console.warn(` ⚠️ Invalid correct answer "${String(record.correctAnswer).trim()}" for Row ${processedRowCount + 2}, problem: "${record.title}". Skipping.`);
         continue;
      }
      //  正解インデックスここまで 


      //  変更点 5: 出典情報の列を調整 (M列=番号, N列=年/区分) 
      const sourceNumber = record.source ? String(record.source).trim() : '不明';      // M列
      const sourceYear = record.sourceYear ? String(record.sourceYear).trim() : '不明'; // N列
      //   


      const rawImageName = record.imageFileName ? String(record.imageFileName).trim() : null;
      let imagePath = null;
      
      if (rawImageName && rawImageName.length > 0) {
        // Excelにファイル名の記述があった場合、パスを構築
        imagePath = `/images/basic_a/${rawImageName}`;
      } else {
        // Excelにファイル名の記述がなかった場合
        // imagePath は null のまま (警告は任意で出す)
        console.warn(` ⚠️ No image file specified in Excel for ID: ${problemId}, Title: "${record.title}"`);
      }


      //  dataToSave オブジェクト (文字列変換は維持) 
      const dataToSave = {
          // id: problemId, // create では不要
          title: String(record.title || ""),
          description: String(record.description || ""),
          explanation: String(record.explanation || ""),
          answerOptions: parsedOptions,
          correctAnswer: correctAnswerIndex,
          sourceYear: sourceYear,
          sourceNumber: sourceNumber,
          difficultyId: difficultyId, //  更新
          subjectId: subjectId,       //  更新
          categoryId: category.id,
          imagePath: imagePath
      };
      //  dataToSave ここまで 


      try {
          await prisma.basic_Info_A_Question.create({
            data: dataToSave
          });
          createdCount++;
      } catch (error: any) {
          //  ID重複エラー (P2002) の場合のログを追加
          if (error.code === 'P2002' && error.meta?.target?.includes('id')) {
              console.error(`❌ Error saving record for Row ${processedRowCount + 2}: Duplicate ID ${problemId} found in Excel sheet "${sheetName}". Skipping this row. Title: "${record.title}"`);
          } else {
              console.error(`❌ Error saving record for Row ${processedRowCount + 2}, ID: ${problemId}, Title: "${record.title}". Error: ${error.message}`);
              // 詳細なエラー内容を出力
              // console.error(error);
          }
      }
    } // End of records loop

    console.log(` ✅ Processed ${records.length} rows. Created ${createdCount} Basic Info A questions.`);

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

  //  変更: 応用AM用の画像マップ関数を呼び出す
  const imageFileMap = createAppliedAmImageFileMap(); //（現在未使用）

  //  TODO: 応用情報のExcelファイル名とシート名を指定してください 
  const excelFileName = 'PBL3応用午前統合版.xlsx'; // あなたのファイル名
  const sheetName = '応用情報午前問題統合用シート';     // あなたのシート名
  //  TODOここまで 

  //  変更: 応用AM用のデータパス
  const filePath = path.join(__dirname,'..','..','..','..', 'app', '(main)', 'issue_list', 'applied_info_morning_problem', 'data', excelFileName);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      console.warn(` ⚠️ Sheet "${sheetName}" not found in ${excelFileName}. Skipping Applied AM seeding.`);
      return;
    }

    // Excelの列構成が基本A問題と同一であると仮定
    const headers = [ 'id', 'title', 'description', 'explanation', 'answerOptions', 'correctAnswer', 'difficultyId', 'difficulty', 'subjectId', 'subject', 'assignment', 'category', 'source', 'sourceYear', 'imageFileName', ];
    
    // データ開始行 (0-indexed なので3行目は 2)
    const records = XLSX.utils.sheet_to_json(sheet, { header: headers, range: 2 }) as any[];

    console.log(` 🔍 Found ${records.length} records in sheet "${sheetName}".`);
    if (records.length === 0) {
      console.warn(' ⚠️ No data records found.');
      return;
    }

    // (基本A問題と同一のカテゴリマッピングロジックを使用)
    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const categoryNameToDbNameMap: { [key: string]: string } = {
      '1': 'テクノロジ系',
      '2': 'マネジメント系',
      '3': 'ストラテジ系',
      '基礎理論': 'テクノロジ系',
      'コンピュータシステム': 'テクノロジ系',
      '開発技術': 'テクノロジ系',
      'ネットワーク': 'テクノロジ系',
      'セキュリティ': 'テクノロジ系',
      'データベース': 'テクノロジ系',
      'プロジェクトマネジメント': 'マネジメント系',
      'サービスマネジメント': 'マネジメント系',
      'システム監査': 'マネジメント系',
      'システム戦略': 'ストラテジ系',
      '企業と法務': 'ストラテジ系',
      '経営戦略': 'ストラテジ系',
      'AIとディープラーニング': 'テクノロジ系',
      'モータの回転速度の制御方法': 'テクノロジ系',
      'オブジェクト指向プログラミング（オーバーライド）': 'テクノロジ系',
      'USB3.0の技術': 'テクノロジ系',
      'メモリリーク': 'テクノロジ系',
      'APIについて': 'テクノロジ系',
      'DBMSとスキーマ': 'テクノロジ系',
      'E-R図の説明': 'テクノロジ系',
      'SQL文の条件式': 'テクノロジ系',
      'Javaとデータベース、API': 'テクノロジ系',
      'TCP/IPとプロトコル': 'テクノロジ系',
      'Webサーバとネット中継': 'テクノロジ系',
      'リバースブルートフォース攻撃の説明': 'テクノロジ系',
      'メッセージのハッシュ値とデジタル署名': 'テクノロジ系',
      'サイバー情報共有イニシアチブ': 'テクノロジ系',
      'VDIのセキュリティと保護動作': 'テクノロジ系',
      'オブジェクト指向とカプセル化': 'テクノロジ系',
      'プログラムのテストとデータ': 'テクノロジ系',
      'ソフトウェアとリバースエンジニアリング': 'テクノロジ系',
      'スクラムと生産量': 'マネジメント系',
      'エクストリームプログラミングとリファクタリング': 'マネジメント系',
      'オペレーションサービスと必要人数': 'マネジメント系',
      'システム監査と真正性の検証': 'マネジメント系',
      'エンタープライスアーキテクチャと業務と情報システム': 'ストラテジ系',
      'ハイブリッドクラウドとは？': 'ストラテジ系',
      'CSRの調達': 'ストラテジ系',
      'プロダクトポートフォリオマネジメントと4つの分類': 'ストラテジ系',
      '戦略遂行と施策を策定する経営管理手法': 'ストラテジ系',
      '３PLの説明': 'ストラテジ系',
      'セル生産方式の利点': 'ストラテジ系',
      'マトリックス組織について': 'ストラテジ系',
      '定量発注方式と発注点計算': 'ストラテジ系',
      '売上原価の計算': 'ストラテジ系',
      '著作権とクリエイティブコモンズ': 'ストラテジ系',
      '真理値表': 'テクノロジ系',
      'ASCIIコード': 'テクノロジ系',
      'アクセス時間の計算': 'テクノロジ系',
      '稼働率': 'テクノロジ系',
      'ロジックマッシュアップ': 'テクノロジ系',
      '液晶ディスプレイなどの表示装置': 'テクノロジ系',
      'DBMS に実装すべき原子性': 'テクノロジ系',
      'LAN 間接続装置': 'テクノロジ系',
      'ペネトレーションテスト': 'テクノロジ系',
      'SQL インジェクションの対策': 'テクノロジ系',
      'ソフトウェアの結合テスト': 'テクノロジ系',
      'アジャイル開発手法': 'マネジメント系',
      'アローダイアグラム': 'マネジメント系',
      '新規サービスの設計及び移行を進めるための方法': 'マネジメント系',
      'ビッグデータ分析': 'ストラテジ系',
      'コアコンピタンス': 'ストラテジ系',
      'ブルーオーシャン': 'ストラテジ系',
      'HR テック': 'ストラテジ系',
      '散布図': 'ストラテジ系',
      '産業財産権': 'ストラテジ系',
      'テクノロジ系': 'テクノロジ系',
      'マネジメント系': 'マネジメント系',
      'ストラテジ系': 'ストラテジ系',
    };

    //  変更: 応用AMのデフォルト難易度と科目を取得
    const defaultDifficulty = await prisma.difficulty.findUnique({ where: { name: '応用資格午前問題' } });
    const defaultSubject = await prisma.subject.findUnique({ where: { name: '応用情報午前問題' } });

    if (!defaultDifficulty || !defaultSubject) {
        console.error('❌ Master data error: Default Difficulty (応用資格午前問題) or Subject (応用情報午前問題) not found.');
        return;
    }
    const answerMap: { [key: string]: number } = { 'ア': 0, 'イ': 1, 'ウ': 2, 'エ': 3 };

    let createdCount = 0;
    let processedRowCount = 0;

    for (const record of records) {
      processedRowCount++;

      const problemId = parseInt(String(record.id).trim(), 10);
      if (isNaN(problemId)) {
          console.log(` ⏹️ Found invalid or empty ID at row ${processedRowCount + 2}. Stopping import.`);
          break;
      }

      if (!record.title || String(record.title).trim() === '') {
          console.log(` ⏩ Skipping row ${processedRowCount + 2} due to empty title.`);
          continue;
      }

      //  カテゴリマッピング 
      const rawCategoryValue = record.category ? String(record.category).trim() : undefined;
      let mappedDbCategoryName: string | undefined = undefined;
      if (rawCategoryValue && categoryNameToDbNameMap[rawCategoryValue]) {
           mappedDbCategoryName = categoryNameToDbNameMap[rawCategoryValue];
      }
      let category = categories.find(c => c.name === mappedDbCategoryName);
      if (!category && !rawCategoryValue) {
          category = categories.find(c => c.name === 'テクノロジ系'); // デフォルト
      }
      if (!category) {
        console.warn(` ⚠️ [Category mismatch/unmapped] Row ${processedRowCount + 2}: Excel value: "${rawCategoryValue}". Skipping: "${record.title}"`);
        continue;
      }

      //  難易度と科目 
      let difficultyId = defaultDifficulty.id; // デフォルトは「応用資格午前問題」
      const excelDifficultyId = record.difficultyId ? parseInt(String(record.difficultyId).trim(), 10) : NaN;
      if (!isNaN(excelDifficultyId)) { difficultyId = excelDifficultyId; }
      
      let subjectId = defaultSubject.id; // デフォルトは「応用情報午前問題」
      const excelSubjectId = record.subjectId ? parseInt(String(record.subjectId).trim(), 10) : NaN;
      if (!isNaN(excelSubjectId)) { subjectId = excelSubjectId; }
      
      //  選択肢パース 
      const parsedOptions = parseAnswerOptionsText(record.answerOptions);
      if (!parsedOptions) {
        console.warn(` ⚠️ Failed to parse answerOptions text for Row ${processedRowCount + 2}, problem: "${record.title}". Skipping.`);
        continue;
      }

      //  正解インデックス 
      const correctAnswerIndex = answerMap[String(record.correctAnswer).trim()];
      if (correctAnswerIndex === undefined) {
         console.warn(` ⚠️ Invalid correct answer "${String(record.correctAnswer).trim()}" for Row ${processedRowCount + 2}, problem: "${record.title}". Skipping.`);
         continue;
      }

      //  出典情報 
      const sourceNumber = record.source ? String(record.source).trim() : '不明';
      const sourceYear = record.sourceYear ? String(record.sourceYear).trim() : '不明';

      //  画像パス 
      const rawImageName = record.imageFileName ? String(record.imageFileName).trim() : null;
      let imagePath = null;
      if (rawImageName && rawImageName.length > 0) {
        //  変更: 応用AM用の画像パス
        imagePath = `/images/applied_am/${rawImageName}`; 
      } else {
        // 画像なし（警告は出さない）
      }

      const dataToSave = {
        // id: problemId, // create では不要
        title: String(record.title || ""),
        description: String(record.description || ""),
        explanation: String(record.explanation || ""),
        answerOptions: parsedOptions,
        correctAnswer: correctAnswerIndex,
        sourceYear: sourceYear,
        sourceNumber: sourceNumber,
        difficultyId: difficultyId,
        subjectId: subjectId,
        categoryId: category.id,
        imagePath: imagePath
      };

      try {
        //  変更: 投入先モデルを Applied_am_Question に変更
        await prisma.applied_am_Question.create({
          data: dataToSave
        });
        createdCount++;
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('id')) {
            console.error(`❌ Error saving record for Row ${processedRowCount + 2}: Duplicate ID ${problemId} found in Excel sheet "${sheetName}". Skipping this row. Title: "${record.title}"`);
        } else {
            console.error(`❌ Error saving record for Row ${processedRowCount + 2}, ID: ${problemId}, Title: "${record.title}". Error: ${error.message}`);
        }
      }
    } // End of records loop

    console.log(` ✅ Processed ${records.length} rows. Created ${createdCount} Applied Info AM questions.`);

  } catch (error) {
    console.error(`❌ Failed to read or process ${excelFileName}:`, error);
  }
}