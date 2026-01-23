// components/dashboard/DailyMissionClient.tsx
'use client'; // クライアントコンポーネント（ブラウザ側で動作）

import React, { useState, useEffect } from 'react';
import MissionList, { Mission } from '@/app/(main)/home/daily/missionList';

export default function DailyMissionClient() {
  // ------------------------------------------------------------------
  // 状態管理 (State)
  // ------------------------------------------------------------------
  // データ、ロード中フラグ、エラー情報をそれぞれ管理します
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // データ取得 (Effect)
  // ------------------------------------------------------------------
  // コンポーネントのマウント時（初回表示時）に1回だけ実行されます
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        // Next.jsのAPIルートへリクエストを送る
        // (サーバーコンポーネントと違い、DBに直接アクセスできないためAPIを経由する)
        const response = await fetch('/api/daily-missions');
        
        if (!response.ok) {
          throw new Error('ミッションデータの取得に失敗しました。');
        }
        
        const data = await response.json();
        setMissions(data); // 取得したデータをstateに保存
      } catch (e: any) { // エラーハンドリング
        // e.message が存在しない場合も考慮したほうがより安全です
        setError(e.message);
      } finally {
        // 成功しても失敗しても、ローディング状態を解除する
        setIsLoading(false);
      }
    };

    fetchMissions();
  }, []); // 依存配列が空 [] なので、初回マウント時のみ実行

  // ------------------------------------------------------------------
  // 条件付きレンダリング (UI)
  // ------------------------------------------------------------------

  // 1. ロード中の表示
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        {/* UI改善案: ここでスケルトンスクリーン（骨組みだけのUI）を表示すると体感が良くなります */}
        <p>ミッションを読み込み中...</p>
      </div>
    );
  }

  // 2. エラー発生時の表示
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  // 3. データが空の場合の表示
  if (!missions || missions.length === 0) {
    return (
        <div className="p-4 text-center">
            <p>今日のミッションはありません。</p>
        </div>
    );
  }

  // 4. データ取得成功時の表示（リストコンポーネントを描画）
  return <MissionList missions={missions} />;
}