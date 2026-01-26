// /workspaces/my-next-app/src/components/RankingContainer.tsx

'use client'; // インタラクティブな操作（タブ切り替えなど）があるためクライアントコンポーネント

import { useState, useMemo, useRef, MouseEvent, useEffect } from 'react';
import RankingList from '@/app/(main)/home/ranking/RankingList';

import { UserForRanking } from "@/lib/types/ranking";

type Props = {
  tabs: { name: string }[]; // タブのリスト（総合、科目名...）
  allRankings: { [key: string]: UserForRanking[] }; // 表示用の軽量データ（トップ10など）
  allRankingsFull: { [key: string]: UserForRanking[] }; // 計算用の全データ（自分の順位検索用）
};

/**
 * ランキング表示コンテナ
 * 
 * 総合・部門別などのランキングタブ切り替え機能と、リスト表示を管理します。
 * 自分の現在の順位を画面下部に固定表示する機能も持ちます。
 */
export default function RankingContainer({
  tabs,
  allRankings,
  allRankingsFull,
}: Props) {
  const [activeTab, setActiveTab] = useState('総合');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingMyRank, setIsLoadingMyRank] = useState(true);
  
  // 現在選択中のタブに対応するユーザーリストを取得
  const displayedUsers = allRankings[activeTab] || [];

  // 1. セッション情報の取得
  useEffect(() => {
    const fetchUserSession = async () => {
      setIsLoadingMyRank(true);
      try {
        // APIルート経由で現在のログインユーザーを取得
        const res = await fetch('/api/session');
        if (res.ok) {
          const session = await res.json();
          if (session.user?.id) {
            setCurrentUserId(session.user.id);
          } else {
            setCurrentUserId(null);
          }
        } else {
          setCurrentUserId(null);
        }
      } catch (error) {
        console.error('Failed to fetch user session:', error);
        setCurrentUserId(null);
      } finally {
        setIsLoadingMyRank(false);
      }
    };

    fetchUserSession();
  }, []);

  // 2. 自分のランク情報を検索
  // 全データ(allRankingsFull)の中から自分のIDを探し出し、メモ化する
  const myRankInfo = useMemo(() => {
    if (!currentUserId) return null;
    const fullList = allRankingsFull[activeTab] || [];
    return fullList.find(user => user.id === currentUserId) || null;
  }, [currentUserId, activeTab, allRankingsFull]);

  // 3. 「次の順位まであと何点？」の計算ロジック
  const scoreToNextRank = useMemo(() => {
    if (!myRankInfo || !currentUserId) return null;
    const fullList = allRankingsFull[activeTab] || [];
    
    // リスト内での自分の位置を探す
    const myIndex = fullList.findIndex(user => user.id === currentUserId);
    if (myIndex === -1) return null;

    // 自分より上の人を逆順に探索
    // (同率順位の人がいる可能性があるため、単に index - 1 を見るだけでは不十分)
    for (let i = myIndex - 1; i >= 0; i--) {
      const user = fullList[i];
      // ランクの数字が小さい（＝順位が高い）人を見つけたら計算
      if (user.rank < myRankInfo.rank) {
        return {
          diff: user.score - myRankInfo.score, // 差分スコア
          targetRank: user.rank
        };
      }
    }
    return null; // 自分が1位の場合などはnull
  }, [myRankInfo, allRankingsFull, activeTab, currentUserId]);

  // ------------------------------------------------------------------
  // タブのアニメーション用ロジック
  // ------------------------------------------------------------------
  const navRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [sliderStyle, setSliderStyle] = useState({});

  // アクティブなタブが変わるたびに、白い背景（スライダー）の位置と幅を再計算
  useEffect(() => {
    const activeTabIndex = tabs.findIndex(tab => tab.name === activeTab);
    const activeTabButton = buttonRefs.current[activeTabIndex];
    if (activeTabButton && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const buttonRect = activeTabButton.getBoundingClientRect();
      setSliderStyle({
        // 親コンテナ(nav)からの相対位置 + 現在のスクロール量
        left: buttonRect.left - navRect.left + navRef.current.scrollLeft,
        width: buttonRect.width,
      });
    }
  }, [activeTab, tabs]);

  // タブクリック時のハンドラ
  const handleTabClick = (event: MouseEvent<HTMLButtonElement>, tabName: string) => {
    setActiveTab(tabName);
    const clickedTab = event.currentTarget;
    // クリックしたタブが画面中央に来るようにスムーズスクロール
    clickedTab.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* 独自スクロールバーを非表示にするユーティリティCSS */}
      <style jsx>{`
        /* Webkit (Chrome, Safari, Edge) */
        .tab-scrollbar::-webkit-scrollbar {
          height: 4px; /* 横スクロールバーの高さ（細め） */
        }
        .tab-scrollbar::-webkit-scrollbar-track {
          background: transparent; /* 背景は透明 */
          margin: 0 4px; /* 両端に少し余白 */
        }
        .tab-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(103, 232, 249, 0.5); /* cyan-300の半透明 */
          border-radius: 999px; /* 角丸 */
        }
        .tab-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(6, 182, 212, 0.7); /* ホバー時は少し濃く (cyan-500) */
        }

        /* Firefox */
        .tab-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(103, 232, 249, 0.5) transparent;
        }
      `}</style>

      {/* --- タブエリア --- */}
      <div className="mt-4 p-1 bg-sky-100/50 rounded-lg flex-shrink-0">
        <nav
          ref={navRef}
          className="relative flex space-x-1 overflow-x-auto flex-nowrap tab-scrollbar pb-1.5"
          aria-label="Tabs"
        >
          {/* アクティブなタブの背景にある白いスライダー */}
          <div
            className="absolute h-full bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out"
            style={sliderStyle}
          />

          {tabs.map((tab, index) => (
            <button
              ref={el => { buttonRefs.current[index] = el; }}
              key={tab.name}
              onClick={(e) => handleTabClick(e, tab.name)}
              className={`
                relative z-10 flex-shrink-0 whitespace-nowrap py-2 px-4 font-medium text-sm rounded-md transition-colors duration-300
                focus:outline-none
                ${activeTab === tab.name
                  ? 'text-[#f0b084]' // 選択中
                  : 'text-[#5a8bab] hover:text-[#3a6b8b]' // 非選択
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* --- ランキングリストエリア --- */}
      {/* pb-25: 下部の「自分の順位」表示エリア(absolute配置)にリストの最後が隠れないよう、
         あらかじめパディングでスペースを確保している
      */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        <div className="h-full overflow-y-auto pb-25 custom-scrollbar">
          <RankingList users={displayedUsers} myRankInfo={myRankInfo} />
        </div>
      </div>

      {/* --- 自分の順位表示エリア (画面下部固定) --- */}
      <div className="absolute bottom-0 left-0 w-full z-20">
        
        {/* カードコンテナ */}
        <div className="bg-[#fff] rounded-2xl py-4 w-auto ml-0 mr-1 border border-cyan-200">
          
          {isLoadingMyRank ? (
            <p className="text-sm text-center text-cyan-800 font-bold">順位読込中...</p>
          ) : currentUserId === null ? (
            /* 未ログイン時 */
            <div className="text-center">
              <p className="text-sm text-cyan-800 font-bold mb-1">ゲストユーザー</p>
              <p className="text-xs text-cyan-600">ログインして順位を表示</p>
            </div>
          ) : myRankInfo ? (
            /* ログイン済み & ランクイン時 */
            <div className="flex items-center justify-between w-full">
              <div className='flex flex-col items-center justify-center w-full'>

                {/* 上段: ラベルと「あと○ランク」 */}
                <div className="flex w-full">
                  <div className="flex flex-col justify-center pl-4">
                    <span className="text-[14px] font-bold text-cyan-600 mb-0.5 -top-4 w-22 ">あなたの順位</span>
                  </div>
                  {/* 次のランクまでの差分表示 */}
                  {scoreToNextRank && (
                    <div className="flex items-center justify-center ml-auto px-4 py-0.5 rounded-full">
                      <span className="text-[12px] text-slate-500 mr-1">次の順位まであと</span>
                      <span className="text-[14px] text-orange-500 font-bold">{scoreToNextRank.diff}ランク</span>
                    </div>
                  )}
                </div>

                {/* 下段: 順位、アイコン、名前、スコア */}
                <div className="flex items-center w-full px-4">
                  {/* 順位表示 */}
                  <div className="flex flex-col items-center justify-center mr-3 relative">
                    <div className="relative w-12 h-12 flex items-center justify-center bg-white rounded-full mt-1">
                      {/* 1-3位なら王冠アイコンを表示 */}
                      {myRankInfo.rank <= 3 && (
                        <img
                          src={`/images/rank${myRankInfo.rank}_icon.png`}
                          alt="Rank"
                          className="top-2 w-9 h-9 object-contain"
                        />
                      )}
                      <span className="text-cyan-600 font-black text-xl">{myRankInfo.rank}</span>
                    </div>
                  </div>

                  {/* ユーザー情報 (アイコン + 名前) */}
                  <div className="flex flex-1 items-center gap-3 overflow-hidden">
                    <img
                      src={myRankInfo.iconUrl}
                      alt={myRankInfo.name}
                      className="w-10 h-10 rounded-full object-cover border border-white shadow-sm flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-700 text-sm truncate block">{myRankInfo.name}</span>
                    </div>
                  </div>

                  {/* スコア表示 */}
                  <div className="text-right flex-shrink-0 ml-auto pr-2 whitespace-nowrap">
                    <span className="text-blue-400 text-[16px] leading-tight">ランク</span>
                    <span className="text-blue-400 font-bold text-[18px] leading-tight">{myRankInfo.score}</span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* 圏外の場合 */
            <div className="text-center py-2">
              <p className="text-sm text-cyan-800 font-bold">ランキング圏外</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}