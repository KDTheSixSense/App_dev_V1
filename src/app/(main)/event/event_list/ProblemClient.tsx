// イベントリスト（参加・作成を選択する初期ページ　UI関係コンポーネント）
// app/(main)/event/event_list/ProblemClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// イベントの型定義
interface Event {
  id: string;
  name: string;
  code?: string; // APIからのレスポンスに含まれる可能性がある
}

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
    
    // 既にリストにあるイベントへの参加を防ぐ
    const isAlreadyJoined = events.some(event => event.id === eventCode || (event.code && event.code === eventCode));
    if (isAlreadyJoined) {
      setError("既に参加しているイベントです。");
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
      setEvents(prevEvents => [...prevEvents, newEvent]);
      setJoinMessage(`「${newEvent.name}」に参加しました！`);
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
        <ul className="list-disc list-inside">
          {events.map((event) => (
            <li key={event.id}>{event.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProblemClient;