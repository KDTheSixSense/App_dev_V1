// /workspaces/my-next-app/src/app/(main)/issue_list/programming_problem/problems/page.tsx

// "use client"; を削除します

import React from 'react';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Propsの型定義に authorName を追加
interface ProblemListRowProps {
  problemId: string;
  title: string;
  authorName: string | null; // 作成者名 (Userモデルのusernameはnullableなのでnull許容)
}

// ProblemListRowコンポーネントを修正して作成者名を表示
const ProblemListRow: React.FC<ProblemListRowProps> = ({ problemId, title, authorName }) => {
  return (
    <Link href={`/issue_list/programming_problem/${problemId}`} className="block w-full">
      {/* ★ flexレイアウトでタイトルと作成者名を両端に配置 */}
      <li className="flex justify-between items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-blue-600 hover:text-blue-800">
          問{problemId}: {title}
        </span>
        {/* ★ 作成者名を表示 */}
        {authorName && (
          <span className="text-sm text-gray-500">
            作成者: {authorName}
          </span>
        )}
      </li>
    </Link>
  );
};

// コンポーネントを async 関数に変更
const ProgrammingProblemsListPage = async () => {
  // ★ データベースから問題を取得する際に、`include` で creator (User) の情報も取得
  const problems = await prisma.programmingProblem.findMany({
    where: {
      isPublished: true, // 公開済みの問題のみ取得
    },
    // ★ ここが重要！
    include: {
      creator: { // schema.prismaで定義したリレーション名
        select: {
          username: true, // 必要なユーザー情報（ここではusername）だけを選択
        },
      },
    },
    orderBy: {
      id: 'asc', // IDの昇順でソート
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          プログラミングコーディング問題一覧
        </h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto"> {/* 横幅を少し広げました */}
          <ul>
            {problems.map((problem) => (
              <ProblemListRow
                key={problem.id}
                problemId={String(problem.id)}
                title={problem.title}
                // ★ 取得した作成者名をPropsとして渡す
                // creatorやusernameがnullの可能性も考慮して??でデフォルト値を設定
                authorName={problem.creator?.username ?? '不明な作成者'}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProgrammingProblemsListPage;