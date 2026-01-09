import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import AnimatedList, { AnimatedListItem } from '../../components/AnimatedList';
import BackButton from '../../components/BackButton';
import StatusFilter from './StatusFilter';

const ProgrammingProblemsListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const session = await getAppSession();
  const userId = session.user?.id;

  // Promise.all で並列実行するためのPromise配列を準備
  // TypeScriptの型推論のため、タプルとして定義するか、後でキャストする
  const promises: [Promise<any[]>, Promise<any[]>] = [
    // 1. 問題リスト
    prisma.programmingProblem.findMany({
      where: {
        isPublished: true,
        isPublic: true,
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
    }),
    // 2. 正解履歴 (userIdがある場合のみ)
    userId ? prisma.userAnswer.findMany({
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
    }) : Promise.resolve([]) // userIdがない場合は空配列を返す
  ];

  const [problems, correctAnswers] = await Promise.all(promises);

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId && correctAnswers.length > 0) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

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

  // フィルタリング処理
  const resolvedSearchParams = await searchParams;
  const statusParam = resolvedSearchParams?.status;

  let filteredProblems = problems;
  if (statusParam === 'today') {
    filteredProblems = problems.filter((p) => solvedStatusMap.get(p.id) === 'today');
  } else if (statusParam === 'past') {
    filteredProblems = problems.filter((p) => solvedStatusMap.get(p.id) === 'past');
  }

  // AnimatedList用にデータを変換
  const items: AnimatedListItem[] = filteredProblems.map((problem) => {
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
          プログラミング問題一覧
        </h1>

        <StatusFilter />

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