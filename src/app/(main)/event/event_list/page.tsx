// app/(main)/event/event_list/page.tsx

import { getEvents, type Event as 基本イベント } from "@/lib/event";
import ProblemClient from "./ProblemClient";
import { getAppSession } from "@/lib/auth";

// クライアントコンポーネントが期待する型に合わせます
// 注意: propsとして渡す際、Dateオブジェクトは文字列にシリアライズされます。
type イベント = 基本イベント & {
  startTime: Date | string | null;
  endTime: Date | string | null;
  _count?: { participants: number };
};

/**
 * タスク：サーバーサイドで初期表示に必要なイベントデータを取得します。
 */
const イベントリストページ = async () => {
  let initialEvents: イベント[] = [];
  const session = await getAppSession();
  const userId = session.user?.id;

  try {
    if (userId) {
      const eventsFromDb = await getEvents(userId as number);
      initialEvents = eventsFromDb;
    }
  } catch (error) {
    console.error("初期イベントの取得に失敗しました:", error);
  }

  return <ProblemClient initialEvents={initialEvents} />;
};

export default イベントリストページ;
