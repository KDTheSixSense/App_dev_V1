// app/(main)/event/event_list/ProblemClient.tsx
'use client';

import { useState, Fragment, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Transition, Dialog } from '@headlessui/react';
import type { イベント } from './page'; // page.tsxから型をインポート
import { EventActions } from './components/EventActions';
import { EventList } from './components/EventList';

interface ProblemClientProps {
  initialEvents: イベント[];
}

// --- モーダルコンポーネント ---
const 参加モーダル = ({ 表示中, 閉じる処理, 参加処理 }: {
  表示中: boolean;
  閉じる処理: () => void;
  参加処理: (code: string) => Promise<void>;
}) => {
  const [参加コード, set参加コード] = useState('');
  const [処理中, set処理中] = useState(false);
  const [エラー, setエラー] = useState('');

  const 送信処理 = async () => {
    if (!参加コード.trim()) {
      setエラー('参加コードを入力してください。');
      return;
    }
    set処理中(true);
    setエラー('');
    try {
      await 参加処理(参加コード);
    } catch (err) {
      setエラー(err instanceof Error ? err.message : "不明なエラーが発生しました。");
    } finally {
      set処理中(false);
    }
  };
  
  const 閉じる = () => {
    if (処理中) return;
    setエラー('');
    set参加コード('');
    閉じる処理();
  };

  return (
    <Transition appear show={表示中} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={閉じる}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30 backdrop-blur-sm" /></Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/80 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">イベントに参加</Dialog.Title>
                <div className="mt-2"><p className="text-sm text-gray-500">管理者から共有された参加コードを入力してください。</p></div>
                <div className="mt-4">
                  <input type="text" value={参加コード} onChange={(e) => set参加コード(e.target.value)} placeholder="イベントコード" className={`w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${エラー ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} />
                  {エラー && <p className="mt-2 text-sm text-red-600">{エラー}</p>}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={閉じる} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">キャンセル</button>
                  <button type="button" onClick={送信処理} disabled={処理中} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed">{処理中 ? '処理中...' : '参加する'}</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// --- イベント終了通知モーダル ---
const EventEndModal = ({
  isOpen,
  onClose,
  eventName,
  score,
}: {
  isOpen: boolean;
  onClose: () => void;
  eventName: string | null;
  score: string;
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                  イベント終了
                </Dialog.Title>
                <div className="mt-4">
                  <p className="text-md text-gray-600">イベント「<span className="font-semibold">{eventName || ' '}</span>」は終了しました。</p>
                  {score && (
                    <>
                      <p className="mt-4 text-lg">あなたの最終スコアは...</p>
                      <p className="text-center text-5xl font-bold text-indigo-600 my-4">{score}点</p>
                    </>
                  )}
                  <p className="text-md text-gray-600">お疲れ様でした！</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={onClose} className="inline-flex justify-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    閉じる
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

/**
 * タスク：イベントページのクライアントサイド全体の動作を統括します。
 */
const ProblemClient = ({ initialEvents }: ProblemClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [モーダル表示中, setモーダル表示中] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [finalScore, setFinalScore] = useState<string>('');
  const [endedEventName, setEndedEventName] = useState<string | null>(null);

  // 初回レンダリング時にのみURLパラメータをチェックする
  useEffect(() => {
    const eventEnded = searchParams.get('event_ended');
    const score = searchParams.get('score');
    const eventName = searchParams.get('eventName');

    // URLにイベント終了を示すパラメータがある場合のみモーダルを表示
    if (eventEnded === 'true' && eventName) {
      setFinalScore(score || '');
      setEndedEventName(decodeURIComponent(eventName));
      setShowEndModal(true);
      // URLからクエリパラメータを削除して、リロード時にモーダルが再表示されるのを防ぐ
      router.replace('/event/event_list', { scroll: false });
    }
  }, []); // 依存配列を空にして、コンポーネントのマウント時に一度だけ実行する

  const イベント参加処理 = async (eventCode: string) => {
    try {
      const response = await fetch('/api/event/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: eventCode }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'イベントへの参加に失敗しました。');
      }
      setモーダル表示中(false);
      router.push(`/event/event_detail/${data.data.eventId}`);
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">イベント</h1>
        
        <EventActions onJoinClick={() => setモーダル表示中(true)} />
        {/* isStartedがtrueのイベントのみをリストに表示するようにフィルタリング */}
        <EventList events={initialEvents.filter(event => event.isStarted)} />

        <参加モーダル
          表示中={モーダル表示中}
          閉じる処理={() => setモーダル表示中(false)}
          参加処理={イベント参加処理}
        />

        <EventEndModal
          isOpen={showEndModal}
          onClose={() => setShowEndModal(false)}
          eventName={endedEventName}
          score={finalScore}
        />
      </main>
    </div>
  );
};

export default ProblemClient;
