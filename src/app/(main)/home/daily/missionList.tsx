// app/(main)/daily/components/MissionList.tsx
'use client'; // このコンポーネントはクライアントコンポーネント（ブラウザ側で動作）

import React, { useState, useRef } from 'react';
// 子コンポーネントのインポート：個々のミッションカード表示用
import MissionCard from './missionCard';

/**
 * ミッションデータの型定義
 * page.tsx や MissionCard.tsx からも参照されます
 * 各フィールドの用途を型定義として明示
 */
export interface Mission {
  id: number;          // ミッションの一意なID
  title: string;       // ミッションのタイトル
  description: string; // ミッションの詳細説明
  progress: number;    // 現在の進捗数
  targetCount: number; // 目標達成数
  xpReward: number;    // 達成時の経験値報酬
  isCompleted: boolean; // 達成済みかどうか
}

// コンポーネントが受け取るPropsの定義
interface MissionListProps {
  missions: Mission[]; // ミッションオブジェクトの配列
}

const MissionList: React.FC<MissionListProps> = ({ missions }) => {
  // カルーセル表示（モバイル用）の現在表示しているインデックスを管理
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // スワイプ操作の判定用：タッチ開始位置と終了位置のX座標を保持
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // カルーセル：前のスライドへ移動
  const goToPrevious = () => {
    const isFirst = currentIndex === 0;
    // 最初の要素なら最後へループ、そうでなければインデックスを減らす
    const newIndex = isFirst ? missions.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  // カルーセル：次のスライドへ移動
  const goToNext = () => {
    const isLast = currentIndex === missions.length - 1;
    // 最後の要素なら最初へループ、そうでなければインデックスを増やす
    const newIndex = isLast ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  // タッチ開始時の処理：開始位置を記録
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  // タッチ移動中の処理：現在の位置を更新（終了位置の候補）
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  // タッチ終了時の処理：スワイプ判定と移動実行
  const handleTouchEnd = () => {
    // スワイプ距離が50px以上の場合に画面遷移させる判定
    if (touchStartX.current - touchEndX.current > 50) {
      // Swiped left（右から左へ指を動かした） -> 次へ
      goToNext();
    }

    if (touchStartX.current - touchEndX.current < -50) {
      // Swiped right（左から右へ指を動かした） -> 前へ
      goToPrevious();
    }
  };

  return (
    <div className="w-full">
      {/* ------------------------------------------------------------
        モバイル用の表示（mdブレークポイント未満で表示）
        カルーセル形式でミッションを表示
        ------------------------------------------------------------
      */}
      <div className="md:hidden">
        <div
          className="relative overflow-hidden"
          // スワイプ操作用のイベントハンドラを設定
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* スライドコンテナ：translateXを使って横に移動させるアニメーション */}
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {missions.map((mission) => (
              <div key={mission.id} className="w-full flex-shrink-0">
                {/* 【確認事項】
                   ここで handleClaimReward が渡されていません。
                   もしカード内のボタンで報酬を受け取るなら、onClaim={handleClaimReward} などの記述が必要かもしれません。
                */}
                <MissionCard
                  mission={mission}
                />
              </div>
            ))}
          </div>
        </div>

        {/* カルーセル操作用のコントローラー（矢印とドットインジケーター） */}
        <div className="flex justify-center items-center mt-4">
          <button
            onClick={goToPrevious}
            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full"
          >
            &lt;
          </button>
          
          {/* ドットインジケーターの表示 */}
          <div className="flex items-center space-x-2 mx-4">
            {missions.map((_, index) => (
              <div
                key={index}
                // 現在表示中のインデックスだけ青色にする条件付きクラス
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

      {/* ------------------------------------------------------------
        PC用の表示（mdブレークポイント以上で表示）
        縦並びのリスト形式で全てのミッションを表示
        ------------------------------------------------------------
      */}
      <div className="hidden md:block space-y-6">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
          />
        ))}
      </div>
    </div>
  );
};

export default MissionList;