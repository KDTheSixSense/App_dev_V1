// /workspaces/my-next-app/src/app/(main)/event/admin/create_event/page.tsx
import { prisma } from '@/lib/prisma';
import { CreateEventClient } from './CreateEventClient'; // 次のステップで作成

/**
 * フォームで選択可能なプログラミング問題の型
 */
export type ProblemSelectItem = {
  id: number;
  title: string;
};

/**
 * 選択可能なプログラミング問題一覧を取得する
 */
async function getAvailableProblems(): Promise<ProblemSelectItem[]> {
  try {
    const problems = await prisma.programmingProblem.findMany({
      where: {
        isPublished: true, // 公開済みの問題のみを対象
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
    return problems;
  } catch (error) {
    console.error("Failed to fetch problems:", error);
    return [];
  }
}

/**
 * イベント作成ページ (サーバーコンポーネント)
 */
export default async function CreateEventPage() {
  // サーバーサイドで問題一覧を取得
  const problems = await getAvailableProblems();

  return (
    <div className="container mx-auto p-4">
      {/* 状態管理やインタラクションを持つクライアントコンポーネントにデータを渡す */}
      <CreateEventClient problems={problems} />
    </div>
  );
}