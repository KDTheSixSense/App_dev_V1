import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

interface UpcomingEvent {
    id: number;
    title: string;
    startTime: Date | null;
    endTime: Date | null;
    creatorName: string;
    creatorIcon?: string | null;
    isStarted: boolean;
    hasBeenStarted: boolean;
    description: string;
}

interface EventCardProps {
    events?: UpcomingEvent[];
}

export default function EventCard({ events = [] }: EventCardProps) {

    const now = new Date(); // 現在時刻を取得        

    // 日付表示用のヘルパー
    const activeEvents = events.filter((event) => {
        const endDate = event.endTime ? new Date(event.endTime) : null;

        // 終了判定ロジック（前回のformatDateと同じ基準）
        // 1. 終了時刻を過ぎている
        // 2. または、フラグ的に終了している (!isStarted && hasBeenStarted)
        const isFinished = (endDate && now > endDate) || (!event.isStarted && event.hasBeenStarted);

        // 終了していないイベントだけを残す
        return !isFinished;
    });

    const formatDate = (start: Date | null, end: Date | null, isStarted: boolean, hasBeenStarted: boolean) => {
        if (!start) return '日時未定';

        const startDate = new Date(start);
        const endDate = end ? new Date(end) : null;
        const dateStr = startDate.toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        // 優先順位1: まだ時間が来ていない場合は「開催予定」
        // (フラグに関わらず、未来の日付なら予定とする)
        if (startDate > now) {
             return <span className="text-[12px] text-blue-500 font-bold">開催予定 {dateStr}</span>;
        }

        // 優先順位2: 終了時刻を過ぎている、もしくは終了フラグが立っている場合は「終了」
        // (!isStarted && hasBeenStarted) の条件も念のため残してORで繋ぎます
        if ((endDate && now > endDate) || (!isStarted && hasBeenStarted)) {
            return;
        }

        // 優先順位3: 上記以外は「開催中」
        // テキストを「開催日時」から「開催中」に変更してわかりやすくしました
        return <span className="text-[12px] text-orange-500 font-bold">開催中 {dateStr}</span>;
    };

    return (
        <div className="h-full bg-[#e0f4f9] rounded-2xl p-6 w-full">
            <h3 className="text-xl font-bold text-[#006F86] mb-4">開催が近いイベント</h3>

            {activeEvents.length === 0 ? (
                /* Empty State */
                <div className="flex items-center justify-center p-4">
                    <p className="text-slate-500 text-sm">現在、表示できるイベントはありません</p>
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto mb-4 mb-2 h-[85%] custom-scrollbar">
                    {activeEvents.map((event) => (
                        <Link key={event.id} href={`/event/event_detail/${event.id}`} className="block flex-shrink-0 !no-underline h-full">
                            <div className="flex-1 bg-white rounded-xl p-4 flex flex-col gap-4 shadow-sm w-[300px] hover:bg-slate-50 transition-colors cursor-pointer border border-slate-100">
                                {/* User Icon */}
                                <div className="flex flex-shrink-0 gap-2 items-center">
                                    <Image
                                        src={event.creatorIcon || "/images/test_icon.webp"} // デフォルト画像
                                        alt="Organizer"
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover border border-slate-200"
                                        unoptimized
                                    />
                                    <span className="text-xl font-bold text-black whitespace-nowrap">{event.creatorName}</span>
                                </div>

                                <div className="flex flex-col overflow-hidden">
                                    {/* Date / Status */}
                                    <p className="text-[10px] text-slate-500 pb-1">
                                        {formatDate(event.startTime, event.endTime, event.isStarted, event.hasBeenStarted)}
                                    </p>
                                    {/* Organizer Name & Title */}
                                    {/* User requested: OrganizerName (left) Title (right/main) */}
                                    <div className="flex items-baseline gap-2 mb-1 min-w-0">
                                        
                                        <span className="font-bold text-black text-lg border-b-2 border-slate-200 truncate leading-tight overflow-hidden flex-1">
                                            {event.title}
                                        </span>
                                        
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        <p className="ml-auto text-sm text-slate-500 line-clamp-[5]">
                                            {event.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
