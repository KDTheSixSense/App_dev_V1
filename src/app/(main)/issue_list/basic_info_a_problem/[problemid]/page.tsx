import { notFound } from 'next/navigation';
//import { getIronSession } from 'iron-session';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// --- データ取得とコンポーネント ---
// `basic_info_a_problem` は静的データなので、DBではなくファイルから取得します。
import { basicInfoAProblems } from '@/lib/issue_list/basic_info_a_problem/problem';
import ProblemClient from './ProblemClient'; // 新しく作成したクライアントコンポーネント
import type { SerializableProblem } from '@/lib/data';

interface PageProps {
  params: Promise<{ problemId: string }>;
}
/**
 * 基本情報技術者試験 科目A の問題詳細ページ (サーバーコンポーネント)
 */
const BasicInfoAProblemDetailPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;
  const problemId = resolvedParams.problemId;
  
  // ユーザーセッションと問題データを並行して取得
const session = await getAppSession();
  const problem = basicInfoAProblems.find(p => p.id === problemId);
  
  if (!problem) {
    notFound();
  }
  
  // answerOptionsが存在しない場合もnotFoundを呼び出す
  if (!problem.answerOptions) {
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
  let userCredits = 0; // デフォルトは0回
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
      initialProblem={problemForClient}
      initialCredits={userCredits}
    />
  );
};

export default BasicInfoAProblemDetailPage;
