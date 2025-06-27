// src/app/(main)/issue_list/JavaScript_problem/problems/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';

// JavaScriptの問題データをインポート
// tsconfig.json の "@/": ["./src/*"] を使用している場合、
// '@/lib/issue_list/JavaScript_problem/problem' と記述します。
import { JavaScriptProblems } from '@/lib/issue_list/JavaScript_problem/problem';

// 問題リスト行のProps型定義
interface ProblemListRowProps {
  problemId: string;
  title: string;
  // このページはJavaScript問題専用なので、categoryをPropsとして渡す必要は通常ありません。
  // 必要であれば追加することも可能です。
}

const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title }) => {
  // JavaScript問題の詳細ページへのリンクを生成
  // パスは /issue_list/JavaScript_problem/[problemId] となるように修正
  return (
    <Link href={`/issue_list/JavaScript_problem/${problemId}`} className="block w-full">
      <li className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-blue-600 hover:text-blue-800">
          問{problemId}: {title}
        </span>
      </li>
    </Link>
  );
};

const JavaScriptProblemsListPage: React.FC = () => { // コンポーネント名をJavaScript向けに修正
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          JavaScriptコーディング問題一覧 {/* ページタイトルをJavaScript向けに修正 */}
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          <ul>
            {/* JavaScriptProblems 配列をマップして各問題を表示 */}
            {JavaScriptProblems.map((problem) => (
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

export default JavaScriptProblemsListPage; // エクスポート名もJavaScript向けに修正
