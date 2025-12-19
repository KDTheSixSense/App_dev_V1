// app/(main)/event/event_list/page.tsx

import { prisma } from "@/lib/prisma";
import type { Create_event as PrismaEvent } from "@prisma/client";
import ProblemClient from "./ProblemClient";
import { getAppSession } from "@/lib/auth";

// クライアントコンポーネントが期待する型に合わせます
// 注意: propsとして渡す際、Dateオブジェクトは文字列にシリアライズされます。
export type イベント = {
  id: number;
  title: string;
  publicStatus: boolean;
  startTime: Date | string | null;
  endTime: Date | string | null;
  isStarted: boolean;
  participantsCount: number;
};

/**
 * タスク：サーバーサイドで初期表示に必要なイベントデータを取得します。
 */
const EventListPage = async () => {
  let initialEvents: イベント[] = [];
  const session = await getAppSession();
  const userId = session?.user?.id ? session.user.id : null;

  try {
    // ログインしていない場合は何も表示しない
    if (userId) {
      const eventsFromDb = await prisma.create_event.findMany({
        where: {
          // 自分が参加者であるイベント
          participants: {
            some: {
              userId: userId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          publicStatus: true,
          startTime: true,
          endTime: true,
          isStarted: true,
          _count: {
            select: {
              // isAdminがfalseの参加者のみをカウントする
              participants: {
                where: { isAdmin: false },
              },
            },
          },
        },
        orderBy: [
          { publicStatus: 'desc' }, // 公開中を次に
          { startTime: 'desc' }, // 開始時間が新しい順
        ],
        take: 20, // 取得件数を20件に制限
      });

      // 取得したデータをクライアントコンポーネントの期待する形式に変換（手動シリアライズ）
      // Date型を文字列またはnullに変換してJSON.parse/stringifyのオーバーヘッドを削減
      initialEvents = eventsFromDb.map(event => ({
        id: event.id,
        title: event.title,
        publicStatus: event.publicStatus,
        startTime: event.startTime ? event.startTime.toISOString() : null,
        endTime: event.endTime ? event.endTime.toISOString() : null,
        isStarted: event.isStarted,
        participantsCount: event._count.participants,
      }));
    }
  } catch (error) {
    console.error("初期イベントの取得に失敗しました:", error);
  }

  return <ProblemClient initialEvents={initialEvents} />;
};

export default EventListPage;
