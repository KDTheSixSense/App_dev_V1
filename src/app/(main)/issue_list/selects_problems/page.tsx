import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // データベース接続用のPrisma Clientをインポート
import { getAppSession } from '@/lib/auth';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLeft } from 'lucide-react';

// Propsの型定義をデータベースの型に合わせます
interface ProblemListRowProps {
  problemId: number; // データベースのIDは数値です
  title: string;
  solvedStatus: 'today' | 'past' | 'none';
}

const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, solvedStatus }) => {
  return (
    // Linkのパスを正しく設定します
    <Link href={`/issue_list/selects_problems/${problemId}`} className="block w-full">
      <li className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <div className="flex items-center">
          <span className="font-medium text-blue-600 hover:text-blue-800">
            問{problemId}: {title}
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
      </li>
    </Link>
  );
};

// ページコンポーネントを非同期関数 `async` に変更します
// ページコンポーネントを非同期関数 `async` に変更します
import { detectThreatType } from '@/lib/waf';
import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SelectProblemsListPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  // Security Check: WAF
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      let threat = detectThreatType(key);
      if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);

      if (typeof value === 'string') {
        threat = detectThreatType(value);
        if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          threat = detectThreatType(item);
          if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);
        }
      }
    }
  }

  const session = await getAppSession();
  const userId = session.user?.id;

  const solvedStatusMap = new Map<number, 'today' | 'past'>();

  if (userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // `selectProblem_id` を使って正解履歴を取得
    const correctAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: userId as any,
        isCorrect: true,
        selectProblem_id: { not: null },
      },
      select: {
        selectProblem_id: true,
        answeredAt: true,
      },
      orderBy: { answeredAt: 'desc' },
    });

    for (const answer of correctAnswers) {
      const problemId = answer.selectProblem_id;
      if (problemId === null || solvedStatusMap.has(problemId)) {
        continue;
      }
      const answeredDate = answer.answeredAt;
      const status = answeredDate >= todayStart && answeredDate < todayEnd ? 'today' : 'past';
      solvedStatusMap.set(problemId, status);
    }
  }

  // サーバーサイドでデータベースから問題リストを取得します
  const problems = await prisma.selectProblem.findMany({
    // where句は不要かもしれません。すべての選択問題を表示する場合。
    // もし特定の科目に絞るなら、以下のようにします。
    // where: {
    //   subjectId: 4, // "プログラミング選択問題"のID
    // },
    orderBy: {
      id: 'asc', // IDの昇順で並べます
    },
    select: {
      id: true,
      title: true,
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-4 max-w-2xl mx-auto">
          <Link href="/issue_list" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            問題種別一覧へ戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">選択問題一覧</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-2xl mx-auto">
          <ul>
            {/* 取得した問題のリストを表示します */}
            {problems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                problemId={problem.id}
                title={problem.title}
                solvedStatus={solvedStatusMap.get(problem.id) || 'none'}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelectProblemsListPage;