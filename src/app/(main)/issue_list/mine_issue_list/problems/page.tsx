'use client';

import React from 'react';
import Link from 'next/link';
import { 
  deleteProblemAction, 
  getMineProblems, 
  deleteSelectProblemAction,
  getMineSelectProblems
} from '@/lib/actions';
import { ProgrammingProblem, SelectProblem, User } from '@prisma/client';

// --- 型定義 ---
type ProgrammingProblemWithCreator = ProgrammingProblem & {
  creator: { username: string | null } | null;
};
type SelectProblemWithCreator = SelectProblem & {
  creator: { username: string | null } | null;
};

// --- コンポーネント定義 ---

const ProgrammingProblemListRow: React.FC<{ problem: ProgrammingProblemWithCreator }> = ({ problem }) => {
  return (
    <li className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center space-x-4 flex-grow">
        <div className="flex items-center space-x-2">
          <Link href={`/CreateProgrammingQuestion?id=${problem.id}`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200">
            編集
          </Link>
          <form action={deleteProblemAction}>
            <input type="hidden" name="problemId" value={problem.id} />
            <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200" onClick={(e) => { if (!confirm('本当にこの問題を削除しますか？')) { e.preventDefault(); }}}>
              削除
            </button>
          </form>
        </div>
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

const SelectProblemListRow: React.FC<{ problem: SelectProblemWithCreator }> = ({ problem }) => {
  return (
    <li className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center space-x-4 flex-grow">
        <div className="flex items-center space-x-2">
          <Link href={`/group/cmfd7zu390000sfnudcy6b4ld/assignments/create-programming?id=${problem.id}&type=select`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200">
            編集
          </Link>
          <form action={deleteSelectProblemAction}>
            <input type="hidden" name="problemId" value={problem.id} />
            <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200" onClick={(e) => { if (!confirm('本当にこの問題を削除しますか？')) { e.preventDefault(); }}}>
              削除
            </button>
          </form>
        </div>
        <Link href={`/issue_list/selects_problems/${problem.id}`} className="block">
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
  const [programmingProblems, setProgrammingProblems] = React.useState<ProgrammingProblemWithCreator[]>([]);
  const [selectProblems, setSelectProblems] = React.useState<SelectProblemWithCreator[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProblems = async () => {
      try {
        const [progResult, selectResult] = await Promise.all([
          getMineProblems(),
          getMineSelectProblems()
        ]);

        if (progResult.error || selectResult.error) {
          setError(progResult.error || selectResult.error || '不明なエラーが発生しました。');
        } else {
          if (progResult.data) setProgrammingProblems(progResult.data);
          if (selectResult.data) setSelectProblems(selectResult.data);
        }

      } catch (e) {
        setError('データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblems();
  }, []);

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
          作成した問題一覧
        </h1>
        
        <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-12 lg:space-y-0">

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              プログラミング問題
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {programmingProblems.length === 0 ? (
                <p className="p-8 text-center text-gray-500">作成したプログラミング問題はまだありません。</p>
              ) : (
                <ul>
                  {programmingProblems.map((problem) => (
                    <ProgrammingProblemListRow key={problem.id} problem={problem} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              選択問題
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {selectProblems.length === 0 ? (
                <p className="p-8 text-center text-gray-500">作成した選択問題はまだありません。</p>
              ) : (
                <ul>
                  {selectProblems.map((problem) => (
                    <SelectProblemListRow key={problem.id} problem={problem} />
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MineProblemsListPage;