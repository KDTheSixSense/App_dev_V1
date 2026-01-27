import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // データベース接続用のPrisma Clientをインポート
import { getAppSession } from '@/lib/auth';
import { ArrowLeft } from 'lucide-react';
import { detectThreatType } from '@/lib/waf';
import AnimatedList, { AnimatedListItem } from '../components/AnimatedList';
import BackButton from '../components/BackButton';
import StatusFilter from './StatusFilter';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SelectProblemsListPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  // Security Check: WAF
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      let threat = detectThreatType(key);
      if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);

      if (typeof value === 'string') {
        threat = detectThreatType(value);
        if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          threat = detectThreatType(item);
          if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);
        }
      }
    }
  }

  const session = await getAppSession();
  const userId = session.user?.id;

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // `selectProblem_id` を使って正解履歴を取得
    const correctAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: userId,
        isCorrect: true,
        selectProblem_id: { not: null },
      },
      select: {
        selectProblem_id: true,
        answeredAt: true,
      },
      orderBy: { answeredAt: 'desc' },
    });

    for (const answer of correctAnswers) {
      const problemId = answer.selectProblem_id;
      if (problemId === null || solvedStatusMap.has(problemId)) {
        continue;
      }
      const answeredDate = answer.answeredAt;
      const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
      solvedStatusMap.set(problemId, status);
    }
  }

  // サーバーサイドでデータベースから問題リストを取得します
  const problems = await prisma.selectProblem.findMany({
    where: {
      OR: [
        { isPublic: true },
        { createdBy: null }, // システム作成問題（シードデータ）を表示
      ]
    },
    orderBy: {
      id: 'asc', // IDの昇順で並べます
    },
    select: {
      id: true,
      title: true,
    }
  });

  // フィルタリング処理
  const statusParam = searchParams?.status;
  let filteredProblems = problems;
  if (statusParam === 'today') {
    filteredProblems = problems.filter((p) => solvedStatusMap.get(p.id) === 'today');
  } else if (statusParam === 'past') {
    filteredProblems = problems.filter((p) => solvedStatusMap.get(p.id) === 'past');
  }

  // AnimatedList用にデータを変換
  const items: AnimatedListItem[] = filteredProblems.map((problem) => {
    return {
      id: problem.id,
      title: `問${problem.id}: ${problem.title}`,
      href: `/issue_list/selects_problems/${problem.id}`,
      solvedStatus: solvedStatusMap.get(problem.id) || 'none',
    };
  });

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="mb-4 max-w-6xl mx-auto">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">選択問題一覧</h1>

        <StatusFilter />

        {/* 新しいAnimatedListコンポーネントを使用 */}
        <AnimatedList
          items={items}
          showGradients={true}
          displayScrollbar={true}
        />
      </div>
    </div>
  );
};

export default SelectProblemsListPage;