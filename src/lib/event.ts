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

export const getEvents = async (): Promise<Event[]> => {
  try {
    console.log("Fetching events directly from the database via Prisma...");
    // Prisma Clientを使って公開されているイベントを取得します
    // startTime, endTime, 参加人数(_count)も取得するように修正
    const events = await prisma.create_event.findMany({
      where: { publicStatus: true }, // 公開中のイベントのみ取得
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
    console.error("Failed to fetch events:", error);
    return []; // エラーが発生した場合は空の配列を返す
  }
};