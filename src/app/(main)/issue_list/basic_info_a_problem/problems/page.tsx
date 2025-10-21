import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // データベース接続(Prisma)をインポート

// 削除: ローカルファイルからのインポートは不要になります
// import { basicInfoAProblems } from '@/lib/issue_list/basic_info_a_problem/problem';

interface ProblemListRowProps {
  problemId: string;
  title: string;
}

/**
 * 問題リストの各行を表示するコンポーネント
 */
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title }) => {
  return (
    <Link href={`/issue_list/basic_info_a_problem/${problemId}`} className="block w-full">
      <li className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-blue-600 hover:text-blue-800">
          問{problemId}: {title}
        </span>
      </li>
    </Link>
  );
};

/**
 * 問題一覧ページ (サーバーコンポーネント)
 */
// 'async' を追加して、コンポーネント内で 'await' を使えるようにします
const ProblemsListPage = async () => {
  
  // データベースから基本情報A問題のリストを取得します
  const problems = await prisma.basc_Info_A_Question.findMany({
    // 必要なデータ（id と title）のみを選択します
    select: {
      id: true,
      title: true
    },
    // IDの昇順で並び替えます
    orderBy: {
      id: 'asc'
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">問題一覧</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          <ul>
            {/* 取得した 'problems' 配列を map します */}
            {problems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                // DBの 'id' (数値) を 'String' (文字列) に変換します
                problemId={String(problem.id)}
                // DBの 'title' (文字列) を渡します ( .ja は不要)
                title={problem.title}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProblemsListPage;