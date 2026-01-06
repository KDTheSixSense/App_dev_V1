'use client';

import { useState, useMemo, useRef, MouseEvent, useEffect } from 'react';
import RankingList from '@/app/(main)/home/ranking/RankingList';
import RankingListItem from '@/app/(main)/home/ranking/RankingListItem';

import { UserForRanking } from "@/lib/types/ranking";

type Props = {
  tabs: { name: string }[];
  allRankings: { [key: string]: UserForRanking[] };
  allRankingsFull: { [key: string]: UserForRanking[] };
};

export default function RankingContainer({
  tabs,
  allRankings,
  allRankingsFull,
}: Props) {
  const [activeTab, setActiveTab] = useState('総合');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingMyRank, setIsLoadingMyRank] = useState(true); // 自分の順位の読み込み状態
  const displayedUsers = allRankings[activeTab] || [];

  useEffect(() => {
    // クライアントサイドでセッション情報を取得
    const fetchUserSession = async () => {
      setIsLoadingMyRank(true); // 読み込み開始
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const session = await res.json();
          if (session.user?.id) {
            setCurrentUserId(session.user.id);
          } else {
            setCurrentUserId(null); // ログインしていない場合
          }
        } else {
          setCurrentUserId(null); // APIエラーの場合
        }
      } catch (error) {
        console.error('Failed to fetch user session:', error);
        setCurrentUserId(null); // エラーの場合
      } finally {
        setIsLoadingMyRank(false); // 読み込み終了
      }
    };

    fetchUserSession();
  }, []);

  const myRankInfo = useMemo(() => {
    if (!currentUserId) return null;
    const fullList = allRankingsFull[activeTab] || [];
    return fullList.find(user => user.id === currentUserId) || null;
  }, [currentUserId, activeTab, allRankingsFull]);

  const scoreToNextRank = useMemo(() => {
    if (!myRankInfo || !currentUserId) return null;
    const fullList = allRankingsFull[activeTab] || [];
    
    // 現在のユーザーのインデックスを見つける
    const myIndex = fullList.findIndex(user => user.id === currentUserId);
    if (myIndex === -1) return null;

    // 自分より上の順位の人を探す (リストはランク順に並んでいる前提)
    for (let i = myIndex - 1; i >= 0; i--) {
      const user = fullList[i];
      // 自分のランクより数値が小さい（＝順位が高い）ユーザーを見つけたら、そのスコアとの差を返す
      if (user.rank < myRankInfo.rank) {
        return {
          diff: user.score - myRankInfo.score,
          targetRank: user.rank
        };
      }
    }
    return null; // 上に誰もいない（1位）
  }, [myRankInfo, allRankingsFull, activeTab, currentUserId]);

  const navRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [sliderStyle, setSliderStyle] = useState({});

  useEffect(() => {
    const activeTabIndex = tabs.findIndex(tab => tab.name === activeTab);
    const activeTabButton = buttonRefs.current[activeTabIndex];
    if (activeTabButton && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const buttonRect = activeTabButton.getBoundingClientRect();
      setSliderStyle({
        left: buttonRect.left - navRect.left + navRef.current.scrollLeft,
        width: buttonRect.width,
      });
    }
  }, [activeTab, tabs]);

  const handleTabClick = (event: MouseEvent<HTMLButtonElement>, tabName: string) => {
    setActiveTab(tabName);
    const clickedTab = event.currentTarget;
    clickedTab.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* スクロールバーを非表示にするためのスタイル */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera*/
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>

      {/* タブ表示 */}
      <div className="mt-4 p-1 bg-sky-100/50 rounded-lg flex-shrink-0">
        <nav
          ref={navRef}
          className="relative flex space-x-1 overflow-x-auto flex-nowrap hide-scrollbar"
          aria-label="Tabs"
        >
          {/* スライドする背景 */}
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
                  ? 'text-[#f0b084]' // 選択中のテキスト色
                  : 'text-[#5a8bab] hover:text-[#3a6b8b]' // 非選択のテキスト色
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* トップ100ランキングリスト (スクロール可能) */}
      {/* 下部に自分のランク表示スペース(約80px)を確保するために padding-bottom を設定 */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto pb-25 custom-scrollbar">
          <RankingList users={displayedUsers} myRankInfo={myRankInfo} />
        </div>
      </div>

      {/* 「自分の順位」表示部分 (オーバーレイ) */}
      {/* 「自分の順位」表示部分 (オーバーレイ - 統合されたデザイン) */}
      <div className="absolute bottom-0 left-0 w-full z-20">
        {/* フェード部分 */}
        {/* <div className="h-6 bg-gradient-to-t from-[#FFF8E1]/80 to-transparent w-full pointer-events-none"></div> */}

        <div className="bg-[#fff] rounded-2xl py-4 w-auto ml-0 mr-1 border border-cyan-200">
          {isLoadingMyRank ? (
            <p className="text-sm text-center text-cyan-800 font-bold">順位読込中...</p>
          ) : currentUserId === null ? (
            <div className="text-center">
              <p className="text-sm text-cyan-800 font-bold mb-1">ゲストユーザー</p>
              <p className="text-xs text-cyan-600">ログインして順位を表示</p>
            </div>
          ) : myRankInfo ? (
            <div className="flex items-center justify-between w-full">
              {/* Rank Section */}
              <div className='flex flex-col items-center justify-center w-full'>

                <div className="flex w-full">
                  <div className="flex flex-col justify-center -items-end pl-4">
                    <span className="text-[14px] font-bold text-cyan-600 mb-0.5 -top-4 w-22 ">あなたの順位</span>
                  </div>
                  {scoreToNextRank && (
                    <div className="flex items-center justify-center ml-auto px-4 py-0.5 rounded-full">
                      <span className="text-[12px] text-slate-500 mr-1">次の順位まであと</span>
                      <span className="text-[14px] text-orange-500 font-bold">{scoreToNextRank.diff}ランク</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center w-full px-4">
                  <div className="flex flex-col items-center justify-center mr-3 relative">
                    <div className="relative w-12 h-12 flex items-center justify-center bg-white rounded-full border-2 border-cyan-400 shadow-sm mt-1">
                      {/* Crown Icon for top 3 */}
                      {myRankInfo.rank <= 3 && (
                        <img
                          src={`/images/rank${myRankInfo.rank}_icon.png`}
                          alt="Rank"
                          className="absolute top-2 -left-8 w-9 h-9 object-contain"
                        />
                      )}
                      <span className="text-cyan-600 font-black text-xl">{myRankInfo.rank}</span>
                    </div>
                  </div>

                  {/* User Info */}
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

                  {/* Score/Label */}
                  <div className="text-right flex-shrink-0 ml-auto pr-2 whitespace-nowrap">
                    <span className="text-blue-400 text-[12px] leading-tight">ランク</span>
                    <span className="text-blue-400 font-bold text-[14px] leading-tight">{myRankInfo.score}</span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-cyan-800 font-bold">ランキング圏外</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
