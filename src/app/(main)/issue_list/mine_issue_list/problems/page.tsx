// ★ ファイルパスのコメントを修正
// /workspaces/my-next-app/src/app/(main)/issue_list/mine_issue_list/problems/page.tsx

import React from 'react';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session'; // ★ セッション取得関数をインポート
import { redirect } from 'next/navigation';   // ★ redirect関数をインポート

const prisma = new PrismaClient();

interface ProblemListRowProps {
  problemId: string;
  title: string;
  authorName: string | null;
}

// ProblemListRowコンポーネントは変更なしでOK
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, authorName }) => {
  return (
    <Link href={`/issue_list/programming_problem/${problemId}`} className="block w-full">
      <li className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-blue-600 hover:text-blue-800">
          問{problemId}: {title}
        </span>
        <span className="text-sm text-gray-500">
          作成者: {authorName}
        </span>
      </li>
    </Link>
  );
};

// ★ pageコンポーネントを修正
const MineProblemsListPage = async () => {
  // ★ 1. セッションからユーザー情報を取得
  const session = await getSession();
  const user = session.user;

  // ★ 2. ユーザーがログインしていない場合はログインページへリダイレクト
  if (!user) {
    // ログインページのパスはご自身のアプリケーションに合わせて変更してください
    redirect('/login');
  }

  // ★ 3. ログインユーザーが作成した問題のみを取得 (公開・非公開を問わない)
  const problems = await prisma.programmingProblem.findMany({
    where: {
      createdBy: parseInt(String(user.id), 10),
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
          {/* ★ 4. 問題が0件の場合の表示を追加 */}
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