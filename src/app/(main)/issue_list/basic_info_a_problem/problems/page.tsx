import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // データベース接続(Prisma)をインポート
import { getAppSession } from '@/lib/auth';
import AnimatedList, { AnimatedListItem } from '../../components/AnimatedList';
import BackButton from '../../components/BackButton';

// メインページコンポーネント (Server Component)
const ProblemsListPage = async () => {
  const session = await getAppSession();
  const userId = session.user?.id;

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId) {
    // 今日の日付の開始と終了を取得
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const correctAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: userId,
        isCorrect: true,
        // 基本情報A問題の解答のみに絞り込む
        basic_A_Info_Question_id: {
          not: null,
        },
      },
      select: {
        basic_A_Info_Question_id: true,
        answeredAt: true,
      },
      orderBy: {
        answeredAt: 'desc', // 新しい解答から処理する
      },
    });

    for (const answer of correctAnswers) {
      const problemId = answer.basic_A_Info_Question_id;
      if (problemId === null || solvedStatusMap.has(problemId)) {
        continue; // IDがないか、既に新しい解答でステータスが設定済みの場合はスキップ
      }

      const answeredDate = answer.answeredAt;
      const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
      solvedStatusMap.set(problemId, status);
    }
  }
  // データベースから基本情報A問題のリストを取得
  const problems = await prisma.basic_Info_A_Question.findMany({
    select: {
      id: true,
      title: true,
      sourceYear: true,
      sourceNumber: true,
    },
    orderBy: [
      { id: 'asc' },          // ID順にソート（必要に応じて変更）
    ]
  });

  // AnimatedList用にデータを変換
  const items: AnimatedListItem[] = problems.map((problem) => {
    return {
      id: problem.id,
      title: problem.title, // タイトルのみを表示
      href: `/issue_list/basic_info_a_problem/${problem.id}`,
      solvedStatus: solvedStatusMap.get(problem.id) || 'none', // statusを直接渡す
    };
  });

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        
        <div className="mb-4 max-w-6xl mx-auto">
          <BackButton />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          基本情報A問題 問題一覧
        </h1>
        
        {/* 新しいAnimatedListコンポーネントを使用 */}
        <AnimatedList 
          items={items} 
          showGradients={true}
          displayScrollbar={true}
          className="h-[600px]"
        />
      </div>
    </div>
  );
};

export default ProblemsListPage;
