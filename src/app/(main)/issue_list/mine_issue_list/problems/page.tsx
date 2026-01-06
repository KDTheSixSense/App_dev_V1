import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import StatusFilter from './StatusFilter';
import { ProgrammingProblemListRow, SelectProblemListRow } from './RowComponents';

// ページ全体のメインコンポーネント
const MineProblemsListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const session = await getAppSession();
  const userId = session.user?.id;

  if (!userId) {
    return <div className="p-8 text-center text-red-500">ログインが必要です。</div>;
  }

  // 1. 自分が作成した問題を取得
  const [programmingProblems, selectProblems] = await Promise.all([
    prisma.programmingProblem.findMany({
      where: { creator: { id: userId } },
      include: {
        creator: { select: { username: true } },
      },
      orderBy: { id: 'desc' },
    }),
    prisma.selectProblem.findMany({
      where: { creator: { id: userId } },
      include: {
        creator: { select: { username: true } },
      },
      orderBy: { id: 'desc' },
    }),
  ]);

  // 2. 解答状況の取得
  const solvedStatusMap = new Map<string, 'today' | 'past'>();
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const correctAnswers = await prisma.userAnswer.findMany({
    where: {
      userId: userId,
      isCorrect: true,
      OR: [
        { programingProblem_id: { not: null } },
        { selectProblem_id: { not: null } },
      ],
    },
    select: {
      programingProblem_id: true,
      selectProblem_id: true,
      answeredAt: true,
    },
    orderBy: { answeredAt: 'desc' },
  });

  for (const answer of correctAnswers) {
    let key = '';
    if (answer.programingProblem_id) {
      key = `prog_${answer.programingProblem_id}`;
    } else if (answer.selectProblem_id) {
      key = `select_${answer.selectProblem_id}`;
    }

    if (!key || solvedStatusMap.has(key)) continue;

    const answeredDate = answer.answeredAt;
    const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
    solvedStatusMap.set(key, status);
  }

  // 3. フィルタリング処理
  const resolvedSearchParams = await searchParams;
  const statusParam = resolvedSearchParams?.status;

  let filteredProgrammingProblems = programmingProblems;
  let filteredSelectProblems = selectProblems;

  if (statusParam === 'today') {
    filteredProgrammingProblems = programmingProblems.filter(
      (p) => solvedStatusMap.get(`prog_${p.id}`) === 'today'
    );
    filteredSelectProblems = selectProblems.filter(
      (p) => solvedStatusMap.get(`select_${p.id}`) === 'today'
    );
  } else if (statusParam === 'past') {
    filteredProgrammingProblems = programmingProblems.filter(
      (p) => solvedStatusMap.get(`prog_${p.id}`) === 'past'
    );
    filteredSelectProblems = selectProblems.filter(
      (p) => solvedStatusMap.get(`select_${p.id}`) === 'past'
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        {/* 一覧へ戻るボタン */}
        <div className="mb-4">
          <Link href="/issue_list" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            問題種別一覧へ戻る
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          作成した問題一覧
        </h1>

        <StatusFilter />
        
        <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-12 lg:space-y-0">

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              プログラミング問題
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {filteredProgrammingProblems.length === 0 ? (
                <p className="p-8 text-center text-gray-500">
                  {statusParam && statusParam !== 'all' 
                    ? '条件に一致するプログラミング問題はありません。' 
                    : '作成したプログラミング問題はまだありません。'}
                </p>
              ) : (
                <ul>
                  {filteredProgrammingProblems.map((problem) => (
                    <ProgrammingProblemListRow key={problem.id} problem={problem} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              選択問題
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {filteredSelectProblems.length === 0 ? (
                <p className="p-8 text-center text-gray-500">
                  {statusParam && statusParam !== 'all' 
                    ? '条件に一致する選択問題はありません。' 
                    : '作成した選択問題はまだありません。'}
                </p>
              ) : (
                <ul>
                  {filteredSelectProblems.map((problem) => (
                    <SelectProblemListRow key={problem.id} problem={problem} />
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MineProblemsListPage;