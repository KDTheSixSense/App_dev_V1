'use client';

import { useEffect, useState, useRef } from 'react';
import { getRecentEventActivityAction } from '@/lib/actions/admin-event';
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiClock, FiArrowUp } from 'react-icons/fi';

interface ActivitySubmission {
    id: number;
    score: number | null;
    status: boolean | null;
    codeLog?: string; // Add codeLog to detect start events
    language?: string;
    submittedAt: Date;
    user: {
        id: string;
        username: string | null;
        icon: string | null;
    };
    eventIssue: {
        problem: {
            title: string;
        };
    };
}

export default function LiveActivityFeed({ eventId }: { eventId: number }) {
    const [activities, setActivities] = useState<ActivitySubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            setShowScrollTop(scrollContainerRef.current.scrollTop > 200);
        }
    };

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [newMsgIds, setNewMsgIds] = useState<Set<number>>(new Set());
    const [isRealTime, setIsRealTime] = useState(true);

    const fetchActivity = async () => {
        const res = await getRecentEventActivityAction(eventId);
        if (res.success && res.submissions) {
            const data = res.submissions as any[];
            setActivities(prev => {
                // Determine new items by comparing IDs
                const prevIds = new Set(prev.map(p => p.id));
                const newIds = new Set<number>();
                data.forEach(d => {
                    if (!prevIds.has(d.id)) {
                        newIds.add(d.id);
                    }
                });

                if (newIds.size > 0) {
                    setNewMsgIds(prevNew => {
                        const next = new Set(prevNew);
                        newIds.forEach(id => next.add(id));
                        return next;
                    });

                    // Remove highlight after 3 seconds
                    setTimeout(() => {
                        setNewMsgIds(prevNew => {
                            const next = new Set(prevNew);
                            newIds.forEach(id => next.delete(id));
                            return next;
                        });
                    }, 3000);
                }
                return data;
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        if (loading || isRealTime) {
            fetchActivity();
        }

        if (!isRealTime) return;

        const interval = setInterval(fetchActivity, 3000); // Poll every 3 seconds (Real-time feel)
        return () => clearInterval(interval);
    }, [eventId, isRealTime]);

    const getTimeAgo = (date: Date | string) => {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 5) return 'Just now'; // More granual 'now'
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const getLanguageLabel = (lang: string) => {
        if (!lang) return 'Unknown';
        const mapping: { [key: string]: string } = {
            'python': 'Python',
            'java': 'Java',
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'cpp': 'C++',
            'c': 'C',
            'csharp': 'C#',
            'php': 'PHP'
        };
        return mapping[lang.toLowerCase()] || lang.toUpperCase();
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex flex-col h-full max-h-[600px]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className={`absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 ${isRealTime ? 'animate-ping' : 'hidden'}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isRealTime ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                    </span>
                    提出された問題リスト
                </h2>
                <div
                    onClick={() => setIsRealTime(!isRealTime)}
                    className="flex items-center cursor-pointer group"
                    title={isRealTime ? "リアルタイム更新をオフにする" : "リアルタイム更新をオンにする"}
                >
                    {/* Toggle Switch */}
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${isRealTime ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isRealTime ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    {/* Label */}
                    <span className="ml-3 text-sm font-medium text-slate-600 select-none">
                        リアルタイム: <span className={`font-bold ${isRealTime ? 'text-emerald-600' : 'text-slate-500'}`}>{isRealTime ? 'ON' : 'OFF'}</span>
                    </span>
                </div>
            </div>

            <div className="relative flex-grow overflow-hidden">
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200"
                >
                    {loading && activities.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">読み込み中...</div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">最近のアクティビティはありません</div>
                    ) : (
                        <div className="relative pl-4 border-l-2 border-slate-100 ml-4 space-y-8 py-2">
                            {activities.map((activity: ActivitySubmission) => {
                                let statusBadge = null;
                                let isWorking = false;

                                // Check for "Started" event
                                const isRecentStart = (new Date().getTime() - new Date(activity.submittedAt).getTime()) < 15 * 60 * 1000; // 15 minutes

                                if (activity.codeLog === '// 解答開始') {
                                    isWorking = true;
                                    statusBadge = (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border shadow-sm bg-cyan-50 text-cyan-600 border-cyan-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                                            挑戦
                                        </span>
                                    );
                                } else if (activity.status === true) {
                                    statusBadge = (
                                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-200">
                                            正解 +{activity.score}
                                        </span>
                                    );
                                } else if ((activity.score ?? 0) > 0) {
                                    statusBadge = (
                                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-200">
                                            部分点 +{activity.score}
                                        </span>
                                    );
                                } else {
                                    statusBadge = (
                                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs font-bold border border-rose-200">
                                            不正解
                                        </span>
                                    );
                                }

                                const isNew = newMsgIds.has(activity.id);

                                return (
                                    <div key={activity.id} className={`relative pl-6 transition-all duration-500 ${isNew ? 'translate-x-0 opacity-100 bg-blue-50/50 rounded-lg -ml-2 py-2 pr-2' : 'translate-x-0 opacity-100'}`}>
                                        {/* Dot on timeline */}
                                        <div className={`absolute -left-[21px] top-3 w-3 h-3 border-2 rounded-full z-10 transition-all duration-300 ${isNew ? 'bg-blue-500 border-blue-200 scale-125' :
                                            isWorking
                                                ? 'bg-cyan-500 border-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse'
                                                : 'bg-white border-slate-300'}`}></div>

                                        <div className="flex items-start gap-4">

                                            <div className="shrink-0">
                                                {activity.user.icon ? (
                                                    <img src={activity.user.icon} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" alt="User" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                        {(activity.user.username || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs text-slate-400 font-medium font-mono">{getTimeAgo(activity.submittedAt)}</span>
                                                </div>
                                                <div className="text-sm text-slate-600 leading-snug">
                                                    <span className="font-bold text-slate-900">{activity.user.username || 'Unknown'}</span> が
                                                    {isWorking ? (
                                                        <span>問題に取り組み始めました: </span>
                                                    ) : (
                                                        <span>解答を提出しました: </span>
                                                    )}
                                                    <span className="font-bold text-slate-800">{activity.eventIssue.problem.title}</span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    {statusBadge}
                                                    {activity.language && (
                                                        <span className="inline-flex items-center bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">
                                                            {getLanguageLabel(activity.language)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="absolute bottom-8 right-8 bg-slate-800/80 hover:bg-slate-900 text-white p-2.5 rounded-full shadow-lg transition-all hover:-translate-y-1 active:scale-95 z-30 border border-white/10"
                        title="Top"
                    >
                        <FiArrowUp className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
