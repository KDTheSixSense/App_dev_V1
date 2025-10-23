// app/(main)/event/event_list/page.tsx

import { getEvents, type Event as 基本イベント } from "@/lib/event";
import ProblemClient from "./ProblemClient";

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

  try {
    const eventsFromDb = await getEvents();
    
    // Dateオブジェクトを直接渡すとシリアライズされるため、そのままの型で渡します。
    // クライアント側でDateオブジェクトに変換します。
    initialEvents = eventsFromDb;
  } catch (error) {
    console.error("初期イベントの取得に失敗しました:", error);
  }

  return <ProblemClient initialEvents={initialEvents} />;
};

export default イベントリストページ;
