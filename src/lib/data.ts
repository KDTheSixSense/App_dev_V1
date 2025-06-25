import { problemLogicsMap } from '@/app/(main)/issue_list/basic_info_b_problem/data/problem-logics';
import type { Problem as AppProblem, AnswerOption } from '@/app/(main)/issue_list/basic_info_b_problem/data/problems';
import { prisma } from './prisma'; 
import { Problem as DbProblem } from '@prisma/client';

export type SerializableProblem = Omit<AppProblem, 'traceLogic' | 'calculateNextLine'>;

/**
 * DBから取得したデータを、アプリケーションで使う形式に変換・整形します。
 * @param dbProblem Prismaから取得したProblemオブジェクト
 * @returns フロントエンドコンポーネントが期待する形式のProblemオブジェクト
 */
/**
 * DBから取得したデータを、シリアライズ可能な形式に変換・整形します。
 * @param dbProblem Prismaから取得したProblemオブジェクト
 * @returns フロントエンドコンポーネントに渡せるシリアライズ可能なProblemオブジェクト
 */
function transformProblemToSerializable(dbProblem: DbProblem): SerializableProblem | null {
  // logicTypeに対応するロジック定義の存在チェックだけ行う
  if (!problemLogicsMap[dbProblem.logicType as keyof typeof problemLogicsMap]) {
    console.error(`Logic for type "${dbProblem.logicType}" not found.`);
    return null;
  }
  
  // JSON型を適切にキャスト
  const answerOptions_ja = dbProblem.answerOptions_ja as unknown as AnswerOption[];
  const answerOptions_en = dbProblem.answerOptions_en as unknown as AnswerOption[];
  const traceOptions = dbProblem.options as { presets?: number[] } | null;

  // フロントエンドで使うAppProblemの形式に整形
  return {
    id: dbProblem.id.toString(),
    title: { ja: dbProblem.title_ja, en: dbProblem.title_en },
    description: { ja: dbProblem.description_ja, en: dbProblem.description_en },
    programLines: { ja: dbProblem.programLines_ja, en: dbProblem.programLines_en },
    answerOptions: { ja: answerOptions_ja, en: answerOptions_en },
    correctAnswer: dbProblem.correctAnswer,
    explanationText: { ja: dbProblem.explanation_ja, en: dbProblem.explanation_en },
    initialVariables: dbProblem.initialVariables as AppProblem['initialVariables'],
    traceOptions: (traceOptions && traceOptions.presets) ? { presets: traceOptions.presets } : undefined,
    // logicTypeは、クライアント側でロジックを特定するために必要なので、含めます。
    // あれ、AppProblemにlogicTypeがない？追加しましょう。
    logicType: dbProblem.logicType, 
  };
}


/**
 * IDを指定して、単一の問題データをデータベースから取得し、整形して返します。
 * @param id 取得する問題のID（数値）
 */
export async function getProblemForClient(id: number): Promise<SerializableProblem | null> {  try {
    const problemFromDb = await prisma.problem.findUnique({
      where: { id: id },
    });

    if (!problemFromDb) {
      return null;
    }
    
    return transformProblemToSerializable(problemFromDb);

  } catch (error) {
    console.error("Failed to fetch problem:", error);
    return null;
  }
}

/**
 * 次の問題のIDを取得します。
 * @param currentId 現在の問題ID
 * @returns 次の問題が存在すればそのID、なければnull
 */
export async function getNextProblemId(currentId: number): Promise<number | null> {
    const nextProblem = await prisma.problem.findFirst({
        where: { id: { gt: currentId } }, // 現在のIDより大きい最初の問題
        orderBy: { id: 'asc' },
        select: { id: true }
    });
    return nextProblem ? nextProblem.id : null;
}