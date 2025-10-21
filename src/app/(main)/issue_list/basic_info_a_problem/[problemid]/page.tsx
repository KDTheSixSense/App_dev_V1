// src/app/(main)/issue_list/basic_info_a_problem/[problemId]/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBasicInfoAProblem } from '@/lib/data';
import ProblemClient from './ProblemClient';
import type { SerializableProblem } from '@/lib/data';

interface PageProps {
  params: { problemid: string }; // lowercase matches folder
}

const BasicInfoAProblemDetailPage = async ({ params: asyncParams }: PageProps) => {
  // Await the params object itself
  const params = await asyncParams;

  const problemIdNum = parseInt(params.problemid, 10); // Use lowercase

  if (isNaN(problemIdNum)) {
    console.log(`[Page] Invalid problem ID received: ${params.problemid}. Calling notFound().`);
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