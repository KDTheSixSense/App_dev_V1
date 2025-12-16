// /workspaces/my-next-app/src/app/(main)/group/coding-page/[problemId]/page.tsx

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import ProblemSolverClient from './ProblemSolverClient';
import type { Problem as SerializableProblem } from '@/lib/types';

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

type ProblemSolverPageProps = {
  params: Promise<{ problemId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProblemSolverPage({ params, searchParams }: ProblemSolverPageProps) {
  // Authentication Check
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    redirect('/auth/login');
  }

  const resolvedParams = await params;
  const { problemId: problemIdString } = resolvedParams;
  const resolvedSearchParams = searchParams ? await searchParams : undefined; // searchParams を await する
  const assignmentId = resolvedSearchParams?.assignmentId as string | undefined;
  const hashedId = resolvedSearchParams?.hashedId as string | undefined;
  const assignmentInfo = {
    assignmentId: assignmentId || null,
    hashedId: hashedId || null,
  };
  const problemId = parseInt(problemIdString, 10);

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
