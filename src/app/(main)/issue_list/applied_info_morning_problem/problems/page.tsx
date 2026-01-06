import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import AnimatedList, { AnimatedListItem } from '../../components/AnimatedList';
import BackButton from '../../components/BackButton';
import CategoryFilter from './CategoryFilter';

const AppliedInfoMorningProblemsListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
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

  const resolvedSearchParams = await searchParams;
  const categoryParam = resolvedSearchParams?.category;
  const statusParam = resolvedSearchParams?.status;
  const categoryId = typeof categoryParam === 'string' ? parseInt(categoryParam, 10) : undefined;

  // フィルタ条件の構築
  const where: any = {};

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (statusParam === 'today') {
    const todayIds = Array.from(solvedStatusMap.entries())
      .filter(([_, status]) => status === 'today')
      .map(([id]) => id);
    where.id = { in: todayIds };
  } else if (statusParam === 'past') {
    const pastIds = Array.from(solvedStatusMap.entries())
      .filter(([_, status]) => status === 'past')
      .map(([id]) => id);
    where.id = { in: pastIds };
  }

  const problems = await prisma.applied_am_Question.findMany({
    where,
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

        <CategoryFilter />
        
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