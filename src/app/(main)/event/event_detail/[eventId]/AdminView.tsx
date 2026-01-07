// /workspaces/my-next-app/src/app/(main)/event/event_detail/[eventId]/AdminView.tsx
'use client';

import { toggleEventStatusAction, deleteEventAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'; // Import useState for local state management
import type { Prisma } from '@prisma/client'; // Import Prisma namespace for types
import toast from 'react-hot-toast';
import { FiCopy, FiPlay, FiStopCircle, FiTrash2, FiUsers, FiList, FiCheck } from 'react-icons/fi'; // Icons for better UI
import { FaCrown } from 'react-icons/fa';

// イベント詳細データの型定義
// イベントの主体である `Create_event` モデルに対応（participants, issuesを含む）
type EventWithDetails = Prisma.Create_eventGetPayload<{
  include: {
    creator: {
      select: { username: true };
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 text-slate-800 font-sans">
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-white/50 backdrop-blur-sm p-6 mb-8 relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-6 mb-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{event.title}</h1>
                    <span className="bg-gradient-to-r from-cyan-100 to-sky-100 text-cyan-800 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm border border-cyan-200/50">Admin</span>
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-10 whitespace-pre-wrap">{event.description}</p>
                
                <div>
                     <h3 className="text-base font-bold text-slate-900 mb-1">イベント作成者</h3>
                     <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
                        {event.creator?.username ?? 'Unknown Creator'} 
                        <span className="bg-gradient-to-r from-cyan-100 to-sky-100 text-cyan-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm border border-cyan-200/50 tracking-wide">管理者</span>
                     </p>
                </div>
            </div>
            <div>
                {!event.hasBeenStarted ? (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-orange-600 text-sm font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                        未開催
                    </span>
                ) : event.isStarted ? (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-600 text-sm font-bold shadow-sm animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                        開催中
                    </span>
                ) : (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-200 bg-gray-100 text-gray-500 text-sm font-bold shadow-sm">
                         <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                        終了
                    </span>
                )}
            </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
            <div className="w-full md:w-auto">
                <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2">招待コード</p>
                <div className="flex items-center gap-2">
                    <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold text-xl tracking-wide shadow-inner">
                        {event.inviteCode}
                    </div>
                    <button 
                        onClick={handleCopyInviteCode}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-cyan-400 text-slate-600 hover:text-cyan-600 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 group"
                    >
                        {copied ? <FiCheck className="text-green-500" /> : <FiCopy className="group-hover:text-cyan-500 transition-colors" />}
                        {copied ? 'コピーしました！' : 'コピー'}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                 {!event.hasBeenStarted ? (
                    <button onClick={handleStartEvent} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 hover:-translate-y-0.5">
                        <FiPlay /> イベントを開始する
                    </button>
                 ) : event.isStarted ? (
                     <button onClick={handleEndEvent} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/30 transition-all duration-200 active:scale-95 hover:-translate-y-0.5">
                        <FiStopCircle /> イベントを終了する
                    </button>
                 ) : null}
                
                <button onClick={handleDeleteEvent} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 active:scale-95">
                    <FiTrash2 /> イベントを削除                </button>
            </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Participants Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FiUsers className="w-5 h-5 text-cyan-600 ml-1" />
                    参加者 <span className="text-slate-500 font-medium ml-1">({otherParticipants.length})</span>
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
                 <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow" style={{ maxHeight: '400px' }}>
                    {filteredParticipants.map(participant => {
                        const rank = sortedParticipants.findIndex(p => p.id === participant.id) + 1;
                        let rankColor = "text-slate-500 font-bold";
                        let rankBg = "bg-slate-100";
                        let RankIcon = null;
                        
                        if (rank === 1) { 
                            rankColor = "text-yellow-500"; 
                            rankBg = "bg-yellow-50 border border-yellow-100";
                            RankIcon = <FaCrown className="w-5 h-5" />;
                        } else if (rank === 2) { 
                            rankColor = "text-slate-400"; 
                            rankBg = "bg-slate-50 border border-slate-200";
                            RankIcon = <FaCrown className="w-4 h-4" />;
                        } else if (rank === 3) { 
                            rankColor = "text-orange-600"; 
                            rankBg = "bg-orange-50 border border-orange-100";
                            RankIcon = <FaCrown className="w-4 h-4" />;
                        }

                        return (
                        <div key={participant.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-cyan-200 hover:shadow-md transition-all duration-200 group">
                            <div className="flex items-center gap-4">
                                <div className={`flex justify-center items-center w-8 h-8 rounded-full ${rankBg} ${rankColor} text-sm shadow-sm`}>
                                   {RankIcon ? RankIcon : rank}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center text-cyan-700 font-bold text-base shadow-inner group-hover:scale-110 transition-transform">
                                    {(participant.user.username ?? 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 text-sm group-hover:text-cyan-700 transition-colors">{participant.user.username ?? 'Unknown User'}</p>
                                    <p className="text-xs text-slate-400">参加: {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-800 text-lg">{participant.event_getpoint ?? 0} <span className="text-xs text-slate-400 font-medium">pts</span></p>
                                {participant.hasAccepted ? (
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600">参加中</span>
                                ) : (
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500">待機中</span>
                                )}
                            </div>
                        </div>
                        );
                    })}
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
          </div>

          {/* Problems Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FiList className="w-5 h-5 text-cyan-600 ml-1" />
                    イベント問題リスト <span className="text-slate-500 font-medium ml-1">({event.issues.length})</span>
                  </h2>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar flex-grow" style={{ maxHeight: '400px' }}>
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
                                      {String(issue.problem.difficulty) === 'Easy' ? '1' : String(issue.problem.difficulty) === 'Medium' ? '2' : '3'}
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
          </div>
      </div>
    </div>
    </div>
  );
}


