// /workspaces/my-next-app/src/app/(main)/event/event_detail/[eventId]/AdminView.tsx
'use client';

import { toggleEventStatusAction, deleteEventAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'; // Import useState for local state management
import type { Prisma } from '@prisma/client'; // Import Prisma namespace for types


// コンポーネントで受け取るイベント詳細データの最終的な型
// イベントの主体である `Create_event` モデルに対応
type EventWithDetails = Prisma.Create_eventGetPayload<{
  include: {
    participants: {
      include: {
        user: {
          include: {
            // ユーザーに紐づくイベント提出情報を取得
            eventSubmissions: true;
          };
        };
      };
    };
    issues: {
      include: {
        problem: true; // `Event_Issue_List` に紐づく `ProgrammingProblem` 情報を取得
      };
    };
  }; // Removed ProblemInfo as it's not directly used here
}>;

interface AdminViewProps {
  event: EventWithDetails & { isStarted?: boolean }; // Add isStarted to event type
}

export default function AdminView({ event: initialEvent }: AdminViewProps) { // Rename event to initialEvent
  const router = useRouter();
  // isClient state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);
  const [event, setEvent] = useState(initialEvent); // Use local state for event to allow updates
  const [copied, setCopied] = useState(false); // 招待コードコピー用の状態
  const [isSubmitting, setIsSubmitting] = useState(false); // Add isSubmitting state

  useEffect(() => {
    setIsClient(true);
  }, []);

    // イベント作成者（isAdminがtrueの参加者）を特定
  const eventCreator = event.participants.find(p => p.isAdmin);
  // その他の参加者（admin_flgがfalseの参加者）をフィルタリング
  const otherParticipants = event.participants.filter(p => !p.isAdmin);
  
  // 参加者を獲得点数の降順でソート
  const sortedParticipants = [...otherParticipants].sort((a, b) => {
    const scoreA = a.event_getpoint ?? 0;
    const scoreB = b.event_getpoint ?? 0;
    return scoreB - scoreA; // 降順
  });

  // isClientがtrueになってから時刻比較を行う
  // 「未終了」かつ「一度でも開始された」場合にアクティブとみなす
  const isEventActive = event.isStarted && event.hasBeenStarted;

  const handleStartEvent = async () => {
    if (!confirm('イベントを開始しますか？開始すると、参加者が問題にアクセスできるようになります。')) return;
    setIsSubmitting(true);
    try {
      const result = await toggleEventStatusAction(event.id, true);
      if (result.error) throw new Error(result.error);
      
      // 状態を即時反映させるために、ローカルstateも更新
      setEvent(prev => ({ ...prev, isStarted: true, hasBeenStarted: true, startTime: new Date() }));
      alert('イベントを開始しました！');
    } catch (error) {
      console.error('イベント開始エラー:', error);
      alert(`イベント開始中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndEvent = async () => {
    if (!confirm('イベントを終了しますか？参加者は問題を見ることができなくなります。')) return;
    setIsSubmitting(true);
    try {
      const result = await toggleEventStatusAction(event.id, false);
      if (result.error) throw new Error(result.error);

      // 状態を即時反映
      setEvent(prev => ({ ...prev, isStarted: false }));
      alert('イベントを終了しました。');
    } catch (error) {
      console.error('イベント終了エラー:', error);
      alert(`イベント終了中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('本当にこのイベントを削除しますか？\nこの操作は元に戻すことができません。')) return;
    setIsSubmitting(true);
    try {
      const result = await deleteEventAction(event.id);
      if (result.error) throw new Error(result.error);

      alert('イベントを削除しました。');
      router.push('/event/event_list');
    } catch (error) {
      console.error('イベント削除エラー:', error);
      alert(`イベントの削除中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 招待コードをクリップボードにコピーするハンドラ
  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(event.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2秒後に表示を元に戻す
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-blue-600">[Admin] {event.title}</h1>
      <p className="mt-2 text-gray-600">{event.description}</p>
      
      {/* 招待コード表示とコピーボタン */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-blue-800">招待コード</span>
          <p className="text-lg font-mono font-semibold text-blue-900">{event.inviteCode}</p>
        </div>
        <button
          onClick={handleCopyInviteCode}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {copied ? 'コピーしました！' : 'コピー'}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">イベント作成者</h2>
        {eventCreator ? (
          <p>
            {eventCreator.user.username} 
            <span className="ml-2 text-sm text-green-600">(管理者)</span>
          </p>
        ) : (
          <p>イベント作成者が見つかりません。</p>
        )}
      </div>

      {/* イベント開始ボタン */}
      <div className="mt-6 flex items-center space-x-4">
        {!event.hasBeenStarted ? (
            <button
              onClick={handleStartEvent}
              disabled={isSubmitting}
              className="px-6 py-3 text-lg font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400"
            >
              イベントを開始する
            </button>
          ) : event.isStarted ? (
            <button
              onClick={handleEndEvent}
              disabled={isSubmitting}
              className="px-6 py-3 text-lg font-semibold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400"
            >
              イベントを終了する
            </button>
          ) : (
            <p className="text-lg font-semibold text-gray-500">このイベントは終了しました。</p>
          )}

        {/* 削除ボタン */}
        <button
          onClick={handleDeleteEvent}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-300"
        >
          イベントを削除
        </button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold">イベント参加者一覧 ({otherParticipants.length}人)</h2>
        {sortedParticipants.length > 0 ? (
          <ul className="list-disc list-inside mt-2">
            {sortedParticipants.map((participant) => (
              (() => {
                // event_getpointフィールドから獲得点数を取得
                const score = participant.event_getpoint ?? 0;
                
                return (
                  <li key={participant.id} className="mt-1">
                    {participant.user.username}  - <span className="font-bold text-lg text-indigo-600">{score}点</span>
                    {participant.hasAccepted && <span className="ml-2 text-sm text-blue-500">(参加承認済み)</span>}
                  </li>
                );
              })()
            ))}
          </ul>
        ) : (
          <p className="mt-2">現在、イベント参加者はいません。</p>
        )}
      </div>

      {/* イベント問題リスト (AdminViewでも表示) */}
      {event.isStarted && event.issues.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold">イベント問題リスト</h2>
          <ul className="list-disc list-inside mt-2">
            {event.issues.map((issue) => (
              <li key={issue.id} className="mt-1">{issue.problem.title} (難易度: {issue.problem.difficulty})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
