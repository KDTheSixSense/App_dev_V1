// src/app/(main)/issue_list/basic_info_a_problem/[problemid]/page.tsx

import React from 'react'; // Reactのインポートを追加
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBasicInfoAProblem } from '@/lib/data';
import ProblemClient from './ProblemClient';
import type { SerializableProblem } from '@/lib/data';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react'; // lucide-reactのインポートを追加

// --- 修正点 1: 型定義を修正 ---
// params は Promise ではなく、プロパティ名はファイル名に合わせて 'problemid' (小文字) にします。
type BasicInfoAProblemDetailPageProps = {
  params: { problemId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

// --- 修正点 2: props の型から Promise を削除 ---
const BasicInfoAProblemDetailPage = async ({ params, searchParams }: any) => {

  // --- 修正点 3: 'await params' を使用してパラメータを取得 ---
  const resolvedParams = await params;
  const problemIdStr = resolvedParams.problemId;
  const problemIdNum = parseInt(problemIdStr, 10);
  // const resolvedSearchParams = searchParams; // searchParams も await は不要です

  if (isNaN(problemIdNum)) {
    // --- 修正点 4: ログで正しい変数を参照 ---
    console.log(`[Page] Invalid problem ID received from params: ${problemIdStr}. Calling notFound().`);
    notFound();
  }

  const session = await getAppSession(); // Use getAppSession here

  console.log(`[Page] Fetching problem for ID: ${problemIdNum}`);
  const problem = await getBasicInfoAProblem(problemIdNum);
  console.log(`[Page] Fetched problem data:`, problem ? `Title: ${problem.title.ja}` : 'null or undefined');

  if (!problem) {
    console.log(`[Page] Problem not found for ID: ${problemIdNum}. Calling notFound().`);
    notFound();
  }

  let userCredits = 0;
  if (session?.user?.id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { aiAdviceCredits: true }
      });
      if (user) {
        userCredits = user.aiAdviceCredits;
      }
    } catch (error) {
      console.error("[Page] Error fetching user credits:", error);
    }
  } else {
    console.log("[Page] No user session found, credits will be 0.");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        <div className="mb-4">
          <Link href="/issue_list/basic_info_a_problem/problems" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </Link>
        </div>
        <ProblemClient
          initialProblem={problem} // problem is guaranteed not null here
          initialCredits={userCredits}
        />
      </div>
    </div>
  );
};

export default BasicInfoAProblemDetailPage;