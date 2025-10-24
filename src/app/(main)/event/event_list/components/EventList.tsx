// app/(main)/event/event_list/components/EventList.tsx

import { EventCard } from './EventCard'; 

// イベントデータの型定義
type イベントデータ = {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  _count?: { participants: number };
};

/**
 * タスク：参加中のイベントのリスト全体を管理し、表示します。
 */
export const EventList = ({ events }: { events: イベントデータ[] }) => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-3 mb-8">
        参加中のイベント一覧
      </h2>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {events.map((event) => (
            <EventCard key={event.id} event={event} /> 
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">参加中のイベントがありません</h3>
          <p className="mt-1 text-sm text-gray-500">イベントに参加すると、ここに表示されます。</p>
        </div>
      )}
    </section>
  );
};
