// /workspaces/my-next-app/src/app/(main)/group/coding-page/[problemId]/page.tsx

import React from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProblemSolverClient from './ProblemSolverClient';
import type { Problem as SerializableProblem } from '@/lib/types';

interface PageProps {
  params: Promise<{
    problemId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProblemSolverPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const assignmentId = resolvedSearchParams?.assignmentId as string | undefined;
  const hashedId = resolvedSearchParams?.hashedId as string | undefined;
  const assignmentInfo = {
    assignmentId: assignmentId || null,
    hashedId: hashedId || null,
  };
  const problemId = parseInt(resolvedParams.problemId, 10);

  if (isNaN(problemId)) {
    notFound();
  }

  const problem = await prisma.programmingProblem.findUnique({
    where: { id: problemId },
    include: {
      sampleCases: true,
    },
  });

  if (!problem) {
    notFound();
  }

  // PrismaのDateオブジェクトなどをシリアライズ可能な形式に変換
  const plainProblem = JSON.parse(JSON.stringify(problem));

  return <ProblemSolverClient problem={plainProblem} assignmentInfo={assignmentInfo} />;
}
