import { PrismaClient } from '@prisma/client';
import type { Problem } from '@/lib/problem-types'; // 既存のProblem型を再利用

const prisma = new PrismaClient();

// Prismaのモデルからフロントエンドで使うProblem型に変換する関数
function convertToSerializableProblem(dbProblem: any): Problem | undefined {
  if (!dbProblem) return undefined;
  
  // DBのデータ構造を既存の `Problem` 型に合わせる
  // 注意：この変換は、DBスキーマとProblem型が異なる場合に必要です。
  // 今回は簡易的に主要なプロパティのみをマッピングします。
  return {
    id: String(dbProblem.id),
    logicType: 'CODING_PROBLEM', // 固定値、またはDBに保存
    title: { ja: dbProblem.title, en: dbProblem.title }, // 暫定的に同じタイトルを設定
    description: { ja: dbProblem.description, en: dbProblem.description },
    // サンプルケースなどをDBから取得して設定
    programLines: { ja: [], en: [] }, // 必要に応じてDBから取得
    answerOptions: { ja: [], en: [] }, // コーディング問題では空の場合が多い
    correctAnswer: dbProblem.sampleCases?.[0]?.expectedOutput || '', // 最初のサンプルケースの出力を正解とする（仮）
    explanationText: { ja: dbProblem.description, en: dbProblem.description }, // 解説をDBに追加することも可能
    initialVariables: {},
    traceLogic: [],
  };
}


/**
 * IDに基づいて単一のプログラミング問題を取得します。
 * (問題詳細ページで使用)
 */
export const getProgrammingProblemById = async (id: string): Promise<Problem | undefined> => {
  const problemId = parseInt(id, 10);
  if (isNaN(problemId)) {
    return undefined;
  }

  const problemFromDb = await prisma.programmingProblem.findUnique({
    where: { id: problemId },
    include: {
      sampleCases: true, // サンプルケースも一緒に取得
    },
  });

  return convertToSerializableProblem(problemFromDb);
};

/**
 * すべてのプログラミング問題のリストを取得します。
 * (問題一覧ページでサーバーコンポーネントを使わない場合)
 */
export const getAllProgrammingProblems = async (): Promise<Problem[]> => {
  const problemsFromDb = await prisma.programmingProblem.findMany({
    where: { isPublished: true },
    orderBy: { id: 'asc' },
    include: {
      sampleCases: true,
    },
  });

  return problemsFromDb.map(p => convertToSerializableProblem(p)).filter(p => p !== undefined) as Problem[];
};