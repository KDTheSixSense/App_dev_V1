
import React from 'react';
import { notFound } from 'next/navigation';
import ProblemClient from './ProblemClient';
import { getProblemForClient } from '@/lib/data';

type PageProps = {
  params: Promise<{
    problemId: string;
  }>;
};

const BasicInfoBProblemPage = async (props: PageProps) => {
  const params = await props.params;
  const problemId = parseInt(params.problemId, 10);

  if (isNaN(problemId)) {
    notFound();
  }

  const problem = await getProblemForClient(problemId);

  if (!problem) {
    notFound();
  }

  return <ProblemClient initialProblem={problem} />;
};

export default BasicInfoBProblemPage;
