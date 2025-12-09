"use client";
//app/(main)/event/event_detail/[eventId]/problem/[problemId]/page.tsx

import React from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProblemSolverClient from './ProblemSolverClient';
import type { Problem as SerializableProblem } from '@/lib/problem-types';

export default async function ProblemSolverPage({ params }: any) {  
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