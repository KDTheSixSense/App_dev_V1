'use client';

import { useState, useMemo, useRef, MouseEvent, useEffect } from 'react';
import RankingList from '@/app/(main)/home/ranking/RankingList';
import RankingListItem from '@/app/(main)/home/ranking/RankingListItem';

import { UserForRanking } from "@/lib/types/ranking";

type Props = {
  tabs: { name: string }[];
  allRankings: { [key: string]: UserForRanking[] };
  allRankingsFull: { [key:string]: UserForRanking[] };
};

export default function RankingContainer({
  tabs,
  allRankings,
  allRankingsFull,
}: Props) {
  const [activeTab, setActiveTab] = useState('総合');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
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
            setCurrentUserId(Number(session.user.id));
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
    <div>
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
      <div className="mt-4 p-1 bg-sky-100/50 rounded-lg">
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
              ref={el => {buttonRefs.current[index] = el; }}
              key={tab.name}
              onClick={(e) => handleTabClick(e, tab.name)}
              className={`
                relative z-10 flex-shrink-0 whitespace-nowrap py-2 px-4 font-medium text-sm rounded-md transition-colors duration-300
                focus:outline-none
                ${
                  activeTab === tab.name
                    ? 'text-sky-600' // 選択中のテキスト色
                    : 'text-slate-500 hover:text-slate-800' // 非選択のテキスト色
                 }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* トップ10ランキングリスト */}
      <RankingList users={displayedUsers} myRankInfo={myRankInfo} />

      {/* 「自分の順位」表示部分 */}
      <div className="pt-4 border-t border-slate-200 mt-4">
        {isLoadingMyRank ? (
          <p className="text-sm text-center text-gray-500">あなたの順位を読み込み中...</p>
        ) : currentUserId === null ? (
          <p className="text-sm text-center text-gray-500">ログインすると自分の順位が表示されます。</p>
        ) : myRankInfo ? (
          <>
            <p className="text-sm text-center text-gray-500 mb-2">あなたの順位</p>
            <RankingListItem user={myRankInfo} isCurrentUser={true} />
          </>
        ) : (
          <p className="text-sm text-center text-gray-500">あなたは現在ランキング圏外です。(上位100位まで表示)</p>
        )}
      </div>
    </div>
  );
}

