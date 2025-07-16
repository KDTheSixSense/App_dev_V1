// src/components/KohakuChat.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Sparkles } from 'lucide-react';

// --- プロップスの型定義 ---
interface KohakuChatProps {
  messages: { sender: 'user' | 'kohaku'; text: string }[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  language: 'ja' | 'en';
  textResources: any;
}

/**
 * コハクとのチャットインターフェースを提供するコンポーネント
 */
const KohakuChat: React.FC<KohakuChatProps> = ({ messages, onSendMessage, isLoading, language, textResources: t }) => {
  const [inputMessage, setInputMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが追加されるか、ローディング状態が変わったら一番下までスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // メッセージ送信処理
  const handleSend = () => {
    // 入力があり、かつローディング中でない場合のみ送信
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  // Enterキーでの送信処理
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
                ? 'ml-auto bg-blue-500 text-white'
                : 'mr-auto bg-gray-200 text-gray-800'
            }`}
          >
            {msg.text}
          </div>
        ))}
        
        {/* AIが応答中のローディングインジケーター */}
        {isLoading && (
          <div className="mr-auto flex items-center space-x-2 p-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          </div>
        )}
        {/* 自動スクロールの終点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* チャット入力エリア */}
      <div className="flex mt-auto">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t.chatInputPlaceholder}
          className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-75 disabled:bg-gray-400"
          disabled={isLoading}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default KohakuChat;
