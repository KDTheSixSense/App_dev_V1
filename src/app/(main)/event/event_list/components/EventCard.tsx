// app/(main)/event/event_list/components/EventCard.tsx
'use client';

import { useRouter } from 'next/navigation';
// useEffect と useState をインポートします 
import { useState, useEffect } from 'react';

// このカードが受け取るイベントデータの型を定義します
type イベントデータ = {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  _count?: { participants: number };
};

// イベントの現在状況（ステータス）を判定する関数
const イベントステータスを取得する = (開始日時: Date, 終了日時: Date): { テキスト: string; スタイル: string } => {
  const 今 = new Date();
  const 開始 = new Date(開始日時);
  const 終了 = new Date(終了日時);
  const 一日後 = new Date(今.getTime() + 24 * 60 * 60 * 1000);

  if (今 < 開始) {
    if (開始 < 一日後) {
      return { テキスト: 'まもなく開始', スタイル: 'bg-orange-100 text-orange-800' };
    }
    return { テキスト: '開催前', スタイル: 'bg-blue-100 text-blue-800' };
  } else if (今 >= 開始 && 今 <= 終了) {
    return { テキスト: '開催中', スタイル: 'bg-green-100 text-green-800 animate-pulse' };
  } else {
    return { テキスト: '終了', スタイル: 'bg-gray-100 text-gray-800' };
  }
};

// 日付と時刻を日本のロケールに合わせて整形する関数
const 日付を整形する = (日付: Date) => new Date(日付).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
const 時刻を整形する = (日付: Date) => new Date(日付).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

/**
 * タスク：単一のイベント情報をスタイリッシュなカード形式で表示します。
 */
export const EventCard = ({ event }: { event: イベントデータ }) => {
  const router = useRouter();
  
  //  Hydration Mismatch を防ぐための state を追加します 
  const [isClient, setIsClient] = useState(false);

  // この Effect はクライアントサイドでのみ実行されます
  useEffect(() => {
    setIsClient(true);
  }, []);

  const ステータス = イベントステータスを取得する(event.startTime, event.endTime);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer group"
      onClick={() => router.push(`/event/event_detail/${event.id}`)}
    >
      <div className="p-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 truncate pr-4">{event.title}</h3>
          {/* isClient が true になるまでステータスを表示しない  */}
          {isClient && (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${ステータス.スタイル}`}>
              {ステータス.テキスト}
            </span>
          )}
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          {/* 日付は通常、タイムゾーンに依存しないため、そのまま表示しても安全です */}
          <span>{日付を整形する(event.startTime )}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {/*  isClient が true になるまで時間を表示しない  */}
          {isClient ? (
            <span>{時刻を整形する(event.startTime )} ～ {時刻を整形する(event.endTime)}</span>
          ) : (
            // サーバー上、またはハイドレーション前はプレースホルダーを表示
            <span>--:-- ～ --:--</span>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span>{event._count?.participants ?? 0} 人が参加中</span>
        </div>
      </div>
    </div>
   );
};
