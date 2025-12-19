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
    // 日付表示用のヘルパー
    const formatDate = (start: Date | null, end: Date | null, isStarted: boolean, hasBeenStarted: boolean) => {
        if (!start) return '日時未定';

        const startDate = new Date(start);
        const dateStr = startDate.toLocaleDateString();

        // フラグベースのステータス判定
        // 開催中: isStarted === true
        if (isStarted) {
            return <span className="text-orange-500 font-bold">開催中 ({dateStr}〜)</span>;
        }

        // 終了: isStarted === false && hasBeenStarted === true
        if (!isStarted && hasBeenStarted) {
            return <span className="text-slate-400">終了 ({dateStr})</span>;
        }

        // 開催予定: isStarted === false && hasBeenStarted === false
        return `${dateStr} 開催予定`;
    };

    return (
        <div className="h-full bg-[#e0f4f9] rounded-2xl p-6 w-full">
            <h3 className="text-xl font-bold text-[#006F86] mb-4">開催が近いイベント</h3>

            {events.length === 0 ? (
                /* Empty State */
                <div className="flex items-center justify-center p-4">
                    <p className="text-slate-500 text-sm">現在、表示できるイベントはありません</p>
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto mb-4 mb-2 h-[90%] custom-scrollbar">
                    {events.map((event) => (
                        <Link key={event.id} href={`/event/event_detail/${event.id}`} className="block flex-shrink-0 !no-underline h-[90%]">
                            <div className="flex-1 bg-white rounded-xl p-4 flex flex-col gap-4 shadow-sm h-full min-w-[300px] hover:bg-slate-50 transition-colors cursor-pointer border border-slate-100">
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
                                    <p className="text-[10px] text-slate-500">
                                        {formatDate(event.startTime, event.endTime, event.isStarted, event.hasBeenStarted)}
                                    </p>
                                    {/* Organizer Name & Title */}
                                    {/* User requested: OrganizerName (left) Title (right/main) */}
                                    <div className="flex items-baseline gap-2 mb-1">
                                        
                                        <span className="font-bold text-black text-lg border-b-2 border-slate-200 truncate leading-tight">
                                            {event.title}
                                        </span>
                                        
                                    </div>
                                    <div className="text-sm text-slate-600 overflow-hidden text-ellipsis max-h-12">
                                        <span className="ml-auto text-sm text-slate-500">
                                            {event.description}
                                        </span>
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
