// イベントリスト（参加・作成を選択する初期ページ）
// app/(main)/event/event_list/page.tsx

import { getEvents, type Event as BaseEvent } from "@/lib/event";
import ProblemClient from "./ProblemClient";

// ProblemClientで期待される型に合わせて拡張
type Event = BaseEvent & {
  startTime: Date;
  endTime: Date;
  _count?: { participants: number };
};

const EventListPage = async () => {
  let initialEvents: Event[] = [];

  try {
    // getEventsが正しいデータを返すようになったので、型アサーションは不要
    const eventsFromDb = await getEvents();
    
    initialEvents = eventsFromDb.map(event => ({
      ...event,
      // startTimeやendTimeがnullの場合、無効な日付にならないように現在時刻で代替
      startTime: new Date(event.startTime || Date.now()),
      endTime: new Date(event.endTime || Date.now()),
    }));
  } catch (error) {
    console.error("Failed to fetch initial events:", error);
    
  }

  return <ProblemClient initialEvents={initialEvents} />;
};

export default EventListPage;