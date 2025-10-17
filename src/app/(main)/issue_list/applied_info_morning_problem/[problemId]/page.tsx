import { notFound } from 'next/navigation';
//import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';



import { getAppliedInfoMorningProblemById } from '@/lib/issue_list/applied_info_morning_problem/problem';
import ProblemClient from './ProblemClient';
import type { SerializableProblem } from '@/lib/data';

interface PageProps {
  params: Promise<{ problemId: string }>;
}

const AppliedInfoMorningProblemPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;
  const { problemId } = resolvedParams;
  const session = await getAppSession();
  const problem = getAppliedInfoMorningProblemById(problemId);

  if (!problem) {
    notFound();
  }

  // answerOptionsが存在しない場合もnotFoundを呼び出す
    if (!problem.answerOptions) {
      notFound();
    }

  const problemForClient: SerializableProblem = {
    ...problem,
    answerOptions: problem.answerOptions,
    programLines: problem.programLines || { ja: [], en: [] },
    explanationText: problem.explanationText || { ja: '', en: '' },
    initialVariables: problem.initialVariables || {},
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

  return <ProblemClient initialProblem={problemForClient} initialCredits={userCredits} />;
};

export default AppliedInfoMorningProblemPage;