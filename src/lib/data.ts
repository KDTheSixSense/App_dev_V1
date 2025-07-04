import { problemLogicsMap } from '@/app/(main)/issue_list/basic_info_b_problem/data/problem-logics';
// ▼▼▼【修正】VariablesStateもインポートする▼▼▼
import { problems as localProblems, Problem as AppProblem, AnswerOption, VariablesState } from '@/app/(main)/issue_list/basic_info_b_problem/data/problems';
import { prisma } from './prisma';
import type { Questions as DbStaticProblem, Questions_Algorithm as DbAlgoProblem } from '@prisma/client';

// ▼▼▼【修正】型定義から不要なフィールドを一旦削除し、エラーを解消します▼▼▼
// 将来的にdifficultyなどを使いたい場合は、再度追加し、変換関数も修正する必要があります。
export type SerializableProblem = Omit<AppProblem, 'traceLogic' | 'calculateNextLine'>;


function transformStaticProblem(dbProblem: DbStaticProblem): SerializableProblem | null {
  const fullProblemData = localProblems.find(p => p.id === dbProblem.id.toString());
  if (!fullProblemData) {
    console.error(`Local problem definition for ID ${dbProblem.id} not found.`);
    // 最低限の情報を返す場合でも、型が一致するようにします
    return {
      id: dbProblem.id.toString(),
      title: { ja: dbProblem.title, en: dbProblem.title },
      description: { ja: dbProblem.question, en: dbProblem.question },
      explanationText: { ja: dbProblem.explain ?? '', en: dbProblem.explain ?? '' },
      programLines: { ja: [], en: [] },
      answerOptions: { ja: [], en: [] },
      correctAnswer: '',
      initialVariables: {},
      logicType: 'STATIC_QA',
    };
  }
  // fullProblemDataから不要な関数を除外して返す
  const { traceLogic, calculateNextLine, ...serializableData } = fullProblemData;
  return serializableData;
}

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

export async function getProblemForClient(id: number): Promise<SerializableProblem | null> {
  try {
    const staticProblem = await prisma.questions.findUnique({ where: { id } });
    if (staticProblem) {
      return transformStaticProblem(staticProblem);
    }
    const algoProblem = await prisma.questions_Algorithm.findUnique({ where: { id } });
    if (algoProblem) {
      return transformAlgoProblem(algoProblem);
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch problem:", error);
    return null;
  }
}

/**
 * 次の問題のIDを取得します。
 */
export async function getNextProblemId(currentId: number): Promise<number | null> {
  const [staticIds, algoIds] = await Promise.all([
    prisma.questions.findMany({ select: { id: true } }),
    prisma.questions_Algorithm.findMany({ select: { id: true } })
  ]);

  const allIds = [...staticIds.map(p => p.id), ...algoIds.map(p => p.id)];
  const sortedUniqueIds = [...new Set(allIds)].sort((a, b) => a - b);

  const currentIndex = sortedUniqueIds.indexOf(currentId);
  if (currentIndex === -1 || currentIndex === sortedUniqueIds.length - 1) {
    return null; // 見つからないか、最後の問題
  }
  return sortedUniqueIds[currentIndex + 1];
}