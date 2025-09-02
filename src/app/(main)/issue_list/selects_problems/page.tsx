import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // データベース接続用のPrisma Clientをインポート

// Propsの型定義をデータベースの型に合わせます
interface ProblemListRowProps {
  problemId: number; // データベースのIDは数値です
  title: string;
}

const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title }) => {
  return (
    // Linkのパスを正しく設定します
    <Link href={`/issue_list/selects_problems/${problemId}`} className="block w-full">
      <li className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-blue-600 hover:text-blue-800">
          問{problemId}: {title}
        </span>
      </li>
    </Link>
  );
};

// ページコンポーネントを非同期関数 `async` に変更します
const SelectProblemsListPage = async () => {
  // サーバーサイドでデータベースから問題リストを取得します
  const problems = await prisma.selectProblem.findMany({
    where: {
      subjectId: 4, // "プログラミング選択問題"のID
    },
    orderBy: {
      id: 'asc', // IDの昇順で並べます
    },
    select: {
      id: true,
      title: true,
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">プログラミング 選択問題一覧</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          <ul>
            {/* 取得した問題のリストを表示します */}
            {problems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                problemId={problem.id}
                title={problem.title}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelectProblemsListPage;