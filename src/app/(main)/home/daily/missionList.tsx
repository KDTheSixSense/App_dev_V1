// app/(main)/daily/components/MissionList.tsx
'use client'; // このコンポーネントはクライアントコンポーネント

import React from 'react';
import MissionCard from './missionCard';

/**
 * ミッションデータの型定義
 * page.tsx や MissionCard.tsx からも参照されます
 */
export interface Mission {
  id: number;
  title: string;
  description: string;
  progress: number;
  targetCount: number;
  xpReward: number;
  isCompleted: boolean;
}

interface MissionListProps {
  missions: Mission[];
}

const MissionList: React.FC<MissionListProps> = ({ missions }) => {
  
  // 報酬受け取りボタンのダミーハンドラ
  const handleClaimReward = (missionId: number) => {
    // 将来的にはここでサーバーアクションを呼び出し、
    // 報酬を受け取り、ミッションの状態を更新します。
    alert(`ミッションID: ${missionId} の報酬を受け取りました！ (ダミー)`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-6">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onClaim={handleClaimReward}
          />
        ))}
      </div>
    </div>
  );
};

export default MissionList;