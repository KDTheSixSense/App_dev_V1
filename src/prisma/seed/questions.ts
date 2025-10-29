import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as XLSX from 'xlsx';
import { problems as localProblems } from './data/local-problems';

export async function seedProblems(prisma: PrismaClient) {
  console.log('🌱 Seeding problems...');

  // 既存の問題関連データをクリア
  console.log('🗑️ Clearing old problem data...');
  // 関連の強い順に削除していく
  await prisma.submissions.deleteMany({});
  await prisma.sampleCase.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.problemFile.deleteMany({});
  await prisma.assignment.deleteMany({}); // AssignmentがProgrammingProblemを参照しているため先に削除
  await prisma.selectProblem.deleteMany({});
  await prisma.programmingProblem.deleteMany({});

  await prisma.userAnswer.deleteMany({});
  await prisma.answer_Algorithm.deleteMany({});
  await prisma.questions.deleteMany({});
  await prisma.questions_Algorithm.deleteMany({});

  console.log('✅ Old problem data cleared.');

  // 1. localProblems からのシーディング
  console.log('🌱 Seeding questions from local data...');
  // for (const p of localProblems) {
  //   const questionDataForDB = {
  //     id: parseInt(p.id, 10),
  //     title: p.title.ja,
  //     question: p.description.ja,
  //     explain: p.explanationText.ja,
  //     language_id: 1,
  //     genre_id: 1,
  //     difficultyId: 1,
  //     term: "不明",
  //     Answers: {
  //       create: {
  //         answer: "dummy answer",
  //         isCorrect: true,
  //       },
  //     },
  //   };
  //   await prisma.questions.create({ data: questionDataForDB });
  // }
  // console.log(`✅ Created ${localProblems.length} questions from local data.`);

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
}

