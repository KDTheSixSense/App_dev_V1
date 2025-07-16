// "use client"; を削除します

import React from 'react';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client'; // Prisma Clientをインポート

const prisma = new PrismaClient(); // Prisma Clientのインスタンスを作成

// 問題リスト行のProps型定義
interface ProblemListRowProps {
  problemId: string;
  title: string;
}

const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title }) => {
  return (
    <Link href={`/issue_list/programming_problem/${problemId}`} className="block w-full">
      <li className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-blue-600 hover:text-blue-800">
          問{problemId}: {title}
        </span>
      </li>
    </Link>
  );
};

// コンポーネントを async 関数に変更
const ProgrammingProblemsListPage = async () => {
  // データベースから公開されている問題を取得
  const problems = await prisma.programmingProblem.findMany({
    where: {
      isPublished: true, // 公開済みの問題のみ取得
    },
    orderBy: {
      id: 'asc', // IDの昇順でソート
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          プログラミングコーディング問題一覧
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          <ul>
            {/* 取得した問題データをマップして表示 */}
            {problems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                problemId={String(problem.id)} // IDを文字列に変換
                title={problem.title} // DBから取得したタイトル
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProgrammingProblemsListPage;