import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

// 問題リスト行のProps型定義
interface ProblemListRowProps {
  problemId: number;
  title: string;
}

// 基本情報A問題と完全に同じ構造・クラス名にしたコンポーネント
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title }) => {
  return (
    <li className="border-b border-gray-200 flex-shrink-0">
      <Link
        href={`/issue_list/applied_info_morning_problem/${problemId}`}
        className="block p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer w-full"
      >
        <div className="flex justify-between items-center">
          <span className="font-medium text-blue-600 hover:text-blue-800">
            {/* 基本Aに合わせて "問X:" のプレフィックスは削除し、タイトルのみ表示します。
                もし "問X:" が必要な場合は `{`問${problemId}: ${title}`} としてください。 */}
            {title}
          </span>
        </div>
      </Link>
    </li>
  );
};

const AppliedInfoMorningProblemsListPage = async () => {
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