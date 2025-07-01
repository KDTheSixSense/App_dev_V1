'use client'; // フックを使うのでクライアントコンポーネントにする

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import React from 'react';

type Props = {
  tabs: { name: string }[];
};

export default function RankingTabs({ tabs }: Props) {
  // URLのクエリパラメータを読み取るためのフック
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 現在のURLから 'subject' パラメータを取得。なければ '総合' をデフォルトとする
  const activeTab = searchParams.get('subject') || '総合';

  const handleTabClick = (tabName: string) => {
    // '総合'タブがクリックされたらクエリパラメータを削除
    // それ以外のタブなら、?subject=... をURLに追加する
    if (tabName === '総合') {
      router.push(pathname);
    } else {
      router.push(`${pathname}?subject=${tabName}`);
    }
  };

  return (
    <div className="mt-4 border-b border-slate-200">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => handleTabClick(tab.name)}
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
  );
}