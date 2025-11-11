// src/components/KohakuChat.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Sparkles } from 'lucide-react';
import Link from 'next/link';


// --- 型定義 ---
interface KohakuChatProps {
  messages: { sender: 'user' | 'kohaku'; text: string }[];
  onSendMessage: (message: string) => void;
  language: 'ja' | 'en';
  textResources: any;
  isLoading: boolean;
  isDisabled?: boolean; // ★ 修正点: `isDisabled` プロパティを（任意で）受け取れるように追加
  credits?: number;     // ★ 追加: 残りクレジット数を表示するために追加
}

const KohakuChat: React.FC<KohakuChatProps> = ({
  messages,
  onSendMessage,
  language,
  textResources: t,
  isLoading,
  isDisabled = false, // デフォルト値を false に設定
  credits,
}) => {
  const [inputMessage, setInputMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (isLoading || isDisabled || !inputMessage.trim()) return;
    onSendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
      {/* チャットヘッダー部分 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-700 flex items-center">
          <Image src="/images/kohaku.png" alt="コハク" width={40} height={40} className="rounded-full mr-2" />
          {t.kohakuChatTitle}
        </h2>
        {typeof credits !== 'undefined' && (
          <div className="mt-1">
            <p className="text-sm text-gray-600">
              AIアドバイス残り回数: <span className="font-bold text-lg text-blue-600">{credits}</span> 回
            </p>
            {credits <= 0 && (
              <Link href="/profile" className="text-xs text-blue-500 hover:underline">
                (XPを消費して増やす)
              </Link>
            )}
          </div>
        )}
      </div>

      {/* チャットメッセージ表示エリア */}
      <div className="flex-1 bg-gray-50 p-4 rounded-lg overflow-y-auto mb-4 flex flex-col custom-scrollbar">
        {messages.map((msg, index) => (
          // 各メッセージのコンテナ
          <div
            key={index}
            // ★★★ whitespace-pre-wrap を追加して改行を反映 ★★★
            className={`mb-2 p-3 rounded-lg max-w-[85%] text-sm whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'ml-auto bg-cyan-500 text-white border border-cyan-700'
                : 'mr-auto bg-gray-200 text-gray-800'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && <div className="text-center text-gray-500">...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="p-3 border-t">
        <div className="flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isDisabled ? t.noCreditsPlaceholder : t.chatInputPlaceholder}
            // ★ 修正点: `isDisabled` プロパティを使って入力を無効化
            disabled={isDisabled || isLoading}
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            // ★ 修正点: `isDisabled` プロパティを使ってボタンを無効化
            disabled={isDisabled || isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {t.sendButton}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KohakuChat;

