import React from 'react';

/**
 * Adviceコンポーネント
 * AIからのアドバイスを表示するセクションです。
 */
export default function Advice() {
  return (
    <div className="flex flex-col bg-white-100 p-6 rounded-lg shadow-lg border-white-200">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">アドバイス</h2>
      <p className="text-gray-700">ここにユーザーへのアドバイスが表示されます。</p>
    </div>
  );
}
