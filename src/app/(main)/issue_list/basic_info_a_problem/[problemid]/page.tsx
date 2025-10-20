// src/app/(main)/issue_list/basic_info_a_problem/[problemId]/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// --- データ取得とコンポーネント ---
import ProblemClient from './ProblemClient';

// --- 型定義 ---
import type { SerializableProblem } from '@/lib/data';

interface PageProps {
  params: { problemId: string };
}

/**
 * 基本情報技術者試験 科目A の問題詳細ページ (サーバーコンポーネント)
 */
const BasicInfoAProblemDetailPage = async ({ params }: PageProps) => {
  const { problemId } = params;
  const session = await getAppSession();

  // 1. データベースから問題を取得
  const dbProblem = await prisma.basc_Info_A_Question.findUnique({
    where: { id: Number(problemId) },
  });

  // 2. Not Found チェック
  if (
    !dbProblem ||
    !dbProblem.answerOptions ||
    !Array.isArray(dbProblem.answerOptions) ||
    dbProblem.answerOptions.length === 0
  ) {
    notFound();
  }

  // 3. --- データ変換ロジック (ここから変更) ---

  const answerOptionsTexts = dbProblem.answerOptions as string[];
  const correctAnswerIndex = dbProblem.correctAnswer;
  
  const prefixes_ja = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ'];
  const prefixes_en = ['A', 'B', 'C', 'D', 'E', 'F'];

  // 3a. Clientが期待する correctAnswer (string) を作成
  // (DBのインデックスから、対応する「本文」を取得)
  const correctAnswerValue = answerOptionsTexts[correctAnswerIndex] ?? '';

  // 3b. string[] を AnswerOption[] に変換 (ja)
  const mappedAnswerOptions_ja = answerOptionsTexts.map((optionText: string, index: number) => {
    return {
      label: prefixes_ja[index] || String(index), // 例: 'イ'
      value: optionText,                          // 例: '情報が破壊...' (リクエスト通り)
      text: optionText                            // 例: '情報が破壊...' (textプロパティを満たすため)
    };
  });

  // 3c. AnswerOption[] に変換 (en)
  const mappedAnswerOptions_en = answerOptionsTexts.map((optionText: string, index: number) => {
    return {
      label: prefixes_en[index] || String(index), // 例: 'B'
      value: optionText,                          // (Same text)
      text: optionText                            // (Same text)
    };
  });
  
  // 4. SerializableProblem の形式に変換
  const problem: SerializableProblem = {
    id: String(dbProblem.id),
    title: { ja: dbProblem.title, en: dbProblem.title },
    description: { ja: dbProblem.description, en: dbProblem.description },
    programLines: { ja: [], en: [] }, 
    answerOptions: { 
      ja: mappedAnswerOptions_ja,
      en: mappedAnswerOptions_en
    },
    correctAnswer: correctAnswerValue, // 正しい解答の「本文」
    explanationText: { ja: dbProblem.explanation, en: dbProblem.explanation },
    sourceYear: dbProblem.sourceYear ?? undefined,
    sourceNumber: dbProblem.sourceNumber ?? undefined,

    // --- 必須プロパティ(initialVariables, logicType) のエラーを解消 ---
    initialVariables: {}, 
    logicType: 'BASIC_A_QUIZ'
  };
  
  // 5. ログインしているユーザーの現在のクレジット数を取得
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
      initialProblem={problem}
      initialCredits={userCredits}
    />
  );
};

export default BasicInfoAProblemDetailPage;