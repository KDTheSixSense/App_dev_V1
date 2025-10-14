import React from 'react';
import TraceClient from './TraceClient';

/**
 * カスタムトレースツールのメインページコンポーネント (サーバーコンポーネント)
 * レイアウトの調整とクライアントコンポーネントの呼び出しを担当します。
 */
const TracePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-0 max-w-15xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            カスタムトレースツール
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            独自の疑似言語コードを入力して、ステップごとに実行を追跡しましょう。
          </p>
        </header>
        <main>
          <TraceClient />
        </main>
      </div>
    </div>
  );
};

export default TracePage;

