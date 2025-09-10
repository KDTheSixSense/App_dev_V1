// /src/app/(main)/profile/PointExchange/PointExchange.tsx
'use client';

import React, { useState } from 'react';

// --- 型定義 ---
interface PointExchangeProps {
  initialXp: number;
  initialCredits: number;
}

// 交換に必要なXPと、交換で得られるクレジット数（フロントエンドでも定義）
const EXCHANGE_COST_XP = 500;
const CREDITS_PER_EXCHANGE = 1;

/**
 * XPとAIアドバイスクレジットを交換するためのUIコンポーネント
 */
const PointExchange: React.FC<PointExchangeProps> = ({ initialXp, initialCredits }) => {
  // --- 状態管理 ---
  const [xp, setXp] = useState(initialXp);
  const [credits, setCredits] = useState(initialCredits);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // --- イベントハンドラ ---
  const handleExchange = async () => {
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch('/api/user/exchange-xp-for-credits', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        // APIからエラーが返ってきた場合
        throw new Error(data.error || '交換に失敗しました');
      }

      // 成功した場合、UIの状態を更新
      setXp(data.newXp);
      setCredits(data.newCredits);
      setMessage(data.message);

    } catch (error: any) {
      setIsError(true);
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-bold text-gray-800 mb-4">アドバイス回数を増やす</h3>
      
      {/* 現在の所持ポイント表示 */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-600">現在のXP:</span>
        <span className="font-bold text-lg text-yellow-500">{xp.toLocaleString()} XP</span>
      </div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-600">AIアドバイス残り回数:</span>
        <span className="font-bold text-lg text-blue-500">{credits} 回</span>
      </div>

      {/* 交換ボタン */}
      <div className="bg-gray-50 p-4 rounded-md text-center">
        <p className="text-sm text-gray-700 mb-2">
          <span className="font-bold">{EXCHANGE_COST_XP} XP</span> を消費して、<br />
          アドバイス回数を <span className="font-bold">{CREDITS_PER_EXCHANGE}回</span> 増やします。
        </p>
        <button
          onClick={handleExchange}
          disabled={isLoading || xp < EXCHANGE_COST_XP}
          className="w-full px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? '処理中...' : '交換する'}
        </button>
      </div>

      {/* 結果メッセージ表示 */}
      {message && (
        <p className={`mt-4 text-sm text-center font-bold ${isError ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default PointExchange;
