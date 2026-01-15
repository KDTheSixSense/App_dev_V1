'use client';

import { useState, useEffect, useRef } from 'react';
import type { Prisma } from '@prisma/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiList,
  FiClock,
  FiCheck,
  FiPlay,
  FiMapPin,
  FiStar,
  FiCheckCircle,
  FiInfo,
  FiArrowUp
} from 'react-icons/fi';
import { FaTrophy } from 'react-icons/fa';
import { EVENT_THEMES } from '@/lib/constants';

export type MemberViewEvent = Prisma.Create_eventGetPayload<{
  include: {
    creator: {
      select: { username: true, icon: true };
    };
    participants: {
      include: {
        user: {
          include: {
            eventSubmissions: {
              select: {
                eventIssueId: true,
                startedAt: true,
                status: true,
              },
            },
          },
        },
      };
    };
    issues: {
      include: {
        problem: true;
      };
    };
  };
}>;

type Role = 'member';

type EventWithCurrentUserParticipant = MemberViewEvent & {
  isStarted?: boolean;
  currentUserParticipant?: Prisma.Event_ParticipantsGetPayload<{
    include: {
      user: {
        include: {
          eventSubmissions: {
            select: {
              eventIssueId: true,
              startedAt: true,
              status: true,
            },
          },
        },
      };
    };
  }> | null;
};

interface MemberViewProps {
  event: EventWithCurrentUserParticipant;
  role: Role;
}

// 日付フォーマット用ヘルパー
const formatDateParts = (dateInput: Date | string | null | undefined) => {
  if (!dateInput) return { month: '未定', day: '--', full: '開催日未定' };
  const date = new Date(dateInput);
  const month = `${date.getMonth() + 1}月`;
  const day = date.getDate().toString();
  const full = date.toLocaleString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return { month, day, full };
};

// 問題リストコンポーネント
function EventProblemList({ eventId, issues, currentUserParticipant }: {
  eventId: number;
  issues: MemberViewEvent['issues'];
  currentUserParticipant: EventWithCurrentUserParticipant['currentUserParticipant'];
}) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <FiList className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-slate-500 font-medium text-sm">問題はまだありません</p>
      </div>
    );
  }

  const submissionsMap = new Map(
    currentUserParticipant?.user.eventSubmissions.map(sub => [sub.eventIssueId, sub])
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {issues.map((issue) => {
        const submission = submissionsMap.get(issue.id);
        let statusBadge = null;
        let cardBorderClass = "border-slate-100";
        let bgClass = "bg-white";

        // Status logic for identifying bordered cards if needed (Admin view uses border-slate-100 by default and hover effects)
        // We will stick to the Admin View base style but add specific visual cues for status if strictly needed,
        // HOWEVER, the user asked for "same size/boxes" as Admin.
        // Admin View: border-slate-100 shadow-sm hover:shadow-lg hover:border-cyan-100
        // We will adapt that.

        if (submission?.status === true) {
          statusBadge = (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 ml-auto">
              <FiCheck className="w-3 h-3" /> AC
            </span>
          );
          // Optional: slight tint for solved? Admin view doesn't tint solved cards by default in specific code block I saw,
          // but keeping a subtle hint is good for UX. Let's keep it clean like Admin View mainly.
          cardBorderClass = "border-green-200 hover:border-green-300";
          bgClass = "bg-green-50/10";
        } else if (submission) {
          statusBadge = (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 ml-auto">
              挑戦中
            </span>
          );
          cardBorderClass = "border-amber-200 hover:border-amber-300";
        }

        return (
          <Link
            key={issue.id}
            href={`${eventId}/problem/${issue.problem.id}`}
            className={`relative p-5 rounded-2xl border ${cardBorderClass} ${bgClass} shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group block overflow-hidden`}
          >
            {/* Decorative accent (Same as Admin View) */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full rounded-tr-2xl -z-0"></div>

            <div className="relative z-10">
              <h3 className="font-bold text-slate-900 text-lg line-clamp-1 mb-4 group-hover:text-cyan-700 transition-colors" title={issue.problem.title}>
                {issue.problem.title}
              </h3>

              <div className="flex items-end justify-between mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-400">難易度:</span>
                  <span className="text-lg font-bold leading-none text-black">
                    {issue.problem.difficulty}
                  </span>
                </div>
                {statusBadge}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function MemberView({ event, role }: MemberViewProps) {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.eventId as string, 10);

  // Tab State
  const [activeTab, setActiveTab] = useState<'about' | 'problems'>('about');

  // Event & Layout State
  const [currentEvent, setCurrentEvent] = useState(event);
  const eventRef = useRef(currentEvent);
  useEffect(() => { eventRef.current = currentEvent; }, [currentEvent]);

  // Acceptance & Popup State
  const [showAcceptPopup, setShowAcceptPopup] = useState(false);
  const [hasMemberAccepted, setHasMemberAccepted] = useState(event.currentUserParticipant?.hasAccepted || false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Scroll to functionality for Problem List
  const problemListContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Theme logic
  const currentThemeKey = (currentEvent as any).theme || 'default';
  const currentTheme = EVENT_THEMES[currentThemeKey as keyof typeof EVENT_THEMES] || EVENT_THEMES.default;

  // Calculate dynamic style for custom theme
  const headerStyle = currentThemeKey === 'custom' && (currentEvent as any).customImagePath
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${(currentEvent as any).customImagePath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  useEffect(() => { setIsClient(true); }, []);

  // Polling Logic
  useEffect(() => {
    const pollEventStatus = async () => {
      try {
        const response = await fetch(`/api/event/${eventId}/status`);
        if (!response.ok) {
          clearInterval(intervalId);
          return;
        }
        const data = await response.json();
        setCurrentEvent(prevEvent => ({ ...prevEvent, ...data }));

        if (!data.isStarted && data.hasBeenStarted) {
          clearInterval(intervalId);
          const score = eventRef.current.currentUserParticipant?.event_getpoint ?? 0;
          const eventName = encodeURIComponent(eventRef.current.title);
          router.push(`/event/event_list?event_ended=true&score=${score}&eventName=${eventName}`);
        }
      } catch (error) {
        clearInterval(intervalId);
      }
    };
    const intervalId = setInterval(pollEventStatus, 5000);
    return () => clearInterval(intervalId);
  }, [eventId, router]);

  const isEventActive = currentEvent.isStarted && currentEvent.hasBeenStarted;

  useEffect(() => {
    if (role === 'member' && isEventActive && !hasMemberAccepted) {
      setShowAcceptPopup(true);
    } else {
      setShowAcceptPopup(false);
    }
  }, [isEventActive, hasMemberAccepted, role]);

  const handleAcceptEventStart = async () => {
    if (!currentEvent.currentUserParticipant) {
      toast.error('参加者情報が見つかりません。');
      return;
    }
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/event/${eventId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasAccepted: true, userId: currentEvent.currentUserParticipant.userId }),
      });
      if (!response.ok) throw new Error('承認失敗');
      setHasMemberAccepted(true);
      setShowAcceptPopup(false);
      setActiveTab('problems');
      toast.success('イベントに参加しました！');
    } catch (error) {
      toast.error('承認エラー');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleScroll = () => {
    if (problemListContainerRef.current) {
      setShowScrollTop(problemListContainerRef.current.scrollTop > 300);
    }
  };

  const scrollToTop = () => {
    problemListContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const otherParticipants = currentEvent.participants.filter(p => !p.isAdmin);
  const dateInfo = formatDateParts(currentEvent.startTime);

  if (!isClient) return <div className="min-h-screen bg-slate-100"></div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-12 transition-colors duration-500">

      {/* 1. Cover Area - Now Themed */}
      <div
        className={`relative h-64 md:h-80 w-full overflow-hidden shadow-sm transition-colors duration-500 ${currentThemeKey === 'custom' ? 'bg-slate-900 text-white' : `${currentTheme.class} ${currentTheme.textClass}`}`}
        style={headerStyle}
      >
        {/* Theme Pattern Overlay */}
        {currentThemeKey !== 'custom' && (
          <div className="absolute inset-0 opacity-10">
            {currentTheme.pattern === 'waves' && (
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
              </svg>
            )}
            {currentTheme.pattern === 'grid' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="grid-pattern-m" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0 40 L0 0 L40 0" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="20" cy="20" r="1.5" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern-m)" />
              </svg>
            )}
            {currentTheme.pattern === 'cubes' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="cubes-pattern-m" width="30" height="30" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1" />
                    <rect x="15" y="15" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cubes-pattern-m)" />
              </svg>
            )}
            {currentTheme.pattern === 'circles' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="circles-pattern-m" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#circles-pattern-m)" />
              </svg>
            )}
            {currentTheme.pattern === 'hexagons' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="hex-pattern-m" width="20" height="34" patternUnits="userSpaceOnUse">
                    <path d="M10 0 L20 6 L20 18 L10 24 L0 18 L0 6 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hex-pattern-m)" />
              </svg>
            )}
            {currentTheme.pattern === 'triangles' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="tri-pattern-m" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M15 0 L30 30 L0 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tri-pattern-m)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-megamendung' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-megamendung-m" width="60" height="40" patternUnits="userSpaceOnUse">
                    {/* Stylized Cloud/Mega Mendung Curves */}
                    <path d="M0 20 Q10 5 25 20 T50 20 T75 20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                    <path d="M0 25 Q10 10 25 25 T50 25 T75 25" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                    <path d="M0 15 Q10 0 25 15 T50 15 T75 15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-megamendung-m)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-aceh' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-aceh-m" width="40" height="60" patternUnits="userSpaceOnUse">
                    {/* Stylized Pintu Aceh (Aceh Door) Motif */}
                    <path d="M10 50 L10 20 Q20 10 30 20 L30 50 M10 35 L30 35 M15 50 L15 25 Q20 20 25 25 L25 50" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                    <path d="M5 55 L35 55" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                    <circle cx="20" cy="28" r="1.5" fill="currentColor" opacity="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-aceh-m)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-kawung' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-kawung-m" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M20 0 Q30 10 40 0 Q30 -10 20 0 Z M20 0 Q10 10 0 0 Q10 -10 20 0 Z M20 0 Q30 10 20 20 Q10 10 20 0 Z M20 40 Q30 30 20 20 Q10 30 20 40 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                    <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.3" />
                    <path d="M0 20 Q10 30 0 40 M40 20 Q30 30 40 40 M0 20 Q10 10 0 0 M40 20 Q30 10 40 0" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-kawung-m)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-parang' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-parang-m" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <path d="M0 10 Q10 0 20 10 T40 10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                    <path d="M0 30 Q10 20 20 30 T40 30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                    <circle cx="10" cy="18" r="3" fill="currentColor" opacity="0.4" />
                    <circle cx="30" cy="18" r="3" fill="currentColor" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-parang-m)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-truntum' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-truntum-m" width="40" height="40" patternUnits="userSpaceOnUse">
                    {/* Stylized Star/Flower for Truntum */}
                    <path d="M20 5 L23 15 L33 15 L25 22 L28 32 L20 27 L12 32 L15 22 L7 15 L17 15 Z" fill="currentColor" opacity="0.4" />
                    <circle cx="20" cy="20" r="2" fill="white" />
                    <path d="M5 5 L10 10 M35 5 L30 10 M5 35 L10 30 M35 35 L30 30" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-truntum-m)" />
              </svg>
            )}
          </div>
        )}

        {/* Header Content Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl -mt-16 relative z-10 text-left">
        {/* 2. Header Info Card */}
        <div className="bg-white rounded-xl shadow-md border-b border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Date Box */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center overflow-hidden text-center">
                  <div className="w-full bg-sky-500 text-white text-xs font-bold py-1 uppercase tracking-wide">
                    {dateInfo.month}
                  </div>
                  <div className="flex-grow flex items-center justify-center">
                    <span className="text-3xl md:text-4xl font-extrabold text-slate-800">{dateInfo.day}</span>
                  </div>
                </div>
              </div>

              {/* Title & Host Info */}
              <div className="flex-grow pt-1">
                <div className="text-sm font-bold text-sky-600 mb-1 uppercase tracking-wide">{dateInfo.full}</div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
                  {currentEvent.title}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-slate-500 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <p>主催:</p>
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      {currentEvent.creator?.icon ? (
                        <img src={currentEvent.creator.icon} className="w-6 h-6 rounded-full object-cover" alt="host" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                          {(currentEvent.creator?.username ?? 'C').charAt(0)}
                        </div>
                      )}
                      <span>{currentEvent.creator?.username ?? '不明なユーザー'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border shadow-sm transition-colors cursor-default ${hasMemberAccepted
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-white text-slate-600 border-slate-300'
                }`}>
                {hasMemberAccepted ? <FiCheckCircle /> : <FiStar />}
                {isEventActive
                  ? (hasMemberAccepted ? '参加中' : '開始準備完了')
                  : '参加予定'}
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-sm font-bold">
              {!currentEvent.hasBeenStarted ? (
                <span className="text-orange-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> 開始待ち</span>
              ) : isEventActive ? (
                <span className="text-green-600 flex items-center gap-1.5 animate-pulse"><span className="w-2 h-2 rounded-full bg-green-500"></span> 開催中</span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span> 終了</span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Main Content Layout (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* Left Column (Main Content) - Width 2/3 */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 relative">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('about')}
                  className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${activeTab === 'about'
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  詳細
                </button>
                <button
                  onClick={() => setActiveTab('problems')}
                  className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${activeTab === 'problems'
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  問題
                </button>
              </div>

              <div className="p-8 min-h-[300px]">
                {activeTab === 'about' && (
                  <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <FiInfo className="text-sky-500" /> イベント詳細
                    </h2>

                    <div className="prose prose-slate max-w-none text-slate-600 leading-loose">
                      {currentEvent.description ? (
                        <p className="whitespace-pre-wrap text-base border-l-4 border-sky-500 pl-4">{currentEvent.description}</p>
                      ) : (
                        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p>詳細な説明はありません。</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-10 bg-sky-50/50 border-l-4 border-sky-500 rounded-r-xl p-6 shadow-sm">
                      <div className="flex gap-4">
                        <div className="bg-white p-2 rounded-full shadow-sm text-sky-600 h-fit">
                          <FiCheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 mb-1">イベントルール</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            このイベントはポイント制です。問題を解くことでスコアが加算され、リアルタイムでランキングが変動します。
                            公平な競争を心がけ、楽しんで参加してください！
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'problems' && (
                  <div className="animate-in fade-in slide-in-from-right-2 duration-300 relative">
                    {isEventActive ? (
                      hasMemberAccepted ? (
                        <>
                          <div className="flex justify-between items-end mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                              <FiList className="text-sky-500" /> 問題一覧
                            </h2>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                              全 {currentEvent.issues.length} 問
                            </span>
                          </div>
                          {/* Scrollable Container with Fixed Height & Custom Scrollbar */}
                          <div
                            ref={problemListContainerRef}
                            onScroll={handleScroll}
                            className="max-h-[450px] overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
                          >
                            <EventProblemList
                              eventId={eventId}
                              issues={currentEvent.issues}
                              currentUserParticipant={currentEvent.currentUserParticipant}
                            />
                          </div>

                          {/* Scroll To Top Button */}
                          {showScrollTop && (
                            <button
                              onClick={scrollToTop}
                              className="absolute bottom-6 right-6 bg-slate-800/80 hover:bg-slate-900 text-white p-3 rounded-full shadow-lg transition-all hover:-translate-y-1 active:scale-95 z-20"
                              title="上へ戻る"
                            >
                              <FiArrowUp className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-10 min-h-[300px]">
                          <p className="text-slate-500 mb-4">イベントが開始されました！参加して問題を表示しましょう。</p>
                          <button
                            onClick={() => setShowAcceptPopup(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm transition-transform active:scale-95"
                          >
                            今すぐ参加する
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 min-h-[300px]">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <FiClock className="w-8 h-8" />
                        </div>
                        <p className="font-medium">イベント開始まで問題は表示されません。</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar) - Width 1/3 */}
          <div className="lg:col-span-1 space-y-6 sticky top-24 h-fit">

            {/* Score Card (Only shown if member) - Now displayed FIRST */}
            {role === 'member' && currentEvent.currentUserParticipant && (
              <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl shadow-md p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 duration-500">
                  <FaTrophy className="w-24 h-24 -rotate-12 text-white" />
                </div>

                <div className="relative z-10 flex items-center gap-5">
                  {/* User Icon */}
                  <div className="w-16 h-16 rounded-full border-2 border-white/40 bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {currentEvent.currentUserParticipant.user.icon ? (
                      <img src={currentEvent.currentUserParticipant.user.icon} className="w-full h-full object-cover" alt="User" />
                    ) : (
                      <span className="font-bold text-2xl text-white">{currentEvent.currentUserParticipant.user.username?.charAt(0)}</span>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-blue-50 uppercase tracking-wider mb-1 drop-shadow-sm">あなたのスコア</p>
                    <p className="text-5xl font-black tracking-tight leading-none text-white drop-shadow-md">
                      {currentEvent.currentUserParticipant.event_getpoint ?? 0}
                      <span className="text-lg font-normal text-blue-100 ml-2">点</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Event Details Card - Now displayed SECOND */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <ul className="space-y-6">
                <li className="flex items-start gap-5">
                  <FiUsers className="w-6 h-6 text-sky-500 mt-1" />
                  <div>
                    <p className="text-lg font-bold text-slate-700 leading-tight">
                      {otherParticipants.length}人
                    </p>
                    <p className="text-sm text-slate-500 mt-1">参加者</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 承認ポップアップ */}
      {
        showAcceptPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">イベント開始のお知らせ</h3>
                <FiCheckCircle className="text-green-500 w-5 h-5" />
              </div>
              <div className="p-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiPlay className="w-8 h-8 text-blue-600 ml-1" />
                </div>
                <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">準備はいいですか？</h2>
                <p className="text-center text-slate-500 mb-6">
                  イベント「<span className="font-semibold text-slate-800">{currentEvent.title}</span>」が開始されました。今すぐ参加して問題に挑戦しましょう！
                </p>
                <button
                  onClick={handleAcceptEventStart}
                  disabled={isAccepting}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAccepting ? '処理中...' : 'イベントに参加する'}
                </button>
                <button
                  onClick={() => setShowAcceptPopup(false)}
                  className="w-full mt-3 py-2 text-slate-400 text-sm font-semibold hover:text-slate-600"
                >
                  詳細を確認する
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
