import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLeft } from 'lucide-react';

// 問題リスト行のProps型定義
interface ProblemListRowProps {
  problemId: number;
  title: string;
  solvedStatus: 'today' | 'past' | 'none';
}

// 基本情報A問題と完全に同じ構造・クラス名にしたコンポーネント
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, solvedStatus }) => {
  return (
    <li className="border-b border-gray-200 flex-shrink-0">
      <Link
        href={`/issue_list/applied_info_morning_problem/${problemId}`}
        className="block p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer w-full"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-medium text-blue-600 hover:text-blue-800">
              {title}
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
        </div>
      </Link>
    </li>
  );
};

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

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="mb-4 max-w-2xl mx-auto">
          <Link href="/issue_list" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            問題種別一覧へ戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          応用情報 午前問題一覧
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
          {problems.length > 0 ? (
            <ul>
              {problems.map((problem) => (
                <ProblemListRow
                  key={problem.id}
                  problemId={problem.id}
                  title={problem.title}
                  solvedStatus={solvedStatusMap.get(problem.id) || 'none'}
                />
              ))}
            </ul>
          ) : (
            <p className="p-4 text-center text-gray-500">問題が見つかりませんでした。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppliedInfoMorningProblemsListPage;