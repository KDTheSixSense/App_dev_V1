// /workspaces/my-next-app/src/app/(main)/event/event_detail/[eventId]/AdminView.tsx
'use client';

import { toggleEventStatusAction, deleteEventAction, updateEventThemeAction, uploadEventBackgroundAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react'; // Import useState for local state management
import type { Prisma } from '@prisma/client'; // Import Prisma namespace for types
import toast from 'react-hot-toast';
import { FiCopy, FiPlay, FiStopCircle, FiTrash2, FiUsers, FiList, FiCheck, FiCheckCircle, FiStar, FiClock, FiImage, FiArrowUp, FiUpload, FiEye, FiAlertTriangle, FiXCircle, FiMinus, FiCode, FiCpu, FiDatabase, FiTerminal, FiDownload, FiRotateCw, FiUser, FiChevronLeft, FiX } from 'react-icons/fi'; // Icons for better UI
import { FaCrown, FaTrophy, FaMedal, FaPython, FaJs } from 'react-icons/fa';
import { getSubmissionDetailAction, getParticipantSubmissionsAction } from '@/lib/actions/admin-event';
import LiveActivityFeed from './LiveActivityFeed';
import { EVENT_THEMES } from '@/lib/constants';

// イベント詳細データの型定義
// イベントの主体である `Create_event` モデルに対応（participants, issuesを含む）
type EventWithDetails = Prisma.Create_eventGetPayload<{
  include: {
    creator: {
      select: { username: true, icon: true };
    };
    participants: {
      include: {
        user: {
          include: {
            // ユーザーに紐づくイベント提出情報を取得
            eventSubmissions: true;
          };
        };
      };
    };
    issues: {
      include: {
        problem: true; // `Event_Issue_List` に紐づく `ProgrammingProblem` 情報を取得
      };
    };
  };
}>;





// 日付フォーマット用ヘルパー
const formatDateParts = (dateInput: Date | string | null | undefined) => {
  if (!dateInput) return { month: '未定', day: '--', full: '開催日未定' };
  const date = new Date(dateInput);
  const month = `${date.getMonth() + 1}月`;
  const day = date.getDate().toString();
  const full = date.toLocaleString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return { month, day, full };
};

interface AdminViewProps {
  event: EventWithDetails & { isStarted?: boolean }; // isStartedを追加
}

export default function AdminView({ event: initialEvent }: AdminViewProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [event, setEvent] = useState(initialEvent);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Submission View State
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  // Participant Submissions List State
  const [selectedParticipantSubmissions, setSelectedParticipantSubmissions] = useState<any>(null);
  const [participantSubmissionsModalOpen, setParticipantSubmissionsModalOpen] = useState(false);
  const [loadingParticipantSubmissions, setLoadingParticipantSubmissions] = useState(false);

  // Scroll Refs & State
  const participantsListRef = useRef<HTMLDivElement>(null);
  const problemsListRef = useRef<HTMLDivElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTopParticipants, setShowScrollTopParticipants] = useState(false);
  const [showScrollTopProblems, setShowScrollTopProblems] = useState(false);
  const [showScrollTopCode, setShowScrollTopCode] = useState(false);
  const handleOpenSubmission = async (submissionId: number) => {
    setLoadingSubmission(true);
    setSubmissionModalOpen(true);
    setSelectedSubmission(null);
    try {
      const res = await getSubmissionDetailAction(submissionId);
      if (res.success) {
        setSelectedSubmission(res.submission);
      } else {
        toast.error('詳細の取得に失敗しました');
        setSubmissionModalOpen(false);
      }
    } catch (error) {
      toast.error('エラーが発生しました');
      setSubmissionModalOpen(false);
    } finally {
      setLoadingSubmission(false);
      // Reset scroll position for code container
      setTimeout(() => {
        codeContainerRef.current?.scrollTo({ top: 0 });
        setShowScrollTopCode(false);
      }, 100);
    }
  };

  const handleOpenParticipantSubmissions = async (userId: string) => {
    setLoadingParticipantSubmissions(true);
    setParticipantSubmissionsModalOpen(true);
    setSelectedParticipantSubmissions(null);

    // Check if event.id exists. event prop is EventWithDetails which has id
    if (!event?.id) return;

    try {
      const res = await getParticipantSubmissionsAction(event.id, userId);
      if (res.success) {
        setSelectedParticipantSubmissions(res.submissions);
      } else {
        toast.error('履歴の取得に失敗しました');
      }
    } catch (error) {
      toast.error('エラーが発生しました');
    } finally {
      setLoadingParticipantSubmissions(false);
    }
  };

  const handleCloseSubmissionModal = () => {
    setSubmissionModalOpen(false);
    setSelectedSubmission(null);
    setShowScrollTopCode(false);
  };

  const handleCloseParticipantSubmissionsModal = () => {
    setParticipantSubmissionsModalOpen(false);
    setSelectedParticipantSubmissions(null);
  };

  const handleScrollParticipants = () => {
    if (participantsListRef.current) {
      setShowScrollTopParticipants(participantsListRef.current.scrollTop > 200);
    }
  };

  const handleScrollProblems = () => {
    if (problemsListRef.current) {
      setShowScrollTopProblems(problemsListRef.current.scrollTop > 200);
    }
  };

  const handleScrollCode = () => {
    if (codeContainerRef.current) {
      setShowScrollTopCode(codeContainerRef.current.scrollTop > 300);
    }
  };

  const scrollToTopParticipants = () => {
    participantsListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTopProblems = () => {
    problemsListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTopCode = () => {
    codeContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Background Settings Handler
  const handleBackgroundSettings = () => {
    setIsThemeModalOpen(true);
  };

  const handleThemeChange = async (themeKey: string) => {
    // Optimistic update
    const previousTheme = (event as any).theme;
    setEvent(prev => ({ ...prev, theme: themeKey }));
    setIsThemeModalOpen(false);
    toast.success('テーマを変更しました');

    try {
      const result = await updateEventThemeAction(event.id, themeKey);
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      // Revert on error
      setEvent(prev => ({ ...prev, theme: previousTheme }));
      toast.error('テーマの更新に失敗しました');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ファイルサイズは5MB以下にしてください');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('画像をアップロード中...');
    setIsThemeModalOpen(false);

    try {
      const result = await uploadEventBackgroundAction(event.id, formData);
      if (result.error) {
        throw new Error(result.error);
      }

      setEvent(prev => ({
        ...prev,
        theme: 'custom',
        customImagePath: result.imagePath ?? null
      }));
      toast.success('背景画像をアップロードしました', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('画像のアップロードに失敗しました', { id: toastId });
    }
  };

  // Theme logic
  const currentThemeKey = (event as any).theme || 'default';
  const currentTheme = EVENT_THEMES[currentThemeKey as keyof typeof EVENT_THEMES] || EVENT_THEMES.default;

  // Calculate dynamic style for custom theme
  const headerStyle = currentThemeKey === 'custom' && (event as any).customImagePath
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${(event as any).customImagePath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;
  const dateInfo = formatDateParts(event.startTime);

  useEffect(() => {
    setIsClient(true);
  }, []);

  //管理者とその他の参加者を分類
  const eventCreator = event.participants.find(p => p.isAdmin);
  const otherParticipants = event.participants.filter(p => !p.isAdmin);

  // 参加者を獲得点数の降順でソート
  const sortedParticipants = [...otherParticipants].sort((a, b) => {
    const scoreA = a.event_getpoint ?? 0;
    const scoreB = b.event_getpoint ?? 0;
    return scoreB - scoreA; // 降順
  });

  const filteredParticipants = sortedParticipants.filter(p =>
    (p.user.username ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  //イベント開始処理
  const handleStartEvent = async () => {
    if (!confirm('イベントを開始しますか？')) return;
    setIsSubmitting(true);
    try {
      const result = await toggleEventStatusAction(event.id, true);
      if (result.error) throw new Error(result.error);
      setEvent(prev => ({ ...prev, isStarted: true, hasBeenStarted: true, startTime: new Date() }));
      toast.success('イベントを開始しました！');
    } catch (error) {
      console.error('イベント開始エラー:', error);
      toast.error(`イベント開始中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  //イベント終了処理
  const handleEndEvent = async () => {
    if (!confirm('イベントを終了しますか？参加者は問題を見ることができなくなります。')) return;
    setIsSubmitting(true);
    try {
      const result = await toggleEventStatusAction(event.id, false);
      if (result.error) throw new Error(result.error);
      setEvent(prev => ({ ...prev, isStarted: false }));
      toast.success('イベントを終了しました。');
    } catch (error) {
      console.error('イベント終了エラー:', error);
      toast.error(`イベント終了中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  //イベント削除処理
  const handleDeleteEvent = async () => {
    if (!confirm('本当にこのイベントを削除しますか？\nこの操作は元に戻すことができません。')) return;
    setIsSubmitting(true);
    try {
      const result = await deleteEventAction(event.id);
      if (result.error) throw new Error(result.error);
      toast.success('イベントを削除しました。');
      router.push('/event/event_list');
    } catch (error) {
      console.error('イベント削除エラー:', error);
      toast.error(`イベントの削除中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  //招待コードコピー機能
  const handleCopyInviteCode = () => {
    if (!event.inviteCode) return;
    navigator.clipboard.writeText(event.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);// 2秒後に表示を元に戻す
      toast.success('招待コードをコピーしました');
    });
  };

  if (!isClient) return <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center text-gray-400">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 text-slate-800 font-sans pb-12">

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
                  <pattern id="grid-pattern-a" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0 40 L0 0 L40 0" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="20" cy="20" r="1.5" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern-a)" />
              </svg>
            )}
            {currentTheme.pattern === 'cubes' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="cubes-pattern-a" width="30" height="30" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1" />
                    <rect x="15" y="15" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cubes-pattern-a)" />
              </svg>
            )}
            {currentTheme.pattern === 'circles' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="circles-pattern-a" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#circles-pattern-a)" />
              </svg>
            )}
            {currentTheme.pattern === 'hexagons' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="hex-pattern-a" width="20" height="34" patternUnits="userSpaceOnUse">
                    <path d="M10 0 L20 6 L20 18 L10 24 L0 18 L0 6 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hex-pattern-a)" />
              </svg>
            )}
            {currentTheme.pattern === 'triangles' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="tri-pattern-a" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M15 0 L30 30 L0 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tri-pattern-a)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-megamendung' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-megamendung-a" width="60" height="40" patternUnits="userSpaceOnUse">
                    {/* Stylized Cloud/Mega Mendung Curves */}
                    <path d="M0 20 Q10 5 25 20 T50 20 T75 20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                    <path d="M0 25 Q10 10 25 25 T50 25 T75 25" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                    <path d="M0 15 Q10 0 25 15 T50 15 T75 15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-megamendung-a)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-aceh' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-aceh-a" width="40" height="60" patternUnits="userSpaceOnUse">
                    {/* Stylized Pintu Aceh (Aceh Door) Motif */}
                    <path d="M10 50 L10 20 Q20 10 30 20 L30 50 M10 35 L30 35 M15 50 L15 25 Q20 20 25 25 L25 50" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                    <path d="M5 55 L35 55" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                    <circle cx="20" cy="28" r="1.5" fill="currentColor" opacity="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-aceh-a)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-kawung' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-kawung-a" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M20 0 Q30 10 40 0 Q30 -10 20 0 Z M20 0 Q10 10 0 0 Q10 -10 20 0 Z M20 0 Q30 10 20 20 Q10 10 20 0 Z M20 40 Q30 30 20 20 Q10 30 20 40 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                    <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.3" />
                    <path d="M0 20 Q10 30 0 40 M40 20 Q30 30 40 40 M0 20 Q10 10 0 0 M40 20 Q30 10 40 0" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-kawung-a)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-parang' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-parang-a" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <path d="M0 10 Q10 0 20 10 T40 10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                    <path d="M0 30 Q10 20 20 30 T40 30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                    <circle cx="10" cy="18" r="3" fill="currentColor" opacity="0.4" />
                    <circle cx="30" cy="18" r="3" fill="currentColor" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-parang-a)" />
              </svg>
            )}
            {currentTheme.pattern === 'batik-truntum' && (
              <svg className="h-full w-full" width="100%" height="100%">
                <defs>
                  <pattern id="batik-truntum-a" width="40" height="40" patternUnits="userSpaceOnUse">
                    {/* Stylized Star/Flower for Truntum */}
                    <path d="M20 5 L23 15 L33 15 L25 22 L28 32 L20 27 L12 32 L15 22 L7 15 L17 15 Z" fill="currentColor" opacity="0.4" />
                    <circle cx="20" cy="20" r="2" fill="white" />
                    <path d="M5 5 L10 10 M35 5 L30 10 M5 35 L10 30 M35 35 L30 30" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#batik-truntum-a)" />
              </svg>
            )}
          </div>
        )}

        {/* Header Content Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-[95%] 2xl:max-w-screen-2xl -mt-16 relative z-10">

        {/* 2. Header Info Card */}
        {/* 2. Header Info Card */}
        <div className="bg-white rounded-xl shadow-md border-b border-slate-200 overflow-hidden mb-10 relative">
          <div className="p-10 md:p-12 relative">
            {/* Admin Badge - Top Right */}
            <div className="absolute top-6 right-6 md:top-8 md:right-8">
              <span className="bg-cyan-50 text-cyan-600 text-[10px] sm:text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm border border-cyan-100">
                Admin
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Top Label */}
              <div className="text-sm font-bold text-cyan-600 tracking-wide">
                イベント管理
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-1">
                {event.title}
              </h1>

              {/* Date Line with Separator (Restored) */}
              <div className="flex items-center gap-3 text-slate-400 font-medium mb-2 text-sm md:text-base">
                <div className="w-1.5 h-6 bg-cyan-400 rounded-full shadow-sm"></div>
                <span className="text-slate-500 font-bold">
                  イベント {event.startTime ? `${new Date(event.startTime).getMonth() + 1}月${new Date(event.startTime).getDate()}` : '--'}
                  {/* 仮に終了日があれば表示、なければ開始日のみ */}
                  {(event as any).endTime && (
                    ` - ${new Date((event as any).endTime).getMonth() + 1}月${new Date((event as any).endTime).getDate()}`
                  )}
                </span>
              </div>

              {/* Metadata Row: Creator & Invite Code */}
              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8 mt-4 pt-4 border-t border-slate-100 md:border-0 md:pt-0">

                {/* Creator */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">作成者</span>
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    {event.creator?.icon ? (
                      <img src={event.creator.icon} className="w-6 h-6 rounded-full object-cover shadow-sm" alt="host" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                        {(event.creator?.username ?? 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{event.creator?.username ?? 'Unknown Creator'}</span>
                  </div>
                </div>

                {/* Invite Code */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">招待コード</span>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-bold text-base border border-slate-200">
                      {event.inviteCode}
                    </code>
                    <button
                      onClick={handleCopyInviteCode}
                      className="text-slate-400 hover:text-cyan-600 transition-colors p-1.5 hover:bg-slate-50 rounded-lg"
                      title="コピー"
                    >
                      {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Description removed as per user request */}
            </div>
          </div>

          {/* Action Bar (Status & Controls) */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col-reverse md:flex-row items-center justify-between gap-4">

            {/* Left: Status Badge (Matching Image) */}
            <div className="flex items-center w-full md:w-auto">
              {!event.hasBeenStarted ? (
                <span className="flex items-center gap-2 text-orange-500 font-bold bg-orange-50 px-3 py-1.5 rounded-full text-sm border border-orange-100 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  開始待ち
                </span>
              ) : event.isStarted ? (
                <span className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full text-sm border border-emerald-100 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  開催中
                </span>
              ) : (
                <span className="flex items-center gap-2 text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-full text-sm border border-slate-200 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  終了
                </span>
              )}
            </div>

            {/* Right: Admin Actions */}
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
              {/* Background Settings Button */}
              <button
                onClick={handleBackgroundSettings}
                className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-cyan-600 hover:border-cyan-300 rounded-xl font-bold text-sm md:text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
              >
                <FiImage className="w-5 h-5" /> <span className="hidden sm:inline">背景設定</span>
              </button>

              {!event.hasBeenStarted ? (
                <button onClick={handleStartEvent} disabled={isSubmitting} className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-8 py-3 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl font-bold text-sm md:text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-95">
                  <FiPlay className="w-5 h-5" /> <span className="hidden sm:inline">イベントを開始</span><span className="sm:hidden">開始</span>
                </button>
              ) : event.isStarted ? (
                <button onClick={handleEndEvent} disabled={isSubmitting} className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-8 py-3 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 rounded-xl font-bold text-sm md:text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-95">
                  <FiStopCircle className="w-5 h-5" /> <span className="hidden sm:inline">イベントを終了</span><span className="sm:hidden">終了</span>
                </button>
              ) : (
                <span className="flex items-center gap-2.5 px-6 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm md:text-base border border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-2"></span>
                  終了
                </span>
              )}

              <button onClick={handleDeleteEvent} disabled={isSubmitting} className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 rounded-xl font-bold text-sm md:text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-95" title="削除">
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Participants Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-100 p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-cyan-600 ml-1" />
                参加者一覧 <span className="text-slate-500 font-medium ml-1">({otherParticipants.length})</span>
              </h2>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 w-48 transition-all group-hover:w-56"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-cyan-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
              </div>
            </div>



            {filteredParticipants.length > 0 ? (
              <div className="relative flex-grow flex flex-col h-[500px]">
                <div className="overflow-auto border border-slate-200 rounded-t-xl scrollbar-thin scrollbar-thumb-slate-300">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50 text-slate-500 text-sm font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm border-y border-slate-200">
                      <tr>
                        <th className="py-5 px-6 text-center w-28">順位</th>
                        <th className="py-5 px-6 min-w-[240px]">参加者</th>
                        <th className="py-5 px-6 text-center w-32">スコア</th>
                        {event.issues.map((issue, index) => (
                          <th key={issue.id} className="py-5 px-2 text-center w-[120px] min-w-[120px] group relative cursor-help hover:bg-slate-100 transition-colors" title={issue.problem.title}>
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">PROB {index + 1}</span>
                              <span className="text-sm font-bold text-slate-700 w-full truncate px-1 block">{issue.problem.title}</span>
                            </div>

                            {/* Detailed Tooltip */}
                            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg mb-2 shadow-xl whitespace-nowrap z-50 pointer-events-none transition-opacity duration-200 font-normal normal-case">
                              {issue.problem.title}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-t-4 border-t-slate-800 border-x-4 border-x-transparent w-0 h-0"></div>
                            </div>
                          </th>
                        ))}
                        <th className="py-5 px-6 text-center w-32">提出数</th>

                        <th className="py-5 px-6 text-center w-24">詳細</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                      {filteredParticipants.map((participant) => {
                        const rank = sortedParticipants.findIndex(p => (p.event_getpoint ?? 0) === (participant.event_getpoint ?? 0)) + 1;

                        // Rank Styling - Professional Badges
                        let rowClass = "hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0";
                        let rankBadge = <span className="font-bold text-slate-500 text-lg w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full mx-auto">{rank}</span>;

                        if (rank === 1) {
                          rowClass += " bg-yellow-50/30"; // Very subtle highlight for #1
                          rankBadge = (
                            <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
                              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[2px] opacity-20"></div>
                              <FaTrophy className="w-6 h-6 text-yellow-500 drop-shadow-sm relative z-10" />
                              <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 rounded-full border-2 border-white shadow-sm">1</div>
                            </div>
                          );
                        } else if (rank === 2) {
                          rankBadge = (
                            <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
                              <FaMedal className="w-6 h-6 text-slate-400 drop-shadow-sm" />
                              <div className="absolute -top-1 -right-1 bg-slate-400 text-white text-[10px] font-bold px-1.5 rounded-full border-2 border-white shadow-sm">2</div>
                            </div>
                          );
                        } else if (rank === 3) {
                          rankBadge = (
                            <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
                              <FaMedal className="w-6 h-6 text-amber-600 drop-shadow-sm" />
                              <div className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold px-1.5 rounded-full border-2 border-white shadow-sm">3</div>
                            </div>
                          );
                        }

                        return (
                          <tr key={participant.id} className={rowClass}>
                            {/* Rank */}
                            <td className="py-6 px-6 text-center align-middle">
                              <div className="transform scale-110 origin-center">
                                {rankBadge}
                              </div>
                            </td>

                            {/* Participant */}
                            <td className="py-6 px-6 align-middle">
                              <div className="flex items-center gap-5">
                                <div className="relative shrink-0">
                                  {participant.user.icon ? (
                                    <img src={participant.user.icon} alt={participant.user.username || 'User'} className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-md" />
                                  ) : (
                                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg border-4 border-white shadow-md">
                                      {(participant.user.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  {rank === 1 && <div className="absolute -bottom-1 -right-1 bg-yellow-400 w-5 h-5 rounded-full border-2 border-white shadow-sm"></div>}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <div className="font-bold text-slate-900 text-base">{participant.user.username || 'Unknown'}</div>
                                  <div className="text-sm text-slate-500 font-medium">@{participant.user.username}</div>
                                </div>
                              </div>
                            </td>

                            {/* Score */}
                            <td className="py-6 px-6 text-center font-black text-2xl text-slate-800 align-middle">
                              {participant.event_getpoint ?? 0}
                            </td>

                            {/* Problem Columns */}
                            {event.issues.map((issue) => {
                              const submission = (participant.user as any).eventSubmissions?.find((s: any) => s.eventIssueId === issue.id);

                              let content = (
                                <div className="w-full h-16 flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                </div>
                              );

                              if (submission) {
                                if (submission.status === true) {
                                  // Accepted
                                  content = (
                                    <div className="w-full h-16 flex flex-col items-center justify-center relative bg-emerald-50 rounded-xl border border-emerald-100">
                                      <FiCheckCircle className="w-7 h-7 text-emerald-500 drop-shadow-sm" />
                                      <span className="text-xs font-black text-emerald-600 mt-1">{submission.score}</span>
                                    </div>
                                  );
                                } else if ((submission.score ?? 0) > 0) {
                                  // Partial
                                  content = (
                                    <div className="w-full h-16 flex flex-col items-center justify-center relative bg-amber-50 rounded-xl border border-amber-100">
                                      <FiAlertTriangle className="w-7 h-7 text-amber-500 drop-shadow-sm" />
                                      <span className="text-xs font-black text-amber-600 mt-1">{submission.score}</span>
                                    </div>
                                  );
                                } else {
                                  // Wrong
                                  content = (
                                    <div className="w-full h-16 flex flex-col items-center justify-center relative bg-rose-50 rounded-xl border border-rose-100">
                                      <FiXCircle className="w-7 h-7 text-rose-500 drop-shadow-sm" />
                                      <span className="text-xs font-black text-rose-600 mt-1">0</span>
                                    </div>
                                  );
                                }
                              }

                              return (
                                <td key={issue.id} className="p-1 align-middle border-l border-slate-50 last:border-r">
                                  {content}
                                </td>
                              );
                            })}

                            {/* Submissions */}
                            <td className="py-6 px-6 text-center align-middle">
                              <div className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-100 rounded-full font-mono text-sm font-bold text-slate-600">
                                {(participant.user as any).eventSubmissions?.length || 0}回
                              </div>
                            </td>



                            {/* Actions */}
                            <td className="py-6 px-6 text-center align-middle">
                              <button
                                onClick={() => handleOpenParticipantSubmissions(participant.user.id)}
                                className="group bg-white border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 text-slate-500 hover:text-cyan-700 px-4 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-95 mx-auto gap-2 font-bold text-sm"
                                title="提出履歴を見る"
                              >
                                <span>View</span>
                                <FiChevronLeft className="w-4 h-4 rotate-180" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2"><FiCheckCircle className="text-emerald-500 w-4 h-4" /> <span>正解 (100pt)</span></div>
                  <div className="flex items-center gap-2"><FiAlertTriangle className="text-amber-500 w-4 h-4" /> <span>部分点</span></div>
                  <div className="flex items-center gap-2"><FiXCircle className="text-rose-500 w-4 h-4" /> <span>不正解</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200 ml-1 mr-1"></div> <span>未解答</span></div>
                </div>

                {/* Scroll To Top for Participants */}
                {showScrollTopParticipants && (
                  <button
                    onClick={scrollToTopParticipants}
                    className="absolute bottom-6 right-6 bg-slate-800/80 hover:bg-slate-900 text-white p-2.5 rounded-full shadow-lg transition-all hover:-translate-y-1 active:scale-95 z-20 border border-white/10"
                    title="上へ戻る"
                  >
                    <FiArrowUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                <div className="w-20 h-20 mb-4 rounded-full bg-slate-50 flex items-center justify-center">
                  <FiUsers className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-slate-600 font-bold mb-1">参加者はまだいません</h3>
                <p className="text-slate-400 text-xs">参加者が招待コードを使って参加するのを待ちましょう...</p>
              </div>
            )}
            {/* Problems Section MOVED to right column below */}
          </div>

          {/* Right Column: Live Feed & Problems */}
          <div className="flex flex-col gap-10 h-full">

            {/* Live Activity Feed */}
            <LiveActivityFeed eventId={event.id} />

            {/* Problems Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 flex flex-col h-full max-h-[600px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FiList className="w-5 h-5 text-cyan-600 ml-1" />
                  イベント問題リスト <span className="text-slate-500 font-medium ml-1">({event.issues.length})</span>
                </h2>
              </div>

              <div className="relative flex-grow">
                <div
                  ref={problemsListRef}
                  onScroll={handleScrollProblems}
                  className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
                  style={{ maxHeight: '400px' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.issues.map((issue) => (
                      <div key={issue.id} className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-cyan-100 hover:-translate-y-1 transition-all duration-300 group">
                        {/* Decorative accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full rounded-tr-2xl -z-0"></div>

                        <div className="relative z-10">
                          <h3 className="font-bold text-slate-900 text-lg line-clamp-1 mb-4 group-hover:text-cyan-700 transition-colors" title={issue.problem.title}>{issue.problem.title}</h3>

                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-sm font-bold text-slate-400">難易度:</span>
                            <span className="text-lg font-bold leading-none text-black">
                              {issue.problem.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Empty state for problems if needed */}
                    {event.issues.length === 0 && (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <p className="text-slate-400 font-medium">問題がまだ追加されていません</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Scroll To Top for Problems */}
                {showScrollTopProblems && (
                  <button
                    onClick={scrollToTopProblems}
                    className="absolute bottom-4 right-4 bg-slate-800/80 hover:bg-slate-900 text-white p-2.5 rounded-full shadow-lg transition-all hover:-translate-y-1 active:scale-95 z-20"
                    title="上へ戻る"
                  >
                    <FiArrowUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submission Detail Modal (Image 3 Style) */}
          {submissionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
              <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={handleCloseSubmissionModal}></div>
              <div className="relative bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-7xl max-h-[75vh] overflow-hidden animate-in fade-in zoom-in-95 flex flex-col border border-white/20">

                {/* Modal Header - Fixed at Top */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-6 md:px-10 flex justify-between items-center z-20 shadow-sm flex-none">
                  <div className="flex items-center gap-4">
                    <button onClick={handleCloseSubmissionModal} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <FiChevronLeft /> リーダーボードに戻る
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">#{selectedSubmission?.id || '----'}</h2>
                  </div>

                  <div className="flex items-center gap-4">
                    {selectedSubmission?.status ? (
                      <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold border border-emerald-200 shadow-sm">
                        <FiCheckCircle className="w-5 h-5" /> 正解 (Accepted)
                      </div>
                    ) : (selectedSubmission?.score ?? 0) > 0 ? (
                      <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold border border-amber-200 shadow-sm">
                        <FiAlertTriangle className="w-5 h-5" /> 部分点 (Partial)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-xl font-bold border border-rose-200 shadow-sm">
                        <FiXCircle className="w-5 h-5" /> 不正解 (Wrong)
                      </div>
                    )}
                    <div className="text-xs text-slate-400 font-mono">
                      {selectedSubmission?.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString('ja-JP') : '--'}
                    </div>
                  </div>
                </div>

                {/* Modal Body - Scrollable Area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                  {loadingSubmission ? (
                    <div className="flex items-center justify-center min-h-[500px]">
                      <FiRotateCw className="w-12 h-12 text-cyan-500 animate-spin" />
                    </div>
                  ) : selectedSubmission ? (
                    <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10">

                      {/* Left Column (Participant & Stats) */}
                      <div className="lg:col-span-4 flex flex-col gap-8">

                        {/* Participant Information */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <FiUser className="text-cyan-500 w-6 h-6" /> 参加者情報
                          </h3>
                          <div className="flex items-start gap-6">
                            {selectedSubmission.user?.icon ? (
                              <img src={selectedSubmission.user.icon} className="w-20 h-20 rounded-full border-2 border-slate-100 shadow-lg object-cover" alt="User" />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl font-bold">
                                {(selectedSubmission.user?.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-black text-2xl text-slate-900 mb-1">{selectedSubmission.user?.username || 'Unknown'}</div>
                              <div className="text-sm text-slate-400 mb-4">{selectedSubmission.user?.email || 'No Email'}</div>
                              <div className="flex gap-4">
                                <div className="flex flex-col">
                                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Score</span>
                                  <span className="font-black text-2xl text-cyan-600">{selectedSubmission.score} pts</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Execution Details */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <FiCpu className="text-cyan-500 w-6 h-6" /> 実行詳細
                          </h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">言語</div>
                              <div className="font-mono font-bold text-slate-700 flex items-center gap-2">
                                {(() => {
                                  const lang = (selectedSubmission as any).language?.toLowerCase() || 'python';
                                  const langInfo: { [key: string]: { label: string; icon: any; color: string } } = {
                                    'python': { label: 'Python', icon: FaPython, color: 'text-blue-500' },
                                    'java': { label: 'Java', icon: FiCode, color: 'text-orange-500' },
                                    'javascript': { label: 'JavaScript', icon: FaJs, color: 'text-yellow-400' },
                                    'typescript': { label: 'TypeScript', icon: FaJs, color: 'text-blue-500' },
                                    'cpp': { label: 'C++', icon: FiCode, color: 'text-blue-600' },
                                    'c': { label: 'C', icon: FiCode, color: 'text-slate-500' },
                                    'csharp': { label: 'C#', icon: FiCode, color: 'text-purple-500' },
                                    'php': { label: 'PHP', icon: FiCode, color: 'text-indigo-400' }
                                  };
                                  const info = langInfo[lang] || { label: lang.toUpperCase(), icon: FiCode, color: 'text-slate-400' };
                                  const Icon = info.icon;
                                  return (
                                    <>
                                      <Icon className={info.color} /> {info.label}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">実行時間</div>
                              <div className="font-mono font-bold text-slate-700">0.15s (仮)</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">メモリ</div>
                              <div className="font-mono font-bold text-slate-700">45.2 MB (仮)</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">結果</div>
                              <div className={`font-black uppercase text-sm ${selectedSubmission.status ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {selectedSubmission.status ? '正解 (Accepted)' : '不正解 (Wrong)'}
                              </div>
                            </div>
                          </div>
                          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-slate-500">獲得ポイント</span>
                            <span className="text-3xl font-black text-emerald-500">+{selectedSubmission.score} pts</span>
                          </div>
                        </div>

                        {/* Test Cases */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <FiCheckCircle className="text-cyan-500 w-6 h-6" /> テストケース結果 (例)
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-3 font-bold text-slate-700"><FiCheckCircle className="text-emerald-500 w-5 h-5" /> Test Case #1</span>
                              <span className="text-emerald-600 font-mono text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Passed 0.12s</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-3 font-bold text-slate-700"><FiCheckCircle className="text-emerald-500 w-5 h-5" /> Test Case #2</span>
                              <span className="text-emerald-600 font-mono text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Passed 0.15s</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden border border-slate-200">
                              <div className="bg-emerald-500 h-full rounded-full w-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            </div>
                            <p className="text-right text-xs text-slate-400 font-black uppercase tracking-widest mt-2">100% Passed</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column (Problem & Code) */}
                      <div className="lg:col-span-8 flex flex-col gap-8">

                        {/* Problem Info */}
                        <div className="bg-white rounded-2xl py-3 px-6 shadow-sm border border-slate-200 w-full max-w-[300px] mx-auto text-center flex flex-col items-center justify-center gap-0.5 mt-8">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Problem Information</h3>
                          <h2 className="text-lg font-black text-slate-800 tracking-tight">{selectedSubmission.eventIssue?.problem?.title || 'Unknown Problem'}</h2>
                        </div>

                        {/* Submitted Code */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[700px]">
                          <div className="bg-[#161b22] px-8 py-5 flex justify-between items-center border-b border-white/5">
                            <h3 className="text-slate-300 font-bold flex items-center gap-3 text-sm">
                              <FiCode className="w-5 h-5 text-cyan-500" /> Submitted Code
                            </h3>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-slate-500 font-mono uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                {(() => {
                                  const lang = (selectedSubmission as any).language?.toLowerCase() || 'python';
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
                                  return mapping[lang] || lang.toUpperCase();
                                })()}
                              </span>
                              <div className="w-px h-4 bg-white/10"></div>
                              <button
                                onClick={() => {
                                  if (typeof window !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(selectedSubmission.codeLog || '');
                                    toast.success('コードをコピーしました');
                                  }
                                }}
                                className="group/copy flex items-center gap-2 text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20 active:scale-95"
                                title="コードをコピー"
                              >
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/copy:opacity-100 transition-opacity">Copy</span>
                                <FiCopy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div
                            ref={codeContainerRef}
                            onScroll={handleScrollCode}
                            className="flex-grow bg-[#0d1117] p-8 overflow-auto selection:bg-cyan-500/30 relative scrollbar-thin scrollbar-thumb-slate-700"
                          >
                            {showScrollTopCode && (
                              <button
                                onClick={scrollToTopCode}
                                className="sticky top-4 right-4 ml-auto bg-slate-800/80 hover:bg-slate-700 text-white p-2.5 rounded-full shadow-lg transition-all hover:-translate-y-1 active:scale-95 z-30 flex items-center justify-center border border-white/10"
                                title="上へ戻る"
                              >
                                <FiArrowUp className="w-4 h-4" />
                              </button>
                            )}
                            <pre className="font-mono text-sm sm:text-base text-slate-300 leading-relaxed">
                              <code>{selectedSubmission.codeLog || '# Code not available'}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500">データが見つかりません</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Participant Submissions List Modal */}
          {participantSubmissionsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleCloseParticipantSubmissionsModal}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[550px] overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><FiList className="text-cyan-500" /> 提出履歴</h3>
                  <button onClick={handleCloseParticipantSubmissionsModal}><FiX className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="overflow-y-auto p-0 flex-grow scrollbar-thin scrollbar-thumb-slate-200">
                  {loadingParticipantSubmissions ? (
                    <div className="flex justify-center py-12"><FiRotateCw className="animate-spin w-8 h-8 text-cyan-500" /></div>
                  ) : selectedParticipantSubmissions && selectedParticipantSubmissions.length > 0 ? (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                        <tr>
                          <th className="p-4">Time</th>
                          <th className="p-4">Problem</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Score</th>
                          <th className="p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedParticipantSubmissions.map((sub: any) => (
                          <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-slate-500 font-mono text-xs">
                              {new Date(sub.submittedAt).toLocaleString('ja-JP')}
                            </td>
                            <td className="p-4 font-bold text-slate-700">
                              {sub.eventIssue?.problem?.title}
                            </td>
                            <td className="p-4 text-center">
                              {sub.status ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold border border-emerald-100"><FiCheckCircle /> AC</span>
                              ) : (sub.score > 0) ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold border border-amber-100"><FiAlertTriangle /> Pts</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-bold border border-rose-100"><FiXCircle /> WA</span>
                              )}
                            </td>
                            <td className="p-4 text-center font-black">{sub.score}</td>
                            <td className="p-4">
                              <button onClick={() => { handleCloseParticipantSubmissionsModal(); handleOpenSubmission(sub.id); }} className="text-cyan-600 hover:text-cyan-800 font-bold text-xs bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg border border-cyan-200 transition-colors">
                                詳細
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-400">提出履歴がありません</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Theme Selection Modal */}
          {
            isThemeModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsThemeModalOpen(false)}></div>
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <FiImage className="text-cyan-500" /> 背景テーマ設定
                    </h3>
                    <button onClick={() => setIsThemeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="p-6">
                    <p className="text-sm text-slate-500 mb-6 font-medium">イベントの雰囲気に合わせてテーマを選択してください</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Custom Upload Option */}
                      <label className={`group relative rounded-xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-cyan-400 bg-slate-50 cursor-pointer flex flex-col items-center justify-center transition-all duration-200 hover:shadow-lg ${currentThemeKey === 'custom' ? 'border-cyan-500 bg-cyan-50' : ''}`}
                        style={currentThemeKey === 'custom' && (event as any).customImagePath ? { backgroundImage: `url(${(event as any).customImagePath})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                      >
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />

                        {/* Overlay for icon visibility on custom image */}
                        <div className={`absolute inset-0 bg-white/50 transition-opacity ${currentThemeKey === 'custom' && (event as any).customImagePath ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}></div>

                        <div className="h-24 w-full flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-cyan-600 transition-colors relative z-10">
                          <FiUpload className="w-8 h-8" />
                          <span className="text-xs font-bold text-shadow-sm">{currentThemeKey === 'custom' ? '画像を変更' : '画像を選択'}</span>
                        </div>
                        {currentThemeKey === 'custom' && (
                          <div className="absolute top-2 right-2 flex items-center justify-center z-20">
                            <FiCheckCircle className="w-6 h-6 text-cyan-500 drop-shadow-sm bg-white rounded-full" />
                          </div>
                        )}
                      </label>

                      {Object.entries(EVENT_THEMES).map(([key, theme]: [string, any]) => (
                        <button
                          key={key}
                          onClick={() => handleThemeChange(key)}
                          className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-200 text-left ${currentThemeKey === key ? 'border-cyan-500 ring-2 ring-cyan-200 ring-offset-2 scale-[1.02]' : 'border-transparent hover:scale-[1.02] hover:shadow-lg'
                            }`}
                        >
                          {/* Preview Area */}
                          <div className={`h-24 w-full ${theme.class} relative`}>
                            {/* Pattern Preview (Mockup or minimal SVG) */}
                            <div className="absolute inset-0 opacity-20 bg-black/10"></div>
                            {currentThemeKey === key && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                                <FiCheckCircle className="w-8 h-8 text-white drop-shadow-md" />
                              </div>
                            )}
                          </div>

                          {/* Label */}
                          <div className="p-3 bg-slate-50 group-hover:bg-white transition-colors">
                            <div className="font-bold text-slate-700 text-sm">{theme.label}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {theme.pattern}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Custom / Advanced Option Hint */}
                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                      <p className="text-xs text-slate-400">
                        ※ さらに詳細なカスタマイズが必要な場合は、開発者にお問い合わせください。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

        </div>
      </div>
    </div>
  );
}


