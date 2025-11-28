// /workspaces/my-next-app/src/app/(main)/issue_list/programming_problem/problems/page.tsx

import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLeft } from 'lucide-react';


interface ProblemListRowProps {
  problemId: number;
  title: string;
  solvedStatus: 'today' | 'past' | 'none';
}

// ProblemListRowコンポーネントを修正して作成者名を表示
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, solvedStatus }) => {
  return (
    <Link href={`/issue_list/programming_problem/${problemId}`} className="block w-full">
      <li className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <div className="flex items-center">
          <span className="font-medium text-blue-600 hover:text-blue-800">
            問{problemId}: {title}
          </span>
        </div>
        {solvedStatus === 'today' && (
          <span className="text-sm font-semibold text-white bg-blue-500 rounded-full px-3 py-1">
            解答済み
          </span>
        )}
        {solvedStatus === 'past' && (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        )}
      </li>
    </Link>
  );
};

// pageコンポーネントは提供されたコードのままでOKです
const ProgrammingProblemsListPage = async () => {
  const session = await getAppSession();
  const userId = session.user?.id;

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // `programingProblem_id` を使って正解履歴を取得
    const correctAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: userId,
        isCorrect: true,
        programingProblem_id: { not: null },
      },
      select: {
        programingProblem_id: true,
        answeredAt: true,
      },
      orderBy: { answeredAt: 'desc' },
    });

    for (const answer of correctAnswers) {
      const problemId = answer.programingProblem_id;
      if (problemId === null || solvedStatusMap.has(problemId)) {
        continue;
      }
      const answeredDate = answer.answeredAt;
      const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
      solvedStatusMap.set(problemId, status);
    }
  }

  const problems = await prisma.programmingProblem.findMany({
    where: {
      isPublished: true,
    },
    include: {
      creator: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="mb-4 max-w-4xl mx-auto">
          <Link href="/issue_list" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            問題種別一覧へ戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          プログラミングコーディング問題一覧
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
          <ul>
            {problems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                problemId={problem.id}
                title={problem.title}
                solvedStatus={solvedStatusMap.get(problem.id) || 'none'} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProgrammingProblemsListPage;