'use client';

import Image from 'next/image';
import React, { useState } from 'react';

/**
 * PetStatusコンポーネント
 * ユーザーのペット（コハク）のステータス（満腹度など）を表示します。
 */
export default function PetStatus() {
  // 満腹度をパーセンテージで管理（デザイン固定のため今回は66%に設定）
  // 動的にする場合は、useStateやpropsでこの値を受け取る
  const fullnessPercentage = 66;

  // 吹き出しの表示状態とメッセージ
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [speechBubbleMessage, setSpeechBubbleMessage] = useState('');

  // 吹き出しのメッセージリスト
  const messages = [
    'ちょっと何！？',
    'あまり撫でないで禿げるって…！！',
    'ちょっと…くすぐったいって………！！',
    '今日も一日頑張るワン！',
    'zzz...',
  ];

  // ペットクリック時のハンドラ
  const handlePetClick = () => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    setSpeechBubbleMessage(messages[randomIndex]);
    setShowSpeechBubble(true);

    // 3秒後に吹き出しを非表示にする
    setTimeout(() => {
      setShowSpeechBubble(false);
    }, 10000);
  };

  return (
    // 全体を囲むコンテナ
    <div className="flex flex-col items-center gap-6 p-8 bg-white max-w-300 rounded-2xl shadow-lg relative">

      {/* 1. キャラクター画像 */}
      <div onClick={handlePetClick} className="cursor-pointer relative">
        <Image
          src="/images/kohaku.png" 
          alt="コハク"
          width={200}
          height={200}
          className="object-contain"
        />
        {showSpeechBubble && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-blue-500 text-white text-sm rounded-lg shadow-md whitespace-nowrap before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-x-transparent before:border-b-transparent before:border-t-blue-500">
            {speechBubbleMessage}
          </div>
        )}
      </div>

      {/* 2. ラベルテキスト */}
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700">
          コハクの満腹度
        </p>
      </div>

      {/* 3. プログレスバー（満腹度バー） */}
      <div className="w-full">
        {/* バーの背景（トラック） */}
        <div className="h-5 bg-gray-200 rounded-full overflow-hidden relative">
          {/* バーの実際の値（塗りつぶし部分） */}
          <div
            className="h-full bg-amber-400 rounded-full w-2/3"
            // 動的に変更する場合: インラインスタイルでwidthをパーセンテージで指定
            // style={{ width: `${fullnessPercentage}%` }} 
          ></div>
        </div>
      </div>

      {/* 4. アクションボタン */}
      <div className="w-full mt-2">
        <button 
          className="
            w-full py-3 px-6 rounded-full 
            bg-cyan-400 text-white 
            font-bold text-xl 
            shadow-md hover:bg-cyan-500 
            transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50
          "
        >
          餌を探しに行く
        </button>
      </div>

    </div>
  );
}
