import { notFound } from 'next/navigation';
//import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';



import { getAppliedInfoMorningProblemById } from '@/lib/issue_list/applied_info_morning_problem/problem';
import ProblemClient from './ProblemClient';

interface PageProps {
  params: { problemId: string };
}

const AppliedInfoMorningProblemPage = async ({ params }: PageProps) => {
  const { problemId } = params;
  const session = await getAppSession();
  const problem = getAppliedInfoMorningProblemById(problemId);

  if (!problem) {
    notFound();
  }

  // answerOptionsが存在しない場合もnotFoundを呼び出す
    if (!problem.answerOptions) {
      notFound();
    }

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

  return <ProblemClient initialProblem={problem} initialCredits={userCredits} />;
};

export default AppliedInfoMorningProblemPage;