//workspaces/my-next-app/src/app/(main)/select-page/[assignments]/page.tsx

import React from 'react';
import { prisma } from '@/lib/prisma';
import ProblemDetailClient from './ProblemDetailClient'; // これから作成するファイル
import { notFound } from 'next/navigation';

type ProblemDetailPageProps = {
  params: Promise<{ problemId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// ページ自体をサーバー側でデータを取得する非同期関数に変更
export default async function ProblemDetailPage({ params, searchParams }: ProblemDetailPageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.problemId, 10);
  const resolvedSearchParams = searchParams ? await searchParams : undefined; // searchParams を await する

  
  // IDが無効な場合は404ページを表示
  if (isNaN(id)) {
    notFound();
  }

  // サーバーで直接データベースから問題を取得
  const problem = await prisma.selectProblem.findUnique({
    where: { id },
  });

  // 問題が見つからない場合は404ページを表示
  if (!problem) {
    notFound();
  }

  const plainProblem = JSON.parse(JSON.stringify(problem));

  // 取得したデータをクライアントコンポーネントに渡して表示
  return <ProblemDetailClient problem={plainProblem} />;
}