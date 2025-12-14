import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // データベース接続(Prisma)をインポート
import { getAppSession } from '@/lib/auth';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLeft } from 'lucide-react';

// 削除: ローカルファイルからのインポートは不要になります
// import { basicInfoAProblems } from '@/lib/issue_list/basic_info_a_problem/problem';

interface ProblemListRowProps {
  problemId: number;
  title: string;
  solvedStatus: 'today' | 'past' | 'none';
  //sourceText: string;
}

// Component for a single row in the problem list
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, solvedStatus }) => {
  return (
    // Use li for semantic list structure, but Link handles click and navigation
    <li className="border-b border-gray-200 flex-shrink-0"> {/* Add flex-shrink-0 */}
      <Link 
        href={`/issue_list/basic_info_a_problem/${problemId}`} 
        // Apply styling directly to the Link for better click area control
        className="block p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer w-full"
      >
        <div className="flex justify-between items-center"> {/* Use flex for alignment */}
          <div className="flex items-center">
            <span className="font-medium text-blue-600 hover:text-blue-800">
              {title}
            </span>
          </div>
          {solvedStatus === 'today' && (
            <span className="text-sm font-semibold text-white bg-blue-500 rounded-full px-3 py-1">
              解答済み
            </span>
          )}
          {solvedStatus === 'past' && (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          )}
        </div>
      </Link>
    </li>
  );
};

// The main page component (Server Component)
const ProblemsListPage = async () => {
  const session = await getAppSession();
  const userId = session.user?.id;

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId) {
    // 今日の日付の開始と終了を取得
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const correctAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: userId as any,
        isCorrect: true,
        // 基本情報A問題の解答のみに絞り込む
        basic_A_Info_Question_id: {
          not: null,
        },
      },
      select: {
        basic_A_Info_Question_id: true,
        answeredAt: true,
      },
      orderBy: {
        answeredAt: 'desc', // 新しい解答から処理する
      },
    });

    for (const answer of correctAnswers) {
      const problemId = answer.basic_A_Info_Question_id;
      if (problemId === null || solvedStatusMap.has(problemId)) {
        continue; // IDがないか、既に新しい解答でステータスが設定済みの場合はスキップ
      }

      const answeredDate = answer.answeredAt;
      const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
      solvedStatusMap.set(problemId, status);
    }
  }
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

  // ========== DEBUGGING CODE START ==========
  console.log(`[DEBUG] Found ${problems.length} problems in findMany.`);
  for (const problem of problems) {
    const found = await prisma.basic_Info_A_Question.findUnique({
      where: { id: problem.id },
      select: { id: true }
    });
    if (!found) {
      console.error(`[DEBUG] ‼️ FAILED to findUnique for id: ${problem.id}`);
    } else {
      console.log(`[DEBUG] ✅ Successfully confirmed findUnique for id: ${problem.id}`);
    }
  }
  console.log(`[DEBUG] Finished confirmation loop.`);
  // ========== DEBUGGING CODE END ==========

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="mb-4 max-w-2xl mx-auto">
          <Link href="/issue_list" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            問題種別一覧へ戻る
          </Link>
        </div>
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
                  solvedStatus={solvedStatusMap.get(problem.id) || 'none'}
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