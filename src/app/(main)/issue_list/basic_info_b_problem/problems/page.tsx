// /src/app/(main)/issue_list/basic_info_b_problem/page.tsx
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // Prisma Clientをインポート

// 問題リスト行のProps型定義
interface ProblemListRowProps {
  problemId: string;
  title: string;
}

const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title }) => {
  // 基本情報 科目B 問題の詳細ページへのリンクを生成
  return (
    <Link href={`/issue_list/basic_info_b_problem/${problemId}`} className="block w-full">
      <li className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-blue-600 hover:text-blue-800">
          問{problemId}: {title}
        </span>
      </li>
    </Link>
  );
};

// ページコンポーネントを非同期関数に変更
const BasicInfoBProblemsListPage = async () => {
  // データベースから問題一覧を取得
  const problems = await prisma.questions.findMany({
    // 必要に応じてカテゴリなどで絞り込む
    // ここでは、科目Bに関連する問題を想定して絞り込みます。
    // 例: genre_id や difficultyid で絞り込む
    where: {
      // 仮のジャンルID。実際の科目BのジャンルIDに合わせてください。
      // genre_id: 1, 
    },
    orderBy: {
      id: 'asc',
    },
    select: {
      id: true,
      title: true, // Questionsモデルにはtitleフィールドがあります
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          基本情報技術者試験 科目B 問題一覧
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          <ul>
            {problems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                problemId={problem.id.toString()}
                title={problem.title} // titleフィールドを使用
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoBProblemsListPage;