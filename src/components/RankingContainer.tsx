'use client';

import { useState } from 'react';
import RankingList from '../app/(main)/home/ranking/RankingList';
import RankingListItem from '../app/(main)/home/ranking/RankingListItem';
import type { UserForRanking } from '@/lib/types/ranking'; // 型定義をインポート

// 型定義
type Props = {
  tabs: { name: string }[];
  allRankings: { [key: string]: any[] };
  myRankInfo: UserForRanking | null;
};

export default function RankingContainer({ tabs, allRankings, myRankInfo }: Props) {
  const [activeTab, setActiveTab] = useState('総合');
  const displayedUsers = allRankings[activeTab] || [];

  // 自分自身がトップ10に含まれているかどうかのフラグ
  const isMeInTop10 = myRankInfo ? displayedUsers.some(user => user.id === myRankInfo.id) : false;

  return (
    <div>
      {/* タブ表示 */}
      <div className="mt-4 border-b border-slate-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`
                  whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.name
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700' // ← hover:border-slate-300 を削除
                  }
                `}            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* トップ10ランキングリスト */}
      {/* myRankInfoを渡して、自分の順位がハイライトされるようにする */}
      <RankingList users={displayedUsers} myRankInfo={myRankInfo} />

      {/* 「自分の順位」表示部分 */}
      {/* 自分のランク情報があり、かつトップ10に入っていない場合に表示 */}
      {myRankInfo && (
        <div className="mt-6 pt-4 border-t-1 border-[#ccc]">
          <p className="text-sm text-center text-gray-500 mb-2">あなたの順位</p>
          {/* 自分の順位なので、isCurrentUserをtrueにして渡す */}
          <RankingListItem user={myRankInfo} isCurrentUser={true} />
        </div>
      )}
    </div>
  );
}