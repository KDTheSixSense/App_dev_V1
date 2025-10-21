// イベントリスト（参加・作成を選択する初期ページ　UI関係コンポーネント）
// app/(main)/event/event_list/ProblemClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// サーバーから渡されるEvent型をインポート
// APIレスポンスには inviteCode が含まれる可能性があるため、型を拡張します
import type { Event as BaseEvent } from "@/lib/event";

type Event = BaseEvent & {
  inviteCode?: string;
  startTime: Date; // startTimeプロパティを追加
  endTime: Date; // endTimeプロパティを追加
  _count?: { participants: number }; // 参加人数を保持するプロパティ
};


interface ProblemClientProps {
  initialEvents: Event[];
}

const ProblemClient = ({ initialEvents }: ProblemClientProps) => {
  const router = useRouter();
  const [eventCode, setEventCode] = useState("");
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [error, setError] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // イベント参加フォームの送信処理
  const handleJoinEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setJoinMessage("");

    if (!eventCode.trim()) {
      setError("イベントコードを入力してください。");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/event/event_list', {
        method: 'POST',
        body: JSON.stringify({ eventCode }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        // APIからのエラーメッセージを表示
        throw new Error(data.message || 'イベントへの参加に失敗しました。');
      }

      const newEvent: Event = data;

      // 既に参加済みのイベントかどうかを、APIからのレスポンスを受け取った後にチェックします
      if (events.some(event => event.id === newEvent.id)) {
        throw new Error("既に参加しているイベントです。");
      }

      setEvents(prevEvents => [...prevEvents, newEvent]);
      setJoinMessage(`「${newEvent.title}」に参加しました！`);
      setEventCode("");

    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // イベント作成ページへ遷移
  const handleCreateEvent = () => {
    router.push("/event/admin/create_event");
  };

  // 日付と時間をフォーマットするヘルパー関数
  const formatEventDate = (start: string | Date) => {
    const date = new Date(start);
    return date.toLocaleDateString('ja-JP');
  };

  const formatEventTime = (start: string | Date) => {
    // タイムゾーンを 'Asia/Tokyo' に固定して、サーバーとクライアントでの表示の差異をなくします。
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' };

    const startTime = new Date(start).toLocaleTimeString('ja-JP', options);

    return startTime;
  };



  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">イベント</h1>

      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">イベントに参加する</h2>
        <form onSubmit={handleJoinEvent} className="flex items-center gap-2">
          <input
            type="text"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            placeholder="イベントコードを入力"
            className="input input-bordered w-full max-w-xs"
          />
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            参加
          </button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {joinMessage && <p className="text-green-500 mt-2">{joinMessage}</p>}
      </div>

      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">イベントを作成する</h2>
        <button onClick={handleCreateEvent} className="btn btn-secondary">
          イベント作成ページへ
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">参加中のイベント一覧</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => router.push(`/event/event_detail/${event.id}`)}
              className="btn btn-outline h-auto text-left flex flex-col items-start p-4 normal-case"
            >
              <div className="font-bold text-lg mb-2">{event.title}</div>
              <div className="text-sm">
                開催日: {formatEventDate(event.startTime)}
              </div>
              <div className="text-sm">
                開催時間: {formatEventTime(event.startTime)}
              </div>
              <div className="text-sm">参加人数: {event._count?.participants ?? 'N/A'}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProblemClient;