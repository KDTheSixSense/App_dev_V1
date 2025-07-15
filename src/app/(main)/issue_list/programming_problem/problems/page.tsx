// /workspaces/my-next-app/src/app/(main)/issue_list/programming_problem/problems/page.tsx

import React from 'react';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProblemListRowProps {
  problemId: string;
  title: string;
  authorName: string | null;
}

// ★ ProblemListRowコンポーネントを修正して作成者名を表示
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, authorName }) => {
  return (
    <Link href={`/issue_list/programming_problem/${problemId}`} className="block w-full">
      <li className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-blue-600 hover:text-blue-800">
          問{problemId}: {title}
        </span>
        {/* ★★★ この部分を追加 ★★★ */}
        <span className="text-sm text-gray-500">
          作成者: {authorName}
        </span>
      </li>
    </Link>
  );
};

// pageコンポーネントは提供されたコードのままでOKです
const ProgrammingProblemsListPage = async () => {
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
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          プログラミングコーディング問題一覧
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
          <ul>
            {problems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                problemId={String(problem.id)}
                title={problem.title}
                authorName={problem.creator?.username ?? '不明'}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProgrammingProblemsListPage;