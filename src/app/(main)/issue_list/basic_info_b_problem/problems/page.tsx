// /src/app/(main)/issue_list/basic_info_b_problem/page.tsx
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

const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, solvedStatus }) => {
  // 基本情報 科目B 問題の詳細ページへのリンクを生成
  return (
    <Link href={`/issue_list/basic_info_b_problem/${problemId}`} className="block w-full">
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

// ページコンポーネントを非同期関数に変更
const BasicInfoBProblemsListPage = async () => {
  const session = await getAppSession();
  const userId = session.user?.id;

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // `questions_id` を使って正解履歴を取得
    const correctAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: userId,
        isCorrect: true,
        questions_id: { not: null },
      },
      select: {
        questions_id: true,
        answeredAt: true,
      },
      orderBy: { answeredAt: 'desc' },
    });

    for (const answer of correctAnswers) {
      const problemId = answer.questions_id;
      if (problemId === null || solvedStatusMap.has(problemId)) {
        continue;
      }
      const answeredDate = answer.answeredAt;
      const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
      solvedStatusMap.set(problemId, status);
    }
  }

  // 1. 両方のテーブルからデータを同時に取得します
  const [staticProblems, algoProblems] = await Promise.all([
    prisma.questions.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, title: true }
    }),
    prisma.questions_Algorithm.findMany({
      where: { subject: { name: '基本情報B問題' } }, // 科目Bの問題に絞り込む
      orderBy: { id: 'asc' },
      select: { id: true, title: true }
    })
  ]);

  // 2. 取得した2つの配列を1つに結合します
  const allProblems = [...staticProblems, ...algoProblems];

  // 3. ID順に並び替えます
  allProblems.sort((a, b) => a.id - b.id);

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
          基本情報技術者試験 科目B 問題一覧
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
          <ul>
            {allProblems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                problemId={problem.id}
                title={problem.title} // 日本語タイトルを表示
                solvedStatus={solvedStatusMap.get(problem.id) || 'none'}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoBProblemsListPage;