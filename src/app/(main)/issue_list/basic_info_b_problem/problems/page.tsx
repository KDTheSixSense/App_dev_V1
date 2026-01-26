// /src/app/(main)/issue_list/basic_info_b_problem/page.tsx
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import AnimatedList, { AnimatedListItem } from '../../components/AnimatedList';
import BackButton from '../../components/BackButton';
import StatusFilter from './StatusFilter';

// ページコンポーネントを非同期関数に変更
/**
 * 基本情報技術者試験 科目B 問題一覧ページ (Server Component)
 * 
 * 指定された条件（履歴、カテゴリなど）に基づいてデータベースから問題を検索し、
 * アニメーションリストとして表示します。
 * ユーザーの解答履歴に基づき、当日解答済みかどうかのステータスも判定します。
 */
const BasicInfoBProblemsListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const session = await getAppSession();
  const userId = session.user?.id;

  // Promise.all で並列実行するためのPromise配列を準備
  const promises: Promise<any>[] = [
    // 1. 問題リスト (Questions)
    prisma.questions.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, title: true }
    }),
    // 2. 問題リスト (Algorithm)
    prisma.questions_Algorithm.findMany({
      where: { subject: { name: '基本情報B問題' } }, // 科目Bの問題に絞り込む
      orderBy: { id: 'asc' },
      select: { id: true, title: true, problemType: true }
    })
  ];

  // ログインしている場合のみ、解答履歴の取得Promiseを追加
  if (userId) {
    // 3. 基本情報A/Bなどの解答履歴
    promises.push(
      prisma.userAnswer.findMany({
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
      })
    );
    // 4. Algorithm専用テーブルの解答履歴
    promises.push(
      prisma.answer_Algorithm.findMany({
        where: {
          userId: userId,
          isCorrect: true,
        },
        select: {
          questionId: true,
          answeredAt: true,
        },
        orderBy: { answeredAt: 'desc' },
      })
    );
  }

  // Promise.all で一括実行
  const results = await Promise.all(promises);

  // 結果の分割代入
  const staticProblems = results[0] as { id: number; title: string }[];
  const algoProblems = results[1] as { id: number; title: string; problemType: string }[];

  // ユーザーIDがある場合のみ履歴データを取り出す
  const correctAnswers = userId ? (results[2] as any[]) : [];
  const algoAnswers = userId ? (results[3] as any[]) : [];

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

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

  // 取得した2つの配列を1つに結合します
  const allProblems = [
    ...staticProblems.map(p => ({ ...p, problemType: 'others' })),
    ...algoProblems
  ];

  // problemTypeでソートし、その中でID順に並び替えます
  allProblems.sort((a, b) => {
    if (a.problemType !== b.problemType) {
      // アルゴリズム(algorithm) -> 情報セキュリティ(information_security) -> その他(others) の順になります
      return a.problemType.localeCompare(b.problemType);
    }
    return a.id - b.id;
  });

  // フィルタリング処理
  const resolvedSearchParams = await searchParams;
  const statusParam = resolvedSearchParams?.status;
  const typeParam = resolvedSearchParams?.type;

  let filteredProblems = allProblems;

  if (typeParam === 'algorithm') {
    filteredProblems = filteredProblems.filter((p) => p.problemType === 'algorithm');
  } else if (typeParam === 'security') {
    filteredProblems = filteredProblems.filter((p) => p.problemType === 'security');
  }

  if (statusParam === 'today') {
    filteredProblems = filteredProblems.filter((p) => solvedStatusMap.get(p.id) === 'today');
  } else if (statusParam === 'past') {
    filteredProblems = filteredProblems.filter((p) => solvedStatusMap.get(p.id) === 'past');
  }

  // AnimatedList用にデータを変換
  const items: AnimatedListItem[] = filteredProblems.map((problem) => {
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

export default BasicInfoBProblemsListPage;