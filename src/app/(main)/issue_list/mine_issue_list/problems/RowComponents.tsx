'use client';

import React from 'react';
import Link from 'next/link';
import { deleteProblemAction, deleteSelectProblemAction } from '@/lib/actions';
import { ProgrammingProblem, SelectProblem } from '@prisma/client';

// --- 型定義 ---
export type ProgrammingProblemWithCreator = ProgrammingProblem & {
  creator: { username: string | null } | null;
};
export type SelectProblemWithCreator = SelectProblem & {
  creator: { username: string | null } | null;
};

export const ProgrammingProblemListRow: React.FC<{ problem: ProgrammingProblemWithCreator }> = ({ problem }) => {
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
        作成者: {problem.creator?.username ?? '不明'} / {problem.difficulty}
      </span>
    </li>
  );
};

export const SelectProblemListRow: React.FC<{ problem: SelectProblemWithCreator }> = ({ problem }) => {
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
        作成者: {problem.creator?.username ?? '不明'} / {problem.difficultyId}
      </span>
    </li>
  );
};
