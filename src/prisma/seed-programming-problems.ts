import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * プログラミング問題のシーディング
 * 元の prisma/seed/questions.ts 内の seedSampleProgrammingProblems 関数をベースにしています。
 */
async function seedProgrammingProblems(prisma: PrismaClient) {
  console.log('🌱 Seeding programming problems...');

  // spreadsheetProblems 配列は prisma/seed/questions.ts からコピー
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
        },
        testCases: {
            create: [
                { input: '100\n100\n100', expectedOutput: '300', name: 'ケース1', order: 1 },
                { input: '0\n0\n0', expectedOutput: '0', name: 'ケース2', order: 2 },
                { input: '-1\n-1\n-1', expectedOutput: '-3', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '1\n100', expectedOutput: '100', name: 'ケース1', order: 1 },
                { input: '4\n10\n-10\n5\n-5', expectedOutput: '0', name: 'ケース2', order: 2 },
                { input: '10\n1\n1\n1\n1\n1\n1\n1\n1\n1\n1', expectedOutput: '10', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '2', expectedOutput: 'Even', name: 'ケース1', order: 1 },
                { input: '1', expectedOutput: 'Odd', name: 'ケース2', order: 2 },
                { input: '99', expectedOutput: 'Odd', name: 'ケース3', order: 3 },
                { input: '1000', expectedOutput: 'Even', name: 'ケース4', order: 4 }
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
        },
        testCases: {
            create: [
                { input: 'Code\nMonkey', expectedOutput: 'CodeMonkey', name: 'ケース1', order: 1 },
                { input: 'Super\nMario', expectedOutput: 'SuperMario', name: 'ケース2', order: 2 },
                { input: 'A\nB', expectedOutput: 'AB', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '5\n10 20 30 40 50', expectedOutput: '50', name: 'ケース1', order: 1 },
                { input: '5\n50 40 30 20 10', expectedOutput: '50', name: 'ケース2', order: 2 },
                { input: '1\n100', expectedOutput: '100', name: 'ケース3', order: 3 },
                { input: '4\n-1 -2 -3 -4', expectedOutput: '-1', name: 'ケース4', order: 4 }
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
        },
        testCases: {
            create: [
                { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', name: 'ケース1', order: 1 },
                { input: '3', expectedOutput: '1\n2\nFizz', name: 'ケース2', order: 2 },
                { input: '16', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '3\n10 20 30', expectedOutput: '30 20 10', name: 'ケース1', order: 1 },
                { input: '1\n99', expectedOutput: '99', name: 'ケース2', order: 2 },
                { input: '4\n8 6 4 2', expectedOutput: '2 4 6 8', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: 'banana\nn', expectedOutput: '2', name: 'ケース1', order: 1 },
                { input: 'apple\nz', expectedOutput: '0', name: 'ケース2', order: 2 },
                { input: 'Mississipi\ni', expectedOutput: '4', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '1', expectedOutput: '1', name: 'ケース1', order: 1 },
                { input: '3', expectedOutput: '6', name: 'ケース2', order: 2 },
                { input: '6', expectedOutput: '720', name: 'ケース3', order: 3 },
                { input: '10', expectedOutput: '3628800', name: 'ケース4', order: 4 }
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
        },
        testCases: {
            create: [
                { input: '13', expectedOutput: 'Yes', name: 'ケース1', order: 1 },
                { input: '15', expectedOutput: 'No', name: 'ケース2', order: 2 },
                { input: '97', expectedOutput: 'Yes', name: 'ケース3', order: 3 },
                { input: '100', expectedOutput: 'No', name: 'ケース4', order: 4 }
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
        },
        testCases: {
            create: [
                { input: '5 1\n1 2 3 4 5', expectedOutput: '0', name: 'ケース1', order: 1 },
                { input: '5 5\n1 2 3 4 5', expectedOutput: '4', name: 'ケース2', order: 2 },
                { input: '3 2\n1 3 5', expectedOutput: '-1', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '12 18', expectedOutput: '6', name: 'ケース1', order: 1 },
                { input: '101 103', expectedOutput: '1', name: 'ケース2', order: 2 },
                { input: '100 25', expectedOutput: '25', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '3\n3 2 1', expectedOutput: '1 2 3', name: 'ケース1', order: 1 },
                { input: '4\n1 3 2 4', expectedOutput: '1 2 3 4', name: 'ケース2', order: 2 },
                { input: '5\n10 5 8 2 1', expectedOutput: '1 2 5 8 10', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '3\n10 20 30\n3\n1 1\n1 2\n1 3', expectedOutput: '10\n30\n60', name: 'ケース1', order: 1 },
                { input: '3\n1 1 1\n1\n2 3', expectedOutput: '2', name: 'ケース2', order: 2 }
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
        },
        testCases: {
            create: [
                { input: '3 2\n1 2\n2 3', expectedOutput: '1\n2\n3', name: 'ケース1', order: 1 },
                { input: '5 4\n1 2\n1 3\n2 4\n2 5', expectedOutput: '1\n2\n4\n5\n3', name: 'ケース2', order: 2 }
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
        },
        testCases: {
            create: [
                 { input: '3 2\n1 2\n2 3', expectedOutput: '1\n2\n3', name: 'ケース1', order: 1 },
                 { input: '5 4\n1 2\n1 3\n2 4\n2 5', expectedOutput: '1\n2\n3\n4\n5', name: 'ケース2', order: 2 }
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
        },
        testCases: {
            create: [
                { input: '0', expectedOutput: '0', name: 'ケース1', order: 1 },
                { input: '1', expectedOutput: '1', name: 'ケース2', order: 2 },
                { input: '2', expectedOutput: '1', name: 'ケース3', order: 3 },
                { input: '5', expectedOutput: '5', name: 'ケース4', order: 4 },
                { input: '20', expectedOutput: '6765', name: 'ケース5', order: 5 }
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
        },
        testCases: {
            create: [
                { input: '2 10\n5 10\n5 20', expectedOutput: '30', name: 'ケース1', order: 1 },
                { input: '3 3\n1 10\n1 20\n1 30', expectedOutput: '60', name: 'ケース2', order: 2 }
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
        },
        testCases: {
            create: [
                { input: '3 2 0\n0 1 10\n1 2 20', expectedOutput: '0\n10\n30', name: 'ケース1', order: 1 }
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
        },
        testCases: {
            create: [
                { input: '2023 1 1', expectedOutput: '2023 1 2', name: 'ケース1', order: 1 },
                { input: '2023 2 28', expectedOutput: '2023 3 1', name: 'ケース2', order: 2 },
                { input: '2020 2 28', expectedOutput: '2020 2 29', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '()', expectedOutput: 'Yes', name: 'ケース1', order: 1 },
                { input: '((', expectedOutput: 'No', name: 'ケース2', order: 2 },
                { input: '(]', expectedOutput: 'No', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '3\n100 10 50', expectedOutput: '2 0 1', name: 'ケース1', order: 1 },
                { input: '3\n10 10 10', expectedOutput: '0 0 0', name: 'ケース2', order: 2 }
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
        },
        testCases: {
            create: [
                { input: '2\n10 20', expectedOutput: '15', name: 'ケース1', order: 1 },
                { input: '2\n10 11', expectedOutput: '10', name: 'ケース2', order: 2 }
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
        },
        testCases: {
            create: [
                { input: 'ABC', expectedOutput: 'NOP', name: 'ケース1', order: 1 },
                { input: 'NOP', expectedOutput: 'ABC', name: 'ケース2', order: 2 },
                { input: 'a', expectedOutput: 'n', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '1\n10 2', expectedOutput: '1 0', name: 'ケース1', order: 1 },
                { input: '1\n2 10', expectedOutput: '0 1', name: 'ケース2', order: 2 },
                { input: '1\n5 5', expectedOutput: '0 0', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '6', expectedOutput: '1\n2\n3\n6', name: 'ケース1', order: 1 },
                { input: '7', expectedOutput: '1\n7', name: 'ケース2', order: 2 },
                { input: '1', expectedOutput: '1', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: 'aba', expectedOutput: 'Yes', name: 'ケース1', order: 1 },
                { input: 'abc', expectedOutput: 'No', name: 'ケース2', order: 2 },
                { input: 'a', expectedOutput: 'Yes', name: 'ケース3', order: 3 }
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
        },
        testCases: {
            create: [
                { input: '2 2 2\n1 0\n0 1\n1 2\n3 4', expectedOutput: '1 2\n3 4', name: '単位行列との積', order: 1 }
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
        },
        testCases: {
            create: [
                { input: '0 0', expectedOutput: '0', name: 'ケース1', order: 1 },
                { input: '1 0', expectedOutput: '1', name: 'ケース2', order: 2 },
                { input: '12 10', expectedOutput: '6', name: 'ケース3', order: 3 }
            ]
        }
    }
  ];

  // 既存のデータを上書きしないように、upsert を使用
  for (const p of spreadsheetProblems) {
    const { difficulty, ...restOfProblemData } = p;
    const eventDifficultyId = difficulty >= 6 ? 1 : difficulty;

    // 既存の問題をタイトルで検索
    const existingProblem = await prisma.programmingProblem.findUnique({
      where: { title: p.title },
    });

    if (existingProblem) {
      console.log(`🆙 Updating problem: "${p.title}"`);
      await prisma.programmingProblem.update({
        where: { title: p.title },
        data: {
          ...restOfProblemData,
          difficulty: difficulty,
          eventDifficultyId: eventDifficultyId,
          // sampleCases と testCases はリレーションなので、別途更新が必要
          // ここでは簡単化のため、既にあれば本体データのみ更新
        },
      });
    } else {
      console.log(`✅ Creating problem: "${p.title}"`);
      await prisma.programmingProblem.create({
        data: {
          ...restOfProblemData,
          difficulty: difficulty,
          eventDifficultyId: eventDifficultyId,
        },
      });
    }
  }
  console.log(`✅ Finished seeding ${spreadsheetProblems.length} programming problems.`);
}

async function main() {
  console.log(`🚀 Start seeding programming problems...`);
  // 既存のデータを削除しないように注意
  await seedProgrammingProblems(prisma);
  console.log('✅ Seeding finished.');
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
