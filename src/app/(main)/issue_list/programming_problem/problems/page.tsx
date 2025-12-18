import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import AnimatedList, { AnimatedListItem } from '../../components/AnimatedList';
import BackButton from '../../components/BackButton';

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

  // AnimatedList用にデータを変換
  const items: AnimatedListItem[] = problems.map((problem) => {
    return {
      id: problem.id,
      title: `問${problem.id}: ${problem.title}`, // タイトルに問題番号を含める
      href: `/issue_list/programming_problem/${problem.id}`,
      solvedStatus: solvedStatusMap.get(problem.id) || 'none',
    };
  });

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="mb-4 max-w-6xl mx-auto">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          プログラミングコーディング問題一覧
        </h1>
        
        {/* 新しいAnimatedListコンポーネントを使用 */}
        <AnimatedList 
          items={items} 
          showGradients={true}
          displayScrollbar={true}
        />
      </div>
    </div>
  );
};

export default ProgrammingProblemsListPage;