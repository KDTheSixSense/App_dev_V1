
import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProblemSolverClient from './ProblemSolverClient';
import type { Problem as SerializableProblem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProblemSolverPage({ params }: any) {
  const resolvedParams = await params;
  console.log('[ProblemSolverPage] Resolved Params:', resolvedParams);

  const eventId = parseInt(resolvedParams.eventId, 10);
  const problemId = parseInt(resolvedParams.problemId, 10);

  console.log(`[ProblemSolverPage] Parsed IDs: eventId=${eventId}, problemId=${problemId}`);

  if (isNaN(eventId) || isNaN(problemId)) {
    console.error(`[ProblemSolverPage] Invalid IDs: eventId=${eventId}, problemId=${problemId}`);
    notFound();
  }

  const problem = await prisma.programmingProblem.findUnique({
    where: { id: problemId },
    include: {
      sampleCases: true,
    },
  });

  if (!problem) {
    console.error(`[ProblemSolverPage] Problem not found in DB: id=${problemId}`);
    notFound();
  } else {
    console.log(`[ProblemSolverPage] Problem found: ${problem.title}`);
  }

  const eventIssue = await prisma.event_Issue_List.findFirst({
    where: {
      eventId: eventId,
      problemId: problemId,
    },
  });

  if (!eventIssue) {
    console.error(`[ProblemSolverPage] EventIssue not found: eventId=${eventId}, problemId=${problemId}`);
    notFound();
  } else {
    console.log(`[ProblemSolverPage] EventIssue found: id=${eventIssue.id}`);
  }

  // PrismaのDateオブジェクトなどをシリアライズ可能な形式に変換
  const plainProblem = JSON.parse(JSON.stringify(problem));

  return <ProblemSolverClient problem={plainProblem} eventId={eventId} eventIssueId={eventIssue.id} />;
}
