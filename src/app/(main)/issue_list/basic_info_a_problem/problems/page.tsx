import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // データベース接続(Prisma)をインポート

// 削除: ローカルファイルからのインポートは不要になります
// import { basicInfoAProblems } from '@/lib/issue_list/basic_info_a_problem/problem';

interface ProblemListRowProps {
  problemId: number;
  title: string;
  //sourceText: string;
}

// Component for a single row in the problem list
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, /*sourceText*/ }) => {
  return (
    // Use li for semantic list structure, but Link handles click and navigation
    <li className="border-b border-gray-200 flex-shrink-0"> {/* Add flex-shrink-0 */}
      <Link 
        href={`/issue_list/basic_info_a_problem/${problemId}`} 
        // Apply styling directly to the Link for better click area control
        className="block p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer w-full"
      >
        <div className="flex justify-between items-center"> {/* Use flex for alignment */}
          <span className="font-medium text-blue-600 hover:text-blue-800">
            {title}
          </span>
        </div>
      </Link>
    </li>
  );
};

// The main page component (Server Component)
const ProblemsListPage = async () => {
  // Fetch the list of Basic Info A problems from the database
  const problems = await prisma.basic_Info_A_Question.findMany({
    select: {
      id: true,
      title: true,
      sourceYear: true,
      sourceNumber: true,
    },
    orderBy: [
      { id: 'asc' },          // Then by ID ascending
    ]
  });

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          基本情報A問題 問題一覧
        </h1>
        {/* Container for the list with width constraint and centering */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          {problems.length > 0 ? (
            <ul>
              {/* Map over the fetched problems and render a row for each */}
              {problems.map((problem) => (
                <ProblemListRow
                  key={problem.id}
                  problemId={problem.id}
                  title={problem.title}
                  // Combine year and number for display
                  // sourceText={`${problem.sourceYear || '年度不明'} ${problem.sourceNumber || ''}`.trim()}
                />
              ))}
            </ul>
          ) : (
             // Display a message if no problems are found
             <p className="p-4 text-center text-gray-500">問題が見つかりませんでした。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemsListPage;