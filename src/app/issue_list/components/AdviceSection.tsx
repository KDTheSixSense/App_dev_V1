// src/app/questions/components/AdviceSection.tsx
'use client'; // useStateやImageコンポーネントを使うため、クライアントコンポーネントであることを明示

import React, { useState } from 'react';
import Image from 'next/image'; // next/image をインポート

const AdviceSection: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([
    "こんにちは！何かお手伝いできることはありますか？",
    "問題作成の手順で困っていることはありませんか？",
    "餌を探しに行く？面白いですね！",
    // 必要に応じて初期メッセージを追加
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, inputMessage]);
      setInputMessage('');
      // ここで実際のチャットボットAPIへのリクエストなどを実装できます
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 text-gray-700">コハクからのアドバイス</h2>

      {/* コハクの画像 */}
      <div className="flex justify-center mb-6">
        {/* 画像のパスは public ディレクトリからの相対パスになります */}
        <Image
          src="/images/kohaku.png" // public/images/kohaku.png に画像がある場合
          alt="コハク"
          width={250} // 画像の実際のサイズに合わせて調整してください
          height={250} // 画像の実際のサイズに合わせて調整してください
          className="rounded-full object-cover" // 必要に応じてスタイリング
        />
      </div>

      {/* 満足度バー（適当な値を設定） */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-2">満足度</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '70%' }}></div> {/* 例: 70% */}
        </div>
      </div>

      {/* 顔を探しに行くボタン */}
      <button className="w-full py-3 px-4 mb-4 bg-blue-400 text-white font-semibold rounded-lg shadow-sm
                         hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-75
                         transition-colors duration-200">
        餌を探しに行く
      </button>

      {/* チャットメッセージ表示エリア */}
      <div className="flex-1 bg-blue-100 p-4 rounded-lg overflow-y-auto mb-4 custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 text-sm text-gray-800">
            {index % 2 === 0 ? (
              <span className="font-bold text-blue-700">コハク: </span> // 奇数番目はコハクからのメッセージ
            ) : (
              <span className="font-bold text-green-700">あなた: </span> // 偶数番目はユーザーからのメッセージ（適当な表示）
            )}
            {msg}
          </div>
        ))}
      </div>

      {/* チャット入力と送信ボタン */}
      <div className="flex mt-auto"> {/* mt-auto で下部に固定 */}
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-75"
        >
          送信
        </button>
      </div>
    </div>
  );
};

export default AdviceSection;