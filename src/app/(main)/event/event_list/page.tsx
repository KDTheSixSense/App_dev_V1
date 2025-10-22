// app/(main)/event/event_list/page.tsx

import { getEvents, type Event as 基本イベント } from "@/lib/event";
import ProblemClient from "./ProblemClient";

// クライアントコンポーネントが期待する型に合わせます
type イベント = 基本イベント & {
  startTime: Date;
  endTime: Date;
  _count?: { participants: number };
};

/**
 * タスク：サーバーサイドで初期表示に必要なイベントデータを取得します。
 */
const イベントリストページ = async () => {
  let initialEvents: イベント[] = [];

  try {
    const eventsFromDb = await getEvents();
    
    initialEvents = eventsFromDb.map(event => ({
      ...event,
      startTime: event.startTime ? new Date(event.startTime) : new Date(),
      // この行を完成させます 
      endTime: event.endTime ? new Date(event.endTime) : new Date(),
    }));
  } catch (error) {
    console.error("初期イベントの取得に失敗しました:", error);
  }

  return <ProblemClient initialEvents={initialEvents} />;
};

export default イベントリストページ;
