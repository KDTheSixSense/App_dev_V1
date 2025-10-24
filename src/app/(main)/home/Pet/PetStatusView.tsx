'use client';

import React from 'react'; // useEffect, useState を削除 (今回は不要)
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lightbulb } from 'lucide-react'; // アイコンをインポート

// Props に adviceText を追加
interface PetStatusViewProps {
  initialHunger: number; // 画像表示のために残す
  adviceText?: string | null; // AIアドバイスを受け取る (オプショナル)
  maxHunger: number; // Props としては受け取るが今回は表示に使わない
}

// 満腹度に応じた画像パスを返すヘルパー関数 (変更なし)
const getPetDisplayInfo = (hungerLevel: number) => {
    if (hungerLevel >= 150) {
    return { image: '/images/Kohaku/kohaku-full.png' };
  } else if (hungerLevel >= 100) {
    return { image: '/images/Kohaku/kohaku-normal.png' };
  } else if (hungerLevel >= 50) {
    return { image: '/images/Kohaku/kohaku-hungry.png' };
  } else {
    return { image: '/images/Kohaku/kohaku-starving.png' };
  }
};

export default function PetStatusView({ initialHunger, maxHunger, adviceText }: PetStatusViewProps) {
  const router = useRouter();
  const petInfo = getPetDisplayInfo(initialHunger);

  // useEffect による外部更新検知は削除 (今回は不要)

  return (
    // 全体の Paddinng や背景色などを調整
    <div className="flex flex-col h-full justify-between items-center p-6 bg-white rounded-lg shadow-lg">

      {/* 1. キャラクター画像 (変更なし) */}
      <div className="w-60 h-60 relative">
        <Image
          src={petInfo.image}
          alt="コハク"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain"
        />
      </div>
        <div className="w-full bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md text-base text-gray-700 h-24 overflow-y-auto">
          <div className="flex items-start">
            <Lightbulb className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>{adviceText}</p>
          </div>
        </div>
    </div>
  );
}