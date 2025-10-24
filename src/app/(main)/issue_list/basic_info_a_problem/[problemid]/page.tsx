import React from 'react';
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// --- データ取得とコンポーネント ---
import { basicInfoAProblems } from '@/lib/issue_list/basic_info_a_problem/problem';
import ProblemClient from './ProblemClient';

// --- 型定義 ---
import type { SerializableProblem } from '@/lib/data';

interface PageProps {
  params: Promise<{ problemId: string }>;
}

/**
 * 基本情報技術者試験 科目A の問題詳細ページ (サーバーコンポーネント)
 */
const BasicInfoAProblemDetailPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;
  const { problemId } = await (resolvedParams as unknown as Promise<{ problemId: string }>);  
  const session = await getAppSession();
  const problem = basicInfoAProblems.find(p => p.id === problemId);
  
  // 問題が見つからない、またはanswerOptionsが存在しない場合は404ページを表示
  if (!problem || !problem.answerOptions) {
    notFound();
  }
  

  const problemForClient: SerializableProblem = {
    ...problem,
    answerOptions: problem.answerOptions,
    programLines: problem.programLines || { ja: [], en: [] },
    explanationText: problem.explanationText || { ja: '', en: '' },
    initialVariables: problem.initialVariables || {},
  };
  
  // ログインしているユーザーの現在のクレジット数を取得
  let userCredits = 0;
  if (session?.user) {
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
      initialProblem={problem as SerializableProblem}
      initialCredits={userCredits}
    />
  );
};

export default BasicInfoAProblemDetailPage;

