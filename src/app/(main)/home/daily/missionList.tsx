// app/(main)/daily/components/MissionList.tsx
'use client'; // このコンポーネントはクライアントコンポーネント

import React, { useState, useRef } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 報酬受け取りボタンのダミーハンドラ
  const handleClaimReward = (missionId: number) => {
    // 将来的にはここでサーバーアクションを呼び出し、
    // 報酬を受け取り、ミッションの状態を更新します。
    alert(`ミッションID: ${missionId} の報酬を受け取りました！ (ダミー)`);
  };

  const goToPrevious = () => {
    const isFirst = currentIndex === 0;
    const newIndex = isFirst ? missions.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLast = currentIndex === missions.length - 1;
    const newIndex = isLast ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      // Swiped left
      goToNext();
    }

    if (touchStartX.current - touchEndX.current < -50) {
      // Swiped right
      goToPrevious();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* モバイル用のカルーセル */}
      <div className="md:hidden">
        <div 
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {missions.map((mission) => (
              <div key={mission.id} className="w-full flex-shrink-0">
                <MissionCard
                  mission={mission}
                  onClaim={handleClaimReward}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center items-center mt-4">
          <button 
            onClick={goToPrevious} 
            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full"
          >
            &lt;
          </button>
          <div className="flex items-center space-x-2 mx-4">
            {missions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${currentIndex === index ? 'bg-blue-600' : 'bg-gray-300'}`}
              ></div>
            ))}
          </div>
          <button 
            onClick={goToNext} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* PC用のリスト表示 */}
      <div className="hidden md:block space-y-6">
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