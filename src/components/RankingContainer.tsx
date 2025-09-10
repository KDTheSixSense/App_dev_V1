'use client';

import { useState, useMemo, useRef, MouseEvent } from 'react';
import RankingList from '@/app/(main)/home/ranking/RankingList';
import RankingListItem from '@/app/(main)/home/ranking/RankingListItem';

// Propsの型定義
type UserForRanking = {
  id: number;
  rank: number;
  name: string;
  iconUrl: string;
  score: number;
};

type Props = {
  tabs: { name: string }[];
  allRankings: { [key: string]: UserForRanking[] };
  allRankingsFull: { [key:string]: UserForRanking[] };
  userId: number | null;
};

export default function RankingContainer({
  tabs,
  allRankings,
  allRankingsFull,
  userId,
}: Props) {
  const [activeTab, setActiveTab] = useState('総合');
  const displayedUsers = allRankings[activeTab] || [];

  const myRankInfo = useMemo(() => {
    if (!userId) return null;
    const fullList = allRankingsFull[activeTab] || [];
    return fullList.find(user => user.id === userId) || null;
  }, [userId, activeTab, allRankingsFull]);

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
      <div className="mt-4 border-b border-slate-200">
        <nav 
          className="-mb-px flex space-x-6 overflow-x-auto flex-nowrap hide-scrollbar" 
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={(e) => handleTabClick(e, tab.name)}
              className={`
                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.name
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
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
      {myRankInfo && (
        <div className="pt-4 border-t border-slate-200">
          <p className="text-sm text-center text-gray-500 mb-2">あなたの順位</p>
          <RankingListItem user={myRankInfo} isCurrentUser={true} />
        </div>
      )}
    </div>
  );
}

