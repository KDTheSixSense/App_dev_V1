"use client";

import React from 'react';
import Link from 'next/link';

// 実際のファイルパス: src/lib/issue_list/basic_info_a_problem/problem.ts
// tsconfig.json の "@/": ["./src/*"] を使うと、
// '@/lib/issue_list/basic_info_a_problem/problem' と記述します。
import { basicInfoAProblems } from '@/lib/issue_list/basic_info_a_problem/problem';

// 問題データの型定義もインポートしておくと良いでしょう
// 必要であれば、problem.ts から Problem 型をエクスポートしてインポートします
// import type { Problem } from '@/lib/issue_list/basic_info_a_problem/problem';


interface ProblemListRowProps {
  problemId: string;
  title: string;
}

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

const ProblemsListPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">プログラミング選択問題一覧</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          <ul>
            {/* basicInfoAProblems を map します */}
            {basicInfoAProblems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                problemId={problem.id}
                title={problem.title.ja} // 日本語タイトルを表示
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProblemsListPage;