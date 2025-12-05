import React from 'react';
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// --- データ取得とコンポーネント ---
import { getProblemForClient } from '@/lib/data';
import ProblemClient from './ProblemClient'; // 同じ階層のクライアントコンポーネントをインポート

interface PageProps {
  params: any;
}

/**
 * 基本情報技術者試験 科目B の問題詳細ページ (サーバーコンポーネント)
 * ユーザーのクレジット数を取得し、クライアントに渡します
 */
const BasicInfoBProblemDetailPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;
  const problemId = parseInt(resolvedParams.problemId, 10);
  if (isNaN(problemId)) {
    notFound();
  }

  // ユーザーセッションと問題データを並行して取得
  const session = await getAppSession();
  const problem = await getProblemForClient(problemId);

  if (!problem) {
    notFound();
  }

  // ログインしているユーザーの現在のクレジット数を取得
  let userCredits = 0; // デフォルトは0回
  if (session.user) {
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { aiAdviceCredits: true }
    });
    if (user) {
      userCredits = user.aiAdviceCredits;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full px-4 pt-4">
        <div className="mb-4">
          <Link href="/issue_list/basic_info_b_problem/problems" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </Link>
        </div>
        <ProblemClient initialProblem={problem} initialCredits={userCredits} />
      </div>
    </div>
  );
};

export default BasicInfoBProblemDetailPage;

