// /workspaces/my-next-app/src/app/(main)/issue_list/mine_issue_list/problems/page.tsx

import React from 'react';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

interface ProblemListRowProps {
  problemId: string;
  title: string;
  authorName: string | null;
}

const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, authorName }) => {
  return (
    <li className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center space-x-4">
        <Link 
          href={`/CreateProgrammingQuestion?id=${problemId}`}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200"
        >
          編集
        </Link>
        <Link href={`/issue_list/programming_problem/${problemId}`} className="block">
          <span className="font-medium text-blue-600 hover:text-blue-800">
            問{problemId}: {title}
          </span>
        </Link>
      </div>
      <span className="text-sm text-gray-500">
        作成者: {authorName}
      </span>
    </li>
  );
};


const MineProblemsListPage = async () => {
  const session = await getSession();
  const user = session.user;

  if (!user || !user.id) { // user.idの存在もチェック
    redirect('/auth/login');
  }

  // ★★★ 修正の核心: user.idを数値に変換します ★★★
  const userId = Number(user.id);

  // 念のため、変換後の値が有効かチェック
  if (isNaN(userId)) {
    console.error("セッションのユーザーIDが無効です:", user.id);
    // エラーページにリダイレクトするか、エラーメッセージを表示するなどの対応が考えられます
    return <p className="p-8 text-center text-red-500">ユーザー情報の読み込みに失敗しました。</p>;
  }

  const problems = await prisma.programmingProblem.findMany({
    where: {
      createdBy: userId, // ★ 数値に変換したIDを使用
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
          作成した問題
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
          {problems.length === 0 ? (
            <p className="p-8 text-center text-gray-500">作成した問題はまだありません。</p>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default MineProblemsListPage;
