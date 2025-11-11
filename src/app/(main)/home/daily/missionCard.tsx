// app/(main)/daily/components/MissionCard.tsx
'use client';

import React from 'react';
import type { Mission } from './missionList'; // Missionの型をインポート

interface MissionCardProps {
  mission: Mission;
  onClaim: (missionId: number) => void;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission, onClaim }) => {
  // 進捗率を計算 (0% 〜 100%)
  const progressPercentage = Math.min(
    (mission.progress / mission.targetCount) * 100,
    100
  );

  // ミッションが達成可能か (進捗が100%以上で、まだ報酬を受け取っていない)
  const isClaimable = mission.progress >= mission.targetCount && !mission.isCompleted;

  return (
    <div className="border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row items-center sm:items-center gap-4">
      {/* ミッション情報 (左側) */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">{mission.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
        
        {/* プログレスバー */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 text-right mt-1">
            {mission.progress} / {mission.targetCount}
          </p>
        </div>
      </div>

      {/* 報酬とボタン (右側) */}
      <div className="flex-shrink-0 flex flex-col items-center sm:items-end w-full sm:w-auto">
        <div className="text-center sm:text-right">
          <p className="text-sm text-gray-500">報酬</p>
          <p className="text-lg font-bold text-yellow-500">{mission.xpReward} XP</p>
        </div>
      </div>
    </div>
  );
};

export default MissionCard;