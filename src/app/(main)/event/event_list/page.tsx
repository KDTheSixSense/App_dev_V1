// app/(main)/event/event_list/page.tsx

import { prisma } from "@/lib/prisma";
import type { Create_event as PrismaEvent } from "@prisma/client";
import ProblemClient from "./ProblemClient";
import { getAppSession } from "@/lib/auth";

// クライアントコンポーネントが期待する型に合わせます
// 注意: propsとして渡す際、Dateオブジェクトは文字列にシリアライズされます。
export type イベント = PrismaEvent & {
  startTime: Date | string | null;
  endTime: Date | string | null;
  _count?: { participants: number }; // 基本イベントの型定義に含まれていないため、ここで定義
};

/**
 * タスク：サーバーサイドで初期表示に必要なイベントデータを取得します。
 */
const イベントリストページ = async () => {
  let initialEvents: イベント[] = [];
  const session = await getAppSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  try {
    // ログインしていない場合は何も表示しない
    if (userId) {
      const eventsFromDb = await prisma.create_event.findMany({
        where: {
          // AND条件
          // 1. 自分が参加者であるイベント
          participants: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          _count: { select: { participants: true } },
        },
        orderBy: [
          { publicStatus: 'desc' }, // 公開中を次に
          { startTime: 'desc' }, // 開始時間が新しい順
        ]
      });
      initialEvents = eventsFromDb;
    }

  } catch (error) {
    console.error("初期イベントの取得に失敗しました:", error);
  }

  return <ProblemClient initialEvents={initialEvents} />;
};

export default イベントリストページ;
