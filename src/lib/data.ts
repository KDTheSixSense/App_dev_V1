// /workspaces/my-next-app/src/lib/data.ts
import { problems as localProblems, Problem as AppProblem } from '@/app/(main)/issue_list/basic_info_b_problem/data/problems';
import { prisma } from './prisma';
import type { Questions as DbStaticProblem, Questions_Algorithm as DbAlgoProblem } from '@prisma/client';

// クライアントに渡すことができる、シリアライズ可能な問題の型
export type SerializableProblem = Omit<AppProblem, 'traceLogic' | 'calculateNextLine'>;

/**
 * DBから取得した静的な問題(Questions)をクライアント用の形式に変換します。
 * @param dbProblem - Prismaから取得したQuestionsオブジェクト
 * @returns クライアントで利用可能な SerializableProblem
 */
function transformStaticProblem(dbProblem: DbStaticProblem): SerializableProblem | null {
  // DBにない詳細情報（プログラムのロジックなど）をローカルのデータから探して補完します
  const fullProblemData = localProblems.find(p => p.id === dbProblem.id.toString());
  if (!fullProblemData) {
    console.error(`Local problem definition for ID ${dbProblem.id} not found.`);
    // fullProblemDataが見つからない場合、最低限の情報でフォールバックします
    return {
      id: dbProblem.id.toString(),
      title: { ja: dbProblem.title, en: dbProblem.title },
      description: { ja: dbProblem.question, en: dbProblem.question },
      explanationText: { ja: dbProblem.explain ?? '', en: dbProblem.explain ?? '' },
      programLines: { ja: [], en: [] },
      answerOptions: { ja: [], en: [] },
      correctAnswer: '', // 正解データはローカルに依存するため空文字
      initialVariables: {},
      logicType: 'STATIC_QA', // 静的な質疑応答形式として扱う
    };
  }
  // シリアライズできない関数を除外して返します
  const { traceLogic, calculateNextLine, ...serializableData } = fullProblemData;
  return serializableData;
}

/**
 * DBから取得したアルゴリズム問題(Questions_Algorithm)をクライアント用の形式に変換します。
 * @param dbProblem - Prismaから取得したQuestions_Algorithmオブジェクト
 * @returns クライアントで利用可能な SerializableProblem
 */
function transformAlgoProblem(dbProblem: DbAlgoProblem): SerializableProblem {
  const parseJSON = (str: string | null, fallback: any) => {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
  };
  const programLinesArray = (dbProblem.programLines ?? '').split('\n');
  return {
    id: dbProblem.id.toString(),
    title: { ja: dbProblem.title, en: dbProblem.title },
    description: { ja: dbProblem.description ?? '', en: dbProblem.description ?? '' },
    explanationText: { ja: dbProblem.explanation ?? '', en: dbProblem.explanation ?? '' },
    programLines: { ja: programLinesArray, en: programLinesArray },
    answerOptions: { 
      ja: parseJSON(dbProblem.answerOptions, []), 
      en: parseJSON(dbProblem.answerOptions, []) 
    },
    correctAnswer: dbProblem.correctAnswer ?? '',
    initialVariables: dbProblem.initialVariable as AppProblem['initialVariables'] ?? {},
    logicType: dbProblem.logictype,
    traceOptions: parseJSON(dbProblem.options as string | null, undefined),
  };
}

/**
 * 指定されたIDの問題データを取得するためのメイン関数。
 * この関数がページコンポーネントから呼び出されます。
 * @param id - 取得したい問題のID
 * @returns 見つかった問題データ、またはnull
 */
export async function getProblemForClient(id: number): Promise<SerializableProblem | null> {
  try {
    // まず、静的な問題テーブル(Questions)を探します
    const staticProblem = await prisma.questions.findUnique({ where: { id } });
    if (staticProblem) {
      return transformStaticProblem(staticProblem);
    }

    // 見つからなければ、アルゴリズム問題テーブル(Questions_Algorithm)を探します
    const algoProblem = await prisma.questions_Algorithm.findUnique({ where: { id } });
    if (algoProblem) {
      return transformAlgoProblem(algoProblem);
    }

    // どちらのテーブルにもなければ、nullを返します
    return null;
  } catch (error) {
    console.error("Failed to fetch problem:", error);
    return null;
  }
}
