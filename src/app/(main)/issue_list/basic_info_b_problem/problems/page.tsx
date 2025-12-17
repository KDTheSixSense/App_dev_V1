// /src/app/(main)/issue_list/basic_info_b_problem/page.tsx
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import AnimatedList, { AnimatedListItem } from '../../components/AnimatedList';
import BackButton from '../../components/BackButton';

// ページコンポーネントを非同期関数に変更
const BasicInfoBProblemsListPage = async () => {
  const session = await getAppSession();
  const userId = session.user?.id;

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // `questions_id` または `questions_algorithm_id` を使って正解履歴を取得
    const correctAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: userId,
        isCorrect: true,
        OR: [
          { questions_id: { not: null } },
          { questions_algorithm_id: { not: null } }
        ]
      },
      select: {
        questions_id: true,
        questions_algorithm_id: true,
        answeredAt: true,
      },
      orderBy: { answeredAt: 'desc' },
    });

    // Answer_Algorithm テーブルからも正解履歴を取得
    const algoAnswers = await prisma.answer_Algorithm.findMany({
      where: {
        userId: userId,
        isCorrect: true,
      },
      select: {
        questionId: true,
        answeredAt: true,
      },
      orderBy: { answeredAt: 'desc' },
    });

    // UserAnswer からの履歴をマップに追加
    for (const answer of correctAnswers) {
      const problemId = answer.questions_id || answer.questions_algorithm_id; // どちらかのIDを使用
      if (problemId === null || solvedStatusMap.has(problemId)) {
        continue;
      }
      const answeredDate = answer.answeredAt;
      const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
      solvedStatusMap.set(problemId, status);
    }

    // Answer_Algorithm からの履歴をマップに追加
    for (const answer of algoAnswers) {
      const problemId = answer.questionId;
      if (solvedStatusMap.has(problemId)) {
        continue;
      }
      const answeredDate = answer.answeredAt;
      const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
      solvedStatusMap.set(problemId, status);
    }
  }

  // 1. 両方のテーブルからデータを同時に取得します
  const [staticProblems, algoProblems] = await Promise.all([
    prisma.questions.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, title: true }
    }),
    prisma.questions_Algorithm.findMany({
      where: { subject: { name: '基本情報B問題' } }, // 科目Bの問題に絞り込む
      orderBy: { id: 'asc' },
      select: { id: true, title: true }
    })
  ]);

  // 2. 取得した2つの配列を1つに結合します
  const allProblems = [...staticProblems, ...algoProblems];

  // 3. ID順に並び替えます
  allProblems.sort((a, b) => a.id - b.id);

  // AnimatedList用にデータを変換
  const items: AnimatedListItem[] = allProblems.map((problem) => {
    return {
      id: problem.id,
      title: `問${problem.id}: ${problem.title}`, // タイトルに問題番号を含める
      href: `/issue_list/basic_info_b_problem/${problem.id}`,
      solvedStatus: solvedStatusMap.get(problem.id) || 'none',
    };
  });

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="mb-4 max-w-6xl mx-auto">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          基本情報技術者試験 科目B 問題一覧
        </h1>

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

export default BasicInfoBProblemsListPage;