// app/(main)/event/event_list/page.tsx

import { getAppSession } from '@/lib/auth';
import { prisma } from "@/lib/prisma";
import type { Create_event as PrismaEvent } from "@prisma/client";
import ProblemClient from "./ProblemClient";

// クライアントコンポーネントが期待する型に合わせます
// 注意: propsとして渡す際、Dateオブジェクトは文字列にシリアライズされます。
export type イベント = PrismaEvent & {
  startTime: Date | string | null;
  endTime: Date | string | null;
  // 参加者数をサーバーサイドで計算して渡すため、型を拡張
  participantsCount?: number;
  // 元の_countは使わなくなるが、他の箇所での影響を避けるため残しても良い
  _count?: { participants: number };
};

/**
 * タスク：サーバーサイドで初期表示に必要なイベントデータを取得します。
 */
const EventListPage = async () => {
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
          // ★★★ 修正点: 参加者の詳細情報を取得して、管理者を除いた人数を計算できるようにする ★★★
          participants: {
            select: {
              isAdmin: true,
            },
          },
        },
        orderBy: [
          { publicStatus: 'desc' }, // 公開中を次に
          { startTime: 'desc' }, // 開始時間が新しい順
        ]
      });
      initialEvents = eventsFromDb;

      // 取得したデータに参加者数を計算して追加
      initialEvents = eventsFromDb.map(event => ({
        ...event,
        participantsCount: event.participants.filter(p => !p.isAdmin).length,
      }));
    }

  } catch (error) {
    console.error("初期イベントの取得に失敗しました:", error);
  }

  // サーバーコンポーネントからクライアントコンポーネントへ渡すデータはシリアライズ可能である必要があります。
  // Dateオブジェクトなどが含まれている可能性があるため、JSONを経由してプレーンなオブジェクトに変換します。
  const serializableEvents = JSON.parse(JSON.stringify(initialEvents));

  return <ProblemClient initialEvents={serializableEvents} />;
};

export default EventListPage;
