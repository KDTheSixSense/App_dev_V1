'use client';

import { useState } from 'react';
import RankingList from '../app/(main)/home/ranking/RankingList';
import RankingListItem from '../app/(main)/home/ranking/RankingListItem';
import { useMemo } from "react";
import { useSearchParams } from 'next/navigation';


export default function RankingContainer({    
  tabs,
  allRankings,
  allRankingsFull,
  userId,
}: {
  tabs: { name: string }[];
  allRankings: { [key: string]: any[] };
  allRankingsFull: { [key: string]: any[] };
  userId: number | null;
}) {


    // useSearchParamsを削除し、useStateを唯一の情報源とします
  const [activeTab, setActiveTab] = useState('総合');

  // 上位10名の表示は、useStateのactiveTabを参照します（これは元々正しい）
  const displayedUsers = allRankings[activeTab] || [];

  // あなたの順位も、useStateのactiveTabを参照するように修正します
  const myRankInfo = useMemo(() => {
    if (!userId) return null;
    // selectedSubjectではなく、activeTabを使います
    const fullList = allRankingsFull[activeTab] || [];
    return fullList.find(user => user.id === userId) || null;
  }, [userId, activeTab, allRankingsFull]); // 依存配列にactiveTabを追加

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