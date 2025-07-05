// 'use client' は削除する

import React from 'react';
import { notFound } from 'next/navigation';
// クライアントコンポーネントをインポート
import ProblemClient from './ProblemClient';
// サーバーサイドでデータを取得する関数をインポート
import { getProblemForClient } from '@/lib/data'; // 仮のパス。実際のパスに修正してください。

// --- Propsの型定義 ---
interface PageProps {
  params: {
    problemId: string;
  };
}

/**
 * 問題ページのサーバーコンポーネント。
 * データ取得と、クライアントコンポーネントへのデータ受け渡しを担当します。
 */
const BasicInfoBProblemPage = async ({ params }: PageProps) => {
  const problemId = parseInt(params.problemId, 10);

  if (isNaN(problemId)) {
    notFound();
  }

  const problem = await getProblemForClient(problemId);
  
  // ✅ 【修正点】 このようにロジックの構造を変更します

  // データが正常に取得できた場合のみ、クライアントコンポーネントをレンダリングする
  if (problem) {
    // このifブロックの中では、problemがnullでないことが保証されます
    return <ProblemClient initialProblem={problem} />;
  }
  
  // データが取得できなかった (problemがnullだった) 場合は、
  // notFound() を呼び出して404ページを表示する
  // notFound() は例外を投げるため、この後に関数が続くことはありません。
  notFound();
};

export default BasicInfoBProblemPage;
