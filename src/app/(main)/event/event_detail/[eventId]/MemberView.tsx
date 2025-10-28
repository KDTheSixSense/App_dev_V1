// /workspaces/my-next-app/src/app/(main)/event/event_detail/[eventId]/MemberView.tsx
'use client';

import { useState, useEffect } from 'react';
import type { Prisma } from '@prisma/client';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Import useParams to get eventId for links

// page.tsxから渡されるeventの型を拡張
// イベントの主体である `Create_event` モデルに対応
type EventWithDetails = Prisma.Create_eventGetPayload<{
  include: {
    participants: {
      include: {
        user: true; // `Event_Participants` に紐づく `User` 情報を取得
      };
    };
    issues: { // `Event_Issue_List` リレーション
      include: {
        problem: true; // `Event_Issue_List` に紐づく `ProgrammingProblem` 情報を取得
      };
    };
  };
}>;

type Role = 'member' | 'guest';

// Extend EventWithDetails to include the current user's participant record and event's isStarted status
type EventWithCurrentUserParticipant = EventWithDetails & {
  isStarted?: boolean; // Assuming Create_event model has an isStarted field
  currentUserParticipant?: Prisma.Event_ParticipantsGetPayload<{
    include: { user: true };
  }> | null; // Assuming Event_Participants model has a hasAccepted field
};

interface MemberViewProps {
  event: EventWithCurrentUserParticipant;
  role: Role;
}

// New component for displaying the problem list
function EventProblemList({ eventId, issues }: { eventId: number; issues: EventWithDetails['issues'] }) {
  if (issues.length === 0) {
    return <p className="mt-4 text-gray-600">このイベントにはまだ問題がありません。</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold">イベント問題リスト</h2>
      <ul className="list-disc list-inside mt-4 space-y-2">
        {issues.map((issue) => (
          <li key={issue.id} className="bg-gray-50 p-3 rounded-md shadow-sm hover:bg-gray-100 transition-colors">
            {/* 問題解答画面へのリンク */}
            <Link href={`${eventId}/problem/${issue.problem.id}`} className="text-blue-600 hover:underline">
              {issue.problem.title} (難易度: {issue.problem.difficulty})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MemberView({ event, role }: MemberViewProps) {
  const params = useParams();
  const eventId = parseInt(params.eventId as string, 10);

  // State to manage the popup visibility and member's acceptance status
  const [showAcceptPopup, setShowAcceptPopup] = useState(false);
  const [hasMemberAccepted, setHasMemberAccepted] = useState(event.currentUserParticipant?.hasAccepted || false);
  const [isClient, setIsClient] = useState(false);

  // Hydration Mismatchを避けるため、クライアントサイドでのみisClientをtrueに設定
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // If event is started, user is a member, and hasn't accepted yet, show popup
    if (role === 'member' && event.isStarted && !hasMemberAccepted) {
      setShowAcceptPopup(true);
    } else {
      setShowAcceptPopup(false);
    }
  }, [event.isStarted, hasMemberAccepted, role]);

  const handleAcceptEventStart = async () => {
    if (!event.currentUserParticipant) {
      alert('参加者情報が見つかりません。');
      return;
    }

    try {
      // 仮のAPIエンドポイント。実際にはサーバーサイドで参加者の状態を更新するAPIを実装します。
      // PrismaスキーマにEvent_ParticipantsのhasAcceptedフィールドを追加する必要があります。
      const response = await fetch(`/api/event/${eventId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      body: JSON.stringify({ hasAccepted: true, userId: event.currentUserParticipant.userId }),
      });

      if (!response.ok) {
        throw new Error('イベント参加の承認に失敗しました。');
      }

      // 成功した場合、ローカルの状態を更新
      setHasMemberAccepted(true);
      setShowAcceptPopup(false);
      alert('イベントへの参加を承認しました！問題リストが表示されます。');
    } catch (error) {
      console.error('参加承認エラー:', error);
      alert(`参加承認中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="relative">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="mt-2 text-gray-600">{event.description}</p>

        {/* メンバー個人の獲得点数を表示 */}
        {role === 'member' && event.currentUserParticipant && (
          <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-lg font-semibold px-4 py-2 rounded-lg shadow">
            あなたのスコア: 
            <span className="ml-2 font-bold text-2xl">{event.currentUserParticipant.event_getpoint ?? 0}</span>点
          </div>
        )}
      </div>

      {role === 'member' ? (
        <>
          {event.isStarted ? (
            hasMemberAccepted ? (
              // イベントが開始され、メンバーが承認済みの場合、問題リストを表示
              <EventProblemList eventId={eventId} issues={event.issues} />
            ) : (
              // イベントは開始されたが、メンバーがまだ承認していない場合、承認を促すメッセージ
              <p className="mt-8 text-blue-600">イベントが開始されました。問題リストを見るには承認してください。</p>
            )
          ) : (
            // イベントがまだ開始されていない場合、参加人数と開始時刻を表示
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-lg font-semibold text-gray-800">イベントはまだ開始されていません。</p>
              <p className="mt-2 text-gray-600">開始までお待ちください。</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">現在の参加者:</span> {event.participants.length}人
                </p>
                {event.startTime && (
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-semibold">開始予定時刻:</span>{' '}
                    {isClient ? (
                      new Date(event.startTime).toLocaleString('ja-JP')
                    ) : (
                      '----/--/-- --:--:--' // サーバーサイドまたはハイドレーション前のプレースホルダー
                    )}
                  </p>
                )}
              </div>
            </div>

          )}
        </>
      ) : (
        <p className="mt-8 text-red-500">このイベントに参加していません。</p>
      )}

      {/* 承認ポップアップ */}
      {showAcceptPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4 text-blue-700">イベント開始のお知らせ</h2>
            <p className="text-gray-700 mb-6">
              管理者によってイベント「<span className="font-semibold">{event.title}</span>」が開始されました。
              問題リストを表示するには、以下のボタンをクリックして参加を承認してください。
            </p>
            <button
              onClick={handleAcceptEventStart}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300"
            >
              参加を承認する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
