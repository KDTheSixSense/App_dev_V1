'use client'; // エラーコンポーネントはクライアントコンポーネントである必要があります

import React from 'react';

/**
 * page.tsxでのデータ取得中にエラーが発生した場合に自動的に表示されるコンポーネント。
 * @param error - 発生したエラーオブジェクト
 * @param reset - ページを再レンダリングする関数
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-2">エラーが発生しました</h1>
      <div className="text-center bg-red-50 border border-red-200 p-8 rounded-lg">
        <h2 className="text-xl text-red-700 mb-4">課題の取得に失敗しました</h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'サーバーとの通信中に問題が発生しました。'}
        </p>
        <button
          onClick={
            // この関数は、このページの再レンダリングを試みます
            () => reset()
          }
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  );
}