async function seedProblemsFromExcel(prisma: PrismaClient) {
  const excelFileName = 'PBL2 科目B問題.xlsx';
  const filePath = path.join(process.cwd(), 'prisma', 'seed', 'data', excelFileName);

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
  // Googleスプレッドシートからエクスポートしたデータ
  const spreadsheetProblems = [
    {
        title: 'A + B',
        problemType: 'コーディング問題',
        difficultyId: 1,
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
        difficultyId: 1,
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
        difficultyId: 2,
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
        difficultyId: 2,
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
        difficultyId: 2,
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
        difficultyId: 3,
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
        difficultyId: 3,
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
        difficultyId: 3,
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
        difficultyId: 4,
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
        difficultyId: 4,
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
        difficultyId: 5,
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
        difficultyId: 6,
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
        difficultyId: 6,
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
        difficultyId: 5,
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
        difficultyId: 6,
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
        difficultyId: 7,
        timeLimit: 3,
        category: 'グラフ理論',
        topic: '探索',
        tags: '["上級", "グラフ", "DFS"]',
        description: '単純な無向グラフが与えられます。頂点1から出発して深さ優先探索（DFS）で到達可能な頂点を、訪れた順に（頂点番号が小さい方を優先）出力してください。',
        codeTemplate: '',
        isPublic: false,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: false,
        sampleCases: {
            create: [
                { input: '4 3\n1 2\n1 3\n2 4', expectedOutput: '1\n2\n4\n3', description: '頂点1->2->4->3の順に訪問します。', order: 1 }
            ]
        }
    },
    {
        title: '幅優先探索 (BFS)',
        problemType: 'コーディング問題',
        difficultyId: 7,
        timeLimit: 3,
        category: 'グラフ理論',
        topic: '探索',
        tags: '["上級", "グラフ", "BFS"]',
        description: '単純な無向グラフが与えられます。頂点1から出発して幅優先探索（BFS）で到達可能な頂点を、訪れた順に出力してください。',
        codeTemplate: '',
        isPublic: false,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: false,
        sampleCases: {
            create: [
                { input: '4 3\n1 2\n1 3\n2 4', expectedOutput: '1\n2\n3\n4', description: '頂点1->2->3->4の順に訪問します。', order: 1 }
            ]
        }
    },
    {
        title: '動的計画法 (DP): Fibonacci',
        problemType: 'コーディング問題',
        difficultyId: 6,
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
        difficultyId: 8,
        timeLimit: 3,
        category: 'アルゴリズム',
        topic: '動的計画法',
        tags: '["上級", "DP", "ナップサック"]',
        description: 'N個の品物と容量 W のナップサックがあります。各品物 i は重さ w_i と価値 v_i を持ちます。重さの合計が W を超えないように品物を選んだときの、価値の合計の最大値を求めてください。',
        codeTemplate: '',
        isPublic: false,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: false,
        sampleCases: {
            create: [
                { input: '3 8\n3 30\n4 50\n5 60', expectedOutput: '90', description: '品物1(重さ3,価値30)と品物3(重さ5,価値60)を選ぶと、重さ合計8で価値合計90となり最大です。', order: 1 }
            ]
        }
    },
    {
        title: 'ダイクストラ法',
        problemType: 'コーディング問題',
        difficultyId: 8,
        timeLimit: 3,
        category: 'グラフ理論',
        topic: '最短経路',
        tags: '["上級", "グラフ", "最短経路"]',
        description: '重み付き有向グラフと始点 S が与えられます。始点 S から他の全ての頂点への最短経路長を求めてください。到達不可能な場合は `INF` と出力してください。',
        codeTemplate: '',
        isPublic: false,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: false,
        sampleCases: {
            create: [
                { input: '4 5 0\n0 1 1\n0 2 4\n1 2 2\n2 3 1\n1 3 5', expectedOutput: '0\n1\n3\n4', order: 1 }
            ]
        }
    },
    {
        title: 'カレンダーの計算',
        problemType: 'コーディング問題',
        difficultyId: 4,
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
        difficultyId: 6,
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
        difficultyId: 7,
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
        difficultyId: 2,
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
        difficultyId: 5,
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
        difficultyId: 5,
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
        difficultyId: 4,
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
        difficultyId: 4,
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
        difficultyId: 7,
        timeLimit: 3,
        category: '線形代数',
        topic: '行列',
        tags: '["上級", "数学", "行列"]',
        description: 'N x M 行列 A と M x L 行列 B が与えられます。これらの積である N x L 行列 C を計算し、出力してください。',
        codeTemplate: '',
        isPublic: false,
        allowTestCaseView: true,
        isDraft: true,
        isPublished: false,
        sampleCases: {
            create: [
                { input: '2 3 2\n1 2 3\n4 5 6\n7 8\n9 10\n11 12', expectedOutput: '58 64\n139 154', order: 1 }
            ]
        }
    },
    {
        title: 'ビット演算: XOR',
        problemType: 'コーディング問題',
        difficultyId: 5,
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
    await prisma.programmingProblem.create({ data: p });
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

async function seedBasicInfoAProblems(prisma: PrismaClient) {
  console.log('🌱 Seeding Basic Information Technology Engineer Examination (Part A) problems...');

  // ここに基本情報A問題のデータ配列を定義します
  const basicAProblems = [
    {
      title: '情報セキュリティの三要素',
      description: '情報セキュリティにおいて、情報の「機密性」「完全性」「可用性」を維持することが重要です。このうち、「完全性（Integrity）」に関する説明として最も適切なものはどれですか？',
      explanation: '完全性（Integrity）は、情報が破壊、改ざん、または消去されていない、正確かつ完全な状態を維持する特性を指します。',
      answerOptions: [
        '許可された者だけが情報にアクセスできること。',
        '情報が破壊、改ざん、または消去されていないこと。',
        '情報へのアクセスが認可されていること。',
        '必要なときにいつでも情報にアクセスできること。'
      ],
      correctAnswer: 1, // 0から始まるインデックス
      sourceYear: '令和5年',
      sourceNumber: '問15',
      difficultyId: 6, // 難易度ID (※事前にDifficultyテーブルに存在する必要があります)
      subjectId: 2,    // 科目ID (※事前にSubjectテーブルに「基本情報A問題」のような科目が存在する必要があります)
      categoryId: 1    // カテゴリID (※事前にCategoryテーブルに「テクノロジ系」などが存在する必要があります)
    },
    {
      title: 'プロジェクトマネジメントの知識エリア',
      description: 'プロジェクトマネジメントの活動を、10の知識エリアに分類したフレームワークはどれですか？',
      explanation: 'PMBOK（Project Management Body of Knowledge）は、プロジェクトマネジメントの知識を10のエリア（統合、スコープ、スケジュール、コスト、品質、資源、コミュニケーション、リスク、調達、ステークホルダー）に体系化したものです。',
      answerOptions: [
        'ITIL',
        'PMBOK',
        'COBIT',
        'SWOT分析'
      ],
      correctAnswer: 1,
      difficultyId: 6,
      subjectId: 2,
      categoryId: 2 // カテゴリID (※事前にCategoryテーブルに「マネジメント系」などが存在する必要があります)
    },
    {
      title: '経営戦略手法',
      description: '企業の内部環境と外部環境を分析し、自社の「強み（Strengths）」「弱み（Weaknesses）」「機会（Opportunities）」「脅威（Threats）」を評価する経営戦略手法はどれですか？',
      explanation: 'SWOT分析は、企業の戦略策定や意思決定のために、内部要因（強み・弱み）と外部要因（機会・脅威）を体系的に分析するフレームワークです。',
      answerOptions: [
        'バランススコアカード',
        'ファイブフォース分析',
        'プロダクトポートフォリオマネジメント',
        'SWOT分析'
      ],
      correctAnswer: 3,
      difficultyId: 6, // 難易度ID
      subjectId: 2,
      categoryId: 3 // カテゴリID (※事前にCategoryテーブルに「ストラテジ系」などが存在する必要があります)
    },
  ];

  // データをデータベースに作成します
  for (const problem of basicAProblems) {
    await prisma.basc_Info_A_Question.create({
      data: problem,
    });
  }

  console.log(`✅ Created ${basicAProblems.length} Basic Info A problems.`);
}