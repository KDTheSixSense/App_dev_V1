'use client';

import React from 'react';
import type { SerializableProblem } from '@/lib/data';

interface ProblemClientProps {
  initialProblem: SerializableProblem;
  initialCredits: number;
}

const ProblemClient: React.FC<ProblemClientProps> = ({ initialProblem, initialCredits }) => {
  return (
    <div>
      <h1>{initialProblem.title.ja}</h1>
      <p>{initialProblem.description.ja}</p>
      {/* TODO: Implement the rest of the component */}
    </div>
  );
};

export default ProblemClient;
