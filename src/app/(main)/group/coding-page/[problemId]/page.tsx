// /workspaces/my-next-app/src/app/(main)/group/coding-page/[problemId]/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProblemSolverClient from './ProblemSolverClient';
import type { Problem as SerializableProblem } from '@/lib/types';

interface PageProps {
  params: {
    problemId: string;
  };
}

export default async function ProblemSolverPage({ params }: PageProps) {
  const problemId = parseInt(params.problemId, 10);

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

  return <ProblemSolverClient problem={plainProblem} />;
}
