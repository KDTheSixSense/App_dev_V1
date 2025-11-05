import { notFound } from 'next/navigation';
//import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';


import { getAppliedInfoMorningProblemById } from '@/lib/issue_list/applied_info_morning_problem/problem';
import ProblemClient from './ProblemClient';
import type { Problem } from '@/lib/types'; // Problem 型をインポート
import type { SerializableProblem } from '@/lib/data'; // SerializableProblem 型をインポート

type AppliedInfoMorningProblemPageProps = {
  params: Promise<{ problemId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

const AppliedInfoMorningProblemPage = async ({ params, searchParams }: AppliedInfoMorningProblemPageProps) => {
  const resolvedParams = await params;
  const { problemId } = resolvedParams;
  const resolvedSearchParams = searchParams ? await searchParams : undefined; // searchParams を await する
  const session = await getAppSession();
  const problem = getAppliedInfoMorningProblemById(problemId);

  if (!problem || !problem.answerOptions) { // problem.answerOptions が undefined の場合も notFound を呼び出す
    notFound();
  }

  // Problem 型から SerializableProblem 型に変換
  const serializableProblem: SerializableProblem = {
    ...problem,
    programLines: problem.programLines ?? { ja: [], en: [] },
    explanationText: problem.explanationText ?? { ja: '', en: '' },
    initialVariables: problem.initialVariables ?? {},
  };

  let userCredits = 0;
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { aiAdviceCredits: true },
    });
    if (user) {
      userCredits = user.aiAdviceCredits;
    }
  }

  return <ProblemClient initialProblem={serializableProblem} initialCredits={userCredits} />;
};

export default AppliedInfoMorningProblemPage;