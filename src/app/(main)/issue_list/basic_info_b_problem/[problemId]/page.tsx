import React from 'react';
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
  const problemId = parseInt(params.problemId, 10);
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
    <ProblemClient
      initialProblem={problem}
      // 取得したユーザー情報をPropsとして渡す
      initialCredits={userCredits}
    />
  );
};

export default BasicInfoBProblemDetailPage;

