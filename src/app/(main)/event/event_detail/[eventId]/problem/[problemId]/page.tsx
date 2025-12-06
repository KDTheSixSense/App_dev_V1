
import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProblemSolverClient from './ProblemSolverClient';
import type { Problem as SerializableProblem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProblemSolverPage(props: { params: Promise<{ eventId: string; problemId: string }> }) {
  const params = await props.params;
  const eventId = parseInt(params.eventId, 10);
  const problemId = parseInt(params.problemId, 10);

  if (isNaN(eventId) || isNaN(problemId)) {
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

  const eventIssue = await prisma.event_Issue_List.findFirst({
    where: {
      eventId: eventId,
      problemId: problemId,
    },
  });

  if (!eventIssue) {
    notFound();
  }

  // PrismaのDateオブジェクトなどをシリアライズ可能な形式に変換
  const plainProblem = JSON.parse(JSON.stringify(problem));

  return <ProblemSolverClient problem={plainProblem} eventId={eventId} eventIssueId={eventIssue.id} />;
}
