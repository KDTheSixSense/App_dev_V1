import React from 'react';
import { prisma } from '@/lib/prisma';
import ProblemDetailClient from './ProblemDetailClient'; // これから作成するファイル
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// ページに渡されるパラメータの型
interface PageProps {
  params: any;
}

// ページ自体をサーバー側でデータを取得する非同期関数に変更
export default async function ProblemDetailPage({ params }: PageProps) {
  const id = parseInt(params.problemId, 10);

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
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        <div className="mb-4">
          <Link href="/issue_list/selects_problems" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </Link>
        </div>
        <ProblemDetailClient problem={plainProblem} />
      </div>
    </div>
  );
}