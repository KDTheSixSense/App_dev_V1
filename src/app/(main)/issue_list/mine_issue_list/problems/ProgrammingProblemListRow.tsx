import React from 'react';
import Link from 'next/link';

interface ProgrammingProblemListRowProps {
  problem: {
    id: number;
    title: string;
    createdAt: Date;
    creator: {
      username: string | null;
    } | null;
  };
}

const ProgrammingProblemListRow = ({ problem }: ProgrammingProblemListRowProps) => {
  return (
    <li className="border-b border-gray-200 last:border-0">
      <Link
        href={`/issue_list/programming_problem/${problem.id}?from=mine`}
        className="block hover:bg-gray-50 transition duration-150 ease-in-out"
      >
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="text-sm font-medium text-blue-600 truncate">
            {problem.title}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(problem.createdAt).toLocaleDateString()}
          </div>
        </div>
      </Link>
    </li>
  );
};

export default ProgrammingProblemListRow;