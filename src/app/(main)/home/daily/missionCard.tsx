// app/(main)/daily/components/MissionCard.tsx
'use client';

import React from 'react';
import type { Mission } from './missionList'; // Missionの型をインポート

interface MissionCardProps {
  mission: Mission;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission }) => {
  // ------------------------------------------------------------------
  // ロジック部分
  // ------------------------------------------------------------------

  // 進捗率を計算 (0% 〜 100%)
  // Math.minで100%を超えないようにキャップしています
  const progressPercentage = Math.min(
    (mission.progress / mission.targetCount) * 100,
    100
  );

  // 表示用の進捗数値の計算
  // 実際の進捗(mission.progress)が目標(targetCount)を超えていても、
  // 表示上は「10/10」のように目標値で止めるための処理です
  let max_progress = mission.progress;
  if(mission.progress >= mission.targetCount){
    max_progress = mission.targetCount;
  }

  // 達成（進捗が目標以上）しているかどうか
  // これが true の場合、カード全体のデザインが豪華になります
  const isAchieved = mission.progress >= mission.targetCount;

  // ミッションが達成可能か (進捗が100%以上で、まだ報酬を受け取っていない)
  // 現状のJSXではこのフラグを使ったクリック処理などは実装されていません
  const isClaimable = mission.progress >= mission.targetCount && !mission.isCompleted;

  // ------------------------------------------------------------------
  // スタイル定義 (Tailwind CSS)
  // ------------------------------------------------------------------

  // 達成時のスタイル: 
  // - 背景: 水色のグラデーション (bg-gradient-to-r)
  // - 枠線: シアン色で強調 (border-[#00BCD4])
  // - 影: shadow-lg で浮き上がり感を強調
  // - 拡大: scale-[1.01] で少し大きく表示
  const containerClass = isAchieved
    ? "bg-gradient-to-r from-[#E0F7FA] to-[#B2EBF2] border-2 border-[#00BCD4] rounded-2xl p-5 flex items-center justify-between shadow-lg mb-4 last:mb-0 transform scale-[1.01] transition-all duration-300"
    : "bg-white border-0 rounded-2xl p-5 flex items-center justify-between shadow-sm mb-4 last:mb-0 hover:shadow-md transition-shadow";

  // 報酬サークル（右側の丸い部分）のスタイル
  const rewardCircleClass = isAchieved
    ? "w-14 h-14 rounded-full border-3 border-[#00B4D8] flex flex-col items-center justify-center text-[#006064] bg-white shadow-sm"
    : "w-14 h-14 rounded-full border-3 border-[#00B4D8] flex flex-col items-center justify-center text-[#00B4D8] bg-white";

  return (
    <div className={containerClass}>
      {/* Left: Info & Progress (左側のタイトル、説明、バー) */}
      <div className="flex-1 pr-4">
        {/* タイトル: 達成時は濃いシアン、未達成時はスレート色 */}
        <h3 className={`text-base font-bold mb-1 ${isAchieved ? 'text-cyan-900' : 'text-slate-700'}`}>{mission.title}</h3>
        
        {/* 説明文: 達成時は少し色味を入れる */}
        <p className={`text-[14px] mb-3 ${isAchieved ? 'text-cyan-700' : 'text-slate-500'}`}>{mission.description}</p>

        {/* Progress Bar Area */}
        <div className="w-full">
          {/* バーの背景 (グレー) */}
          <div className="w-full bg-gray-300 rounded-full h-1.5 overflow-hidden">
            {/* バーの本体 (青グラデーション) */}
            <div
              className={`${isAchieved ? 'bg-gradient-to-r from-sky-400 to-blue-600' : 'bg-gradient-to-r from-sky-400 to-blue-600'} h-full rounded-full transition-all duration-500 `}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          {/* 進捗数値テキスト (例: 5/10) */}
          <p className={`text-[12px] text-right mt-1 font-mono ${isAchieved ? 'text-cyan-800 font-bold' : 'text-slate-400'}`}>
            {max_progress}/{mission.targetCount}
          </p>
        </div>
      </div>

      {/* Right: Reward Circle (右側の報酬表示) */}
      <div className="flex-shrink-0">
        <div className={rewardCircleClass}>
          <span className="text-[12px] text-[#3a6b8b] font-bold">報酬</span>
          <span className="text-xs text-[#f0b084] font-bold leading-tight">{mission.xpReward}xp</span>
        </div>
      </div>
    </div>
  );
};

export default MissionCard;