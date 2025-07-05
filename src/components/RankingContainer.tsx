'use client'; // stateとイベントハンドラを持つのでクライアントコンポーネント

import { useState } from 'react';
import RankingList from '../app/(main)/home/ranking/RankingList';

type Props = {
  tabs: { name: string }[];
  allRankings: { [key: string]: any[] };
};

export default function RankingContainer({ tabs, allRankings }: Props) {
  // useStateでアクティブなタブの状態を管理。初期値は'総合'
  const [activeTab, setActiveTab] = useState('総合');

  // 表示するランキングデータを選択
  const displayedUsers = allRankings[activeTab] || [];

  return (
    <div>
      {/* タブの表示 */}
      <div className="mt-4 border-b border-slate-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              // クリックされたら、URLではなくstateを更新する
              onClick={() => setActiveTab(tab.name)}
              className={`
                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.name
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 選択されたタブに応じたランキングリストを表示 */}
      <RankingList users={displayedUsers} />
    </div>
  );
}