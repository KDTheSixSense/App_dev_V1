// /workspaces/my-next-app/src/app/(main)/issue_list/applied_info_morning_problem/problems/page.tsx

// "use client"; // サーバーコンポーネントにするため削除
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // データベース接続(Prisma)をインポート

// ローカルファイルからのインポートを削除
// import { appliedInfoMorningProblems } from '@/lib/issue_list/applied_info_morning_problem/problem';

// 問題リスト行のProps型定義
interface ProblemListRowProps {
  problemId: number; // DBのIDは number 型
  title: string;
}

// サブコンポーネントは "use client" がなくても動作します
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title }) => {
  return (
    <li className="border-b border-gray-200 flex-shrink-0">
      <Link 
        href={`/issue_list/applied_info_morning_problem/${problemId}`} 
        className="block p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer w-full"
      >
        <div className="flex justify-between items-center">
          <span className="font-medium text-blue-600 hover:text-blue-800">
            {title} {/* DBから取得したタイトルをそのまま表示 */}
          </span>
        </div>
      </Link>
    </li>
  );
};

// メインのページコンポーネントを async 関数に変更
const AppliedInfoMorningProblemsListPage = async () => {

  // データベースから応用情報午前問題のリストを取得
  // (お手本の basic_Info_A_Question を Applied_am_Question に変更)
  const problems = await prisma.applied_am_Question.findMany({
    select: {
      id: true,
      title: true,
      // 必要に応じて sourceYear や sourceNumber も取得できます
      // sourceYear: true,
      // sourceNumber: true,
    },
    orderBy: [
      { id: 'asc' }, // IDで昇順に並び替え
    ]
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          応用情報 午前問題一覧
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          {problems.length > 0 ? (
            <ul>
              {/* データベースから取得した 'problems' 配列をマップする */}
              {problems.map((problem) => (
                <ProblemListRow
                  key={problem.id}
                  problemId={problem.id}
                  title={problem.title} // DBの `title` フィールドを直接使用
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