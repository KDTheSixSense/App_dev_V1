"use client";

import {useState} from "react";
import RankingList from "./RankingList";

// モック（ダミー）データを作成
const mockUsers = [
  { id: 1, rank: 1, name: 'username', avatarUrl: '/images/test_icon.webp', score: 256 },
  { id: 2, rank: 2, name: 'username', avatarUrl: '/images/test_icon.webp', score: 150 },
  { id: 3, rank: 3, name: 'username', avatarUrl: '/images/test_icon.webp', score: 98 },
  { id: 4, rank: 4, name: 'username', avatarUrl: '/images/test_icon.webp', score: 97 },
];
// ※アバター画像は public/images/ ディレクトリに配置してください。なければプレースホルダーが表示されます。

const tabs = ['総合', 'プログラミング', '基本情報', '応用情報', 'セキマネ'];

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState('総合');

  return (
    <div className="mt-10 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        {/* タイトル */}
        <h1 className="text-2xl font-bold text-slate-800">ランキング</h1>

        {/* タブナビゲーション */}
        <div className="mt-4 border-b border-slate-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600' // アクティブなタブ
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300' // 非アクティブなタブ
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* ランキングリスト */}
        <RankingList users={mockUsers} />
      </div>
    </div>
  );
}