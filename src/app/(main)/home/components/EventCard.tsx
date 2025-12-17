import React from 'react';

export default function EventCard() {
    return (
        <div className="bg-[#e0f4f9] rounded-2xl p-6 w-full">
            <h3 className="text-xl font-bold text-[#006F86] mb-4">開催が近いイベント</h3>

            {/* Empty State */}
            <div className="flex items-center justify-center p-4">
                <p className="text-slate-500 text-sm">現在、開催が近いイベントはありません</p>
            </div>

            {/* 
            <div className="flex gap-4 overflow-x-auto pb-2">
                <div className="flex-1 bg-white rounded-full p-2 pr-6 flex items-center gap-3 shadow-sm min-w-[240px]">
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white text-[10px] text-center leading-tight overflow-hidden">
                        <span className="transform scale-75 block">○○さん<br />主催</span>
                    </div>
                    <p className="font-bold text-slate-700 text-sm truncate">イベントタイトル</p>
                </div>
                <div className="flex-1 bg-white rounded-full p-2 pr-6 flex items-center gap-3 shadow-sm min-w-[240px]">
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white text-[10px] text-center leading-tight overflow-hidden">
                        <span className="transform scale-75 block">○○さん<br />主催</span>
                    </div>
                    <p className="font-bold text-slate-700 text-sm truncate">イベントタイトル</p>
                </div>
            </div>
            */}
        </div>
    );
}
