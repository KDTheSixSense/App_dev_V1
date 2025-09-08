'use client';

import { useState, useMemo, useRef, MouseEvent } from 'react';
import RankingList from '@/app/(main)/home/ranking/RankingList';
import RankingListItem from '@/app/(main)/home/ranking/RankingListItem';

// 子コンポーネントが期待する、rankが数値のみの型
type UserForRanking = {
  id: number;
  rank: number;
  name: string;
  iconUrl: string;
  score: number;
};

// 親から渡される、rankが文字列の場合もある型
type UserForRankingFromProps = {
  id: number;
  rank: number;
  name: string;
  iconUrl: string;
  score: number;
};

// Propsの型定義
type Props = {
  tabs: { name: string }[];
  allRankings: { [key: string]: UserForRankingFromProps[] };
  allRankingsFull: { [key:string]: UserForRankingFromProps[] };
  userId: number | null;
};

export default function RankingContainer({
  tabs,
  allRankings,
  allRankingsFull,
  userId,
}: Props) {
  const [activeTab, setActiveTab] = useState('総合');
  const navRef = useRef<HTMLElement>(null);

  // 表示用のトップ10リストは、型を変換せずにそのまま使用
  const displayedUsers = allRankings[activeTab] || [];

  // 自分の順位情報を計算する際に、型を変換する
  const myRankInfo: UserForRanking | null = useMemo(() => {
    if (!userId) return null;
    const fullList = allRankingsFull[activeTab] || [];
    const foundUser = fullList.find(user => user.id === userId);

    if (!foundUser) return null;

    // rankが文字列('-'など)の場合、数値に変換する (例: ランク外は0として扱う)
    const rankAsNumber = typeof foundUser.rank === 'string' ? 0 : foundUser.rank;
    
    // 子コンポーネントが期待する UserForRanking 型のオブジェクトを返す
    return { ...foundUser, rank: rankAsNumber };
  }, [userId, activeTab, allRankingsFull]);

  const isMeInTop10 = myRankInfo
    ? displayedUsers.some(user => user.id === myRankInfo.id)
    : false;

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
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div className="mt-4 border-b border-slate-200">
        <nav 
          ref={navRef}
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

      <RankingList users={displayedUsers} myRankInfo={myRankInfo} />

      {myRankInfo && !isMeInTop10 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-center text-gray-500 mb-2">あなたの順位</p>
          <RankingListItem user={myRankInfo} isCurrentUser={true} />
        </div>
      )}
    </div>
  );
}

