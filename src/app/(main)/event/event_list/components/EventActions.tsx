// app/(main)/event/event_list/components/EventActions.tsx
'use client';

import { useRouter } from 'next/navigation';

interface EventActionsProps {
  onJoinClick: () => void;
}

/**
 * タスク：ユーザーが次に行う主要なアクション（参加・作成）を提示します。
 */
export const EventActions = ({ onJoinClick }: EventActionsProps) => {
  const router = useRouter();

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
      <div 
        onClick={onJoinClick}
        className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-500 transition-colors duration-300 cursor-pointer"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-3">イベントに参加する</h2>
        <p className="text-gray-600 mb-6">共有された参加コードを使って、既存のイベントに参加します。</p>
      </div>
      <div 
        onClick={() => router.push("/event/admin/create_event")} 
        className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:border-teal-500 transition-colors duration-300 cursor-pointer"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-3">イベントを作成する</h2>
        <p className="text-gray-600 mb-6">新しいイベントを作成し、ユニークな参加コードを発行します。</p>
      </div>
    </section>
  );
};
