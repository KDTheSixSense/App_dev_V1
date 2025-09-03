// /workspaces/my-next-app/src/app/(main)/issue_list/mine_issue_list/problems/page.tsx

// 'use client' はファイルの先頭に書く必要があります。
// これにより、このファイル内のコンポーネントがクライアントコンポーネントとして扱われます。
'use client';

import React from 'react';
import Link from 'next/link';
// ★ 1. サーバーアクションと、データを取得するための新しい関数をインポート
import { deleteProblemAction, getMineProblems } from '@/lib/actions';
import { ProgrammingProblem, User } from '@prisma/client'; // Prismaの型をインポート

//
// ▼▼▼ ここからが「クライアントコンポーネント」部分です ▼▼▼
//

// サーバーから取得する問題の型を拡張
type ProblemWithCreator = ProgrammingProblem & {
  creator: { username: string | null } | null;
};

// 編集と削除ボタンを含む行コンポーネント
const ProblemListRow: React.FC<{ problem: ProblemWithCreator }> = ({ problem }) => {
  return (
    <li className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center space-x-4 flex-grow">
        {/* ★ 2. 編集ボタンと削除ボタンをグループ化 */}
        <div className="flex items-center space-x-2">
          <Link
            href={`/CreateProgrammingQuestion?id=${problem.id}`}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200"
          >
            編集
          </Link>

          {/* 削除ボタンを持つフォーム */}
          <form action={deleteProblemAction}>
            <input type="hidden" name="problemId" value={problem.id} />
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200"
              onClick={(e) => {
                if (!confirm('本当にこの問題を削除しますか？関連するテストケースもすべて削除されます。')) {
                  e.preventDefault();
                }
              }}
            >
              削除
            </button>
          </form>
        </div>

        {/* 問題タイトル */}
        <Link href={`/issue_list/programming_problem/${problem.id}`} className="block">
          <span className="font-medium text-blue-600 hover:text-blue-800">
            問{problem.id}: {problem.title}
          </span>
        </Link>
      </div>

      <span className="text-sm text-gray-500 flex-shrink-0">
        作成者: {problem.creator?.username ?? '不明'}
      </span>
    </li>
  );
};


// ページ全体のメインコンポーネント
const MineProblemsListPage = () => {
  // ★ 3. useEffectを使ってクライアントサイドでデータを取得
  const [problems, setProblems] = React.useState<ProblemWithCreator[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProblems = async () => {
      try {
        // サーバーアクション経由でデータを取得
        const result = await getMineProblems();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setProblems(result.data);
        }
      } catch (e) {
        setError('データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // ★ 4. ローディングとエラー状態のUIを追加
  if (isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

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
                <ProblemListRow key={problem.id} problem={problem} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MineProblemsListPage;