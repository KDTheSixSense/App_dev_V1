'use client';

import { Status_Kohaku } from '@prisma/client';
import Image from 'next/image';
import React, { useState } from 'react';

// 1. Propsの型定義： 親コンポーネントから渡されるデータの型を定義します

//DBからコハクの情報を取得してるから現在何も表示されない

interface PetStatusProps {
  status: Status_Kohaku[] | null;
}

/**
 * PetStatusコンポーネント
 * ユーザーのペット（コハク）のステータスを表示します。
 * 親コンポーネントから渡された動的なデータを表示します。
 */
const PetStatus: React.FC<PetStatusProps> = ({ status }) => {
  // ペットのステータスは配列で渡される可能性があるため、最初のものを取得します
  const petStatus = status && status.length > 0 ? status[0] : null;
  
  // 2. Propsから渡された動的な満腹度を使用します
  const fullnessPercentage = petStatus ? petStatus.hungerlevel : 0;

  // 吹き出しの表示状態とメッセージを管理
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

  // ペットクリック時の処理
  const handlePetClick = () => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    setSpeechBubbleMessage(messages[randomIndex]);
    setShowSpeechBubble(true);
    // 3秒後に吹き出しを非表示にする
    setTimeout(() => {
      setShowSpeechBubble(false);
    }, 3000);
  };

  // ペット情報がない場合は、その旨を表示します
  if (!petStatus) {
    return (
        <div className="flex flex-col items-center gap-6 p-8 bg-white max-w-xs mx-auto rounded-2xl shadow-lg relative">
            <p className="text-gray-500">ペットの情報がありません。</p>
        </div>
    );
  }

  return (
    // 全体を囲むコンテナ
    <div className="flex flex-col items-center gap-6 p-8 bg-white max-w-xs mx-auto rounded-2xl shadow-lg relative">

      {/* 1. キャラクター画像と吹き出し */}
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
        <div className="h-5 bg-gray-200 rounded-full overflow-hidden">
          {/* 3. 動的な満腹度をインラインスタイルで反映させます */}
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${fullnessPercentage}%` }} 
          ></div>
        </div>
      </div>

      {/* 4. アクションボタン */}
      <div className="w-full mt-2">
        <button 
          className="w-full py-3 px-6 rounded-full bg-cyan-400 text-white font-bold text-xl shadow-md hover:bg-cyan-500 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
        >
          餌を探しに行く
        </button>
      </div>
    </div>
  );
};

export default PetStatus;
