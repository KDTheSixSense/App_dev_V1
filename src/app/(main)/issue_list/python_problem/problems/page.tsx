// src/app/(main)/issue_list/python_problem/problems/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';

// Pythonの問題データをインポート
// tsconfig.json の "@/": ["./src/*"] を使用している場合、
// '@/lib/issue_list/python_problem/problem' と記述します。
import { PythonProblems } from '@/lib/issue_list/python_problem/problem';

// 問題リスト行のProps型定義
interface ProblemListRowProps {
  problemId: string;
  title: string;
  // このページはPython問題専用なので、categoryを直接渡しても良いですが、
  // 他の場所からの再利用性を考慮し、Propsとして持たせることもできます。
  // 今回はPython問題専用なので、固定値として扱います。
}

const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title }) => {
  // Python問題の詳細ページへのリンクを生成
  // パスは /issue_list/python_problem/[problemId] となるように修正
  return (
    <Link href={`/issue_list/python_problem/${problemId}`} className="block w-full">
      <li className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-blue-600 hover:text-blue-800">
          問{problemId}: {title}
        </span>
      </li>
    </Link>
  );
};

const PythonProblemsListPage: React.FC = () => { // コンポーネント名をPython向けに修正
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Pythonコーディング問題一覧 {/* ページタイトルをPython向けに修正 */}
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          <ul>
            {/* PythonProblems 配列をマップして各問題を表示 */}
            {PythonProblems.map((problem) => (
              <ProblemListRow
                key={problem.id} // 各リストアイテムの一意のキー
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

export default PythonProblemsListPage; // エクスポート名もPython向けに修正
