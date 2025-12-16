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

  // 達成（進捗が目標以上）しているかどうか
  const isAchieved = mission.progress >= mission.targetCount;

  // ミッションが達成可能か (進捗が100%以上で、まだ報酬を受け取っていない)
  const isClaimable = mission.progress >= mission.targetCount && !mission.isCompleted;

  // 達成時のスタイル: 背景を水色、枠線を強調、影を強く
  const containerClass = isAchieved
    ? "bg-gradient-to-r from-[#E0F7FA] to-[#B2EBF2] border-2 border-[#00BCD4] rounded-2xl p-5 flex items-center justify-between shadow-lg mb-4 last:mb-0 transform scale-[1.01] transition-all duration-300"
    : "bg-white border-0 rounded-2xl p-5 flex items-center justify-between shadow-sm mb-4 last:mb-0 hover:shadow-md transition-shadow";

  // 報酬サークルのスタイル
  const rewardCircleClass = isAchieved
    ? "w-14 h-14 rounded-full border-2 border-[#0097A7] flex flex-col items-center justify-center text-[#006064] bg-white shadow-sm"
    : "w-14 h-14 rounded-full border-2 border-[#00B4D8] flex flex-col items-center justify-center text-[#00B4D8] bg-white";

  return (
    <div className={containerClass}>
      {/* Left: Info & Progress */}
      <div className="flex-1 pr-4">
        <h3 className={`text-base font-bold mb-1 ${isAchieved ? 'text-cyan-900' : 'text-slate-700'}`}>{mission.title}</h3>
        <p className={`text-xs mb-3 ${isAchieved ? 'text-cyan-700' : 'text-slate-500'}`}>{mission.description}</p>

        {/* Progress Bar */}
        <div className="w-full max-w-[200px]">
          <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
            <div
              className={`${isAchieved ? 'bg-[#00BCD4]' : 'bg-[#00B4D8]'} h-full rounded-full transition-all duration-500`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className={`text-[10px] text-right mt-1 font-mono ${isAchieved ? 'text-cyan-800 font-bold' : 'text-slate-400'}`}>
            {mission.progress}/{mission.targetCount}
          </p>
        </div>
      </div>

      {/* Right: Reward Circle */}
      <div className="flex-shrink-0">
        <div className={rewardCircleClass}>
          <span className="text-[9px] font-bold">報酬</span>
          <span className="text-xs font-bold leading-tight">{mission.xpReward}xp</span>
        </div>
      </div>

      {/* Claim Button overlay or integration? */}
      {isClaimable && (
        <button
          onClick={() => onClaim(mission.id)}
          className="ml-4 bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-2 px-4 rounded-full shadow-lg text-sm animate-pulse whitespace-nowrap"
        >
          受取！
        </button>
      )}
    </div>
  );
};

export default MissionCard;