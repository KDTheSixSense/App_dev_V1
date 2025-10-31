// src/app/(main)/issue_list/basic_info_a_problem/[problemid]/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBasicInfoAProblem } from '@/lib/data';
import ProblemClient from './ProblemClient';
import type { SerializableProblem } from '@/lib/data';

// --- 修正点 1: 型定義を修正 ---
// params は Promise ではなく、プロパティ名はファイル名に合わせて 'problemid' (小文字) にします。
type BasicInfoAProblemDetailPageProps = {
  params: { problemid: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

// --- 修正点 2: props の型から Promise を削除 ---
const BasicInfoAProblemDetailPage = async ({ params, searchParams }: BasicInfoAProblemDetailPageProps) => {
  
  // --- 修正点 3: 'await params' を削除し、'params.problemid' (小文字) から直接IDを取得 ---
  const problemIdStr = params.problemid;
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
        where: { id: Number(session.user.id) },
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
    <ProblemClient
      initialProblem={problem} // problem is guaranteed not null here
      initialCredits={userCredits}
    />
  );
};

export default BasicInfoAProblemDetailPage;