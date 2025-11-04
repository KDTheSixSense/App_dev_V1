// src/lib/event.ts

import { prisma } from "@/lib/prisma";

// このファイルは、データベースからイベントを取得するロジックをカプセル化します。
// サーバーコンポーネントやAPIルートから安全にインポートして使用できます。

// イベントの型定義
export interface Event {
  id: number; // Prismaのモデルに合わせて number に変更
  title: string;
  publicStatus: boolean;
  startTime: Date | null;
  endTime: Date | null;
  _count: {
    participants: number;
  };
}

export const getEvents = async (userId: number): Promise<Event[]> => {
  try {
    console.log(`Fetching events for user ${userId} from the database...`);
    // Prisma Clientを使って、指定されたユーザーが参加または作成したイベントを取得します
    const events = await prisma.create_event.findMany({
      where: {
        OR: [
          {
            participants: {
              some: {
                userId: userId,
              },
            },
          },
          {
            creatorId: userId,
          },
        ],
      },
      select: {
        id: true,
        title: true,
        publicStatus: true,
        startTime: true,
        endTime: true,
        _count: {
          select: { participants: true },
        },
      },
    });
    return events;
  } catch (error) {
    console.error(`Failed to fetch events for user ${userId}:`, error);
    return []; // エラーが発生した場合は空の配列を返す
  }
};