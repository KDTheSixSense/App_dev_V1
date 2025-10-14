import React from 'react';

/**
 * データ取得中に自動的に表示されるローディング画面。
 * ページの骨格（スケルトン）を見せることで、ユーザー体験を向上させます。
 */
export default function Loading() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-2">未提出の課題</h1>
      <div className="space-y-4">
        {/* プレースホルダーとなるカードを3つ表示 */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="block bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-200 animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="text-right">
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-5 w-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

