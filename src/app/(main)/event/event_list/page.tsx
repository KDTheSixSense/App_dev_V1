// イベントリスト（参加・作成を選択する初期ページ）
// app/(main)/event/event_list/page.tsx

import ProblemClient from "./ProblemClient";
import { headers } from "next/headers";

// イベントの型定義
interface Event {
  id: string;
  name: string;
}

// サーバーサイドでAPIを呼び出すためのヘルパー関数
const getBaseUrl = async () => {
  const h = await headers();
  const host = h.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
};

const EventListPage = async () => {
  let initialEvents: Event[] = [];
  const baseUrl = await getBaseUrl();
  try {
    // サーバーサイドで参加中のイベントリストを取得
    const res = await fetch(`${baseUrl}/api/event/event_list`, {
      cache: "no-store", // 常に最新のデータを取得
    });
    if (res.ok) {
      initialEvents = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch initial events:", error);
  }

  return <ProblemClient initialEvents={initialEvents} />;
};

export default EventListPage;