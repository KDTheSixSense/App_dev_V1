import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import AnimatedList, { AnimatedListItem } from '../../components/AnimatedList';
import BackButton from '../../components/BackButton';

const AppliedInfoMorningProblemsListPage = async () => {
  const session = await getAppSession();
  const userId = session.user?.id;

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // 応用情報午前問題の正解履歴を取得
    // スキーマに基づき、applied_am_question_id を使用
    const correctAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: userId,
        isCorrect: true,
        applied_am_question_id: { not: null },
      },
      select: {
        applied_am_question_id: true,
        answeredAt: true,
      },
      orderBy: { answeredAt: 'desc' },
    });

    for (const answer of correctAnswers) {
      const problemId = answer.applied_am_question_id;
      if (problemId === null || solvedStatusMap.has(problemId)) {
        continue;
      }
      const answeredDate = answer.answeredAt;
      const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
      solvedStatusMap.set(problemId, status);
    }
  }

  const problems = await prisma.applied_am_Question.findMany({
    select: {
      id: true,
      title: true,
    },
    orderBy: [
      { id: 'asc' },
    ]
  });

  // AnimatedList用にデータを変換
  const items: AnimatedListItem[] = problems.map((problem) => {
    return {
      id: problem.id,
      title: problem.title,
      href: `/issue_list/applied_info_morning_problem/${problem.id}`,
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
          応用情報 午前問題一覧
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

export default AppliedInfoMorningProblemsListPage;