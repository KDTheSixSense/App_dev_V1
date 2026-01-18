// components/dashboard/DailyMissionClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import MissionList, { Mission } from '@/app/(main)/home/daily/missionList';

export default function DailyMissionClient() {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const response = await fetch('/api/daily-missions');
        if (!response.ok) {
          throw new Error('ミッションデータの取得に失敗しました。');
        }
        const data = await response.json();
        setMissions(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissions();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>ミッションを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!missions || missions.length === 0) {
    return (
        <div className="p-4 text-center">
            <p>今日のミッションはありません。</p>
        </div>
    );
  }

  return <MissionList missions={missions} />;
}
