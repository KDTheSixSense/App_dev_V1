// /workspaces/my-next-app/src/app/(main)/issue_list/applied_info_morning_problem/[problemId]/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAppliedInfoAmProblem } from '@/lib/data'; 
import ProblemClient from './ProblemClient';
import type { SerializableProblem } from '@/lib/data';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// 型定義を 'basic_info_a_problem' と同様に修正
type AppliedInfoProblemDetailPageProps = {
  params: { problemId: string }; // 'Promise' を削除
  searchParams?: { [key: string]: string | string[] | undefined };
};

// 'async' 関数に変更
const AppliedInfoProblemDetailPage = async ({ params, searchParams }: any) => {
  // 'await params' を削除
  const problemIdStr = params.problemId;
  const problemIdNum = parseInt(problemIdStr, 10);

  if (isNaN(problemIdNum)) {
    console.log(`[Page] Invalid problem ID received from params: ${problemIdStr}. Calling notFound().`);
    notFound();
  }

  const session = await getAppSession(); 

  console.log(`[Page] Fetching applied AM problem for ID: ${problemIdNum}`);
  // 修正: データベースから取得する関数に変更
  const problem = await getAppliedInfoAmProblem(problemIdNum);
  console.log(`[Page] Fetched problem data:`, problem ? `Title: ${problem.title.ja}` : 'null or undefined');

  if (!problem) {
    console.log(`[Page] Problem not found for ID: ${problemIdNum}. Calling notFound().`);
    notFound();
  }

  // ユーザーのクレジット情報を取得（変更なし）
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

  // problem は 'SerializableProblem' 型になっているため、変換は不要
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        <div className="mb-4">
          <Link href="/issue_list/applied_info_morning_problem/problems" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </Link>
        </div>
        <ProblemClient
          initialProblem={problem} 
          initialCredits={userCredits}
        />
      </div>
    </div>
  );
};

export default AppliedInfoProblemDetailPage;