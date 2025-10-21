// 'use client' ディレクティブは、このファイルがクライアントサイドで実行されることを示します。
// useState, useRef, useEffect などのフックを使用する場合に必要です。
'use client';

// Reactのコア機能であるuseState, useRef, useEffectをインポートします。
import React, { useState, useRef, useEffect } from 'react';
// Next.jsのImageコンポーネントをインポートします。画像の最適化に利用されます。
import Image from 'next/image';

// --- プロップスの型定義 ---

/**
 * KohakuChat コンポーネントが受け取るプロップスの型を定義するインターフェース。
 */
interface KohakuChatProps {
  messages: { sender: 'user' | 'kohaku'; text: string }[]; // チャットメッセージの履歴（送信者とテキスト）
  onSendMessage: (message: string) => void;                // メッセージ送信時に呼び出される関数
  language: 'ja' | 'en';                                   // 現在の表示言語（日本語 'ja' または英語 'en'）
  textResources: any;                                      // 親コンポーネントから渡される、現在の言語に応じたUIテキスト集
}

// KohakuChat コンポーネントの定義
// このコンポーネントは、コハクとのチャットインターフェースを提供します。
// ユーザーはメッセージを入力してコハクに質問でき、コハクの返信が表示されます。
const KohakuChat: React.FC<KohakuChatProps> = ({ messages, onSendMessage, language, textResources: t }) => {
  // inputMessage: ユーザーが入力中のメッセージを保持するステート
  const [inputMessage, setInputMessage] = useState<string>('');
  // messagesEndRef: チャットメッセージの一番下にあるDOM要素への参照を保持するRef。
  // メッセージが追加された際に自動スクロールするために使用します。
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * `messages` ステートが更新されるたびに実行されるエフェクト。
   * チャットメッセージが追加された際に、ビューを一番下まで自動的にスクロールします。
   */
  useEffect(() => {
    // `messagesEndRef.current`が存在する場合（DOM要素がマウントされている場合）にスクロールを実行
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // スムーズなスクロールアニメーション
  }, [messages]); // `messages`配列が変更されたときにこのエフェクトを再実行

  /**
   * メッセージ送信ボタンがクリックされた時のハンドラ。
   * 入力されたメッセージを親コンポーネントに渡し、入力欄をクリアします。
   */
  const handleSend = () => {
    // 入力メッセージが空白でないことを確認
    if (inputMessage.trim()) {
      onSendMessage(inputMessage); // 親コンポーネントのメッセージ送信ハンドラを呼び出し
      setInputMessage('');         // 入力欄をクリア
    }
  };

  /**
   * 入力欄でキーが押された時のハンドラ。
   * Enterキーが押された場合、メッセージを送信します。
   * @param e キーボードイベントオブジェクト
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { // 押されたキーがEnterキーの場合
      handleSend();           // メッセージ送信ハンドラを呼び出す
    }
  };

  return (
    // コンポーネントの最上位コンテナ。白色の背景、角丸、影、フレックスボックスで縦方向に要素を配置。
    // 高さを最大700pxに制限し、画面幅が広い場合は親要素の高さを継承。
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full max-h-[700px] lg:max-h-full">
      {/* チャットヘッダー部分 */}
      <div className="flex items-center justify-between mb-4">
        {/* コハクのタイトルと画像 */}
        <h2 className="text-xl font-bold text-gray-700 flex items-center">
          {/* Next.jsのImageコンポーネントでコハクの画像を表示。
              public/images/kohaku.png に画像が配置されていることを想定しています。 */}
          <Image src="/images/kohaku.png" alt="コハク" width={40} height={40} className="rounded-full mr-2" />
          {t.kohakuChatTitle} {/* 言語に応じたコハクのチャットタイトル */}
        </h2>
        {/* 現在の言語（トレース表示）のバッジ。画像にはなかったが、参考として残す。 */}
        {/* <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
          {language === 'ja' ? 'トレース' : 'Trace'}
        </span> */}
      </div>

      {/* チャットメッセージ表示エリア */}
      <div className="flex-1 bg-gray-50 p-4 rounded-lg overflow-y-auto mb-4 flex flex-col custom-scrollbar">
        {/* `messages`配列をマップして、各メッセージを表示 */}
        {messages.map((msg, index) => (
          // 各メッセージのコンテナ。送信者（user/kohaku）に応じてスタイルを切り替え。
          <div
            key={index} // Reactのリストレンダリングには一意の`key`が必要
            className={`mb-2 p-2 rounded-lg max-w-[85%] text-sm ${
              msg.sender === 'user' // ユーザーからのメッセージの場合
                ? 'ml-auto bg-blue-500 text-white' // 右寄せ、青背景、白文字
                : 'mr-auto bg-gray-200 text-gray-800' // 左寄せ、灰背景、灰文字
            }`}
          >
            {msg.text} {/* メッセージのテキスト内容 */}
          </div>
        ))}
        {/* 自動スクロールのターゲットとなる空のdiv */}
        <div ref={messagesEndRef} />
      </div>

      {/* チャット入力と送信ボタンのセクション */}
      <div className="flex mt-auto"> {/* `mt-auto`でこのセクションをコンテナの下部に固定 */}
        {/* メッセージ入力欄 */}
        <input
          type="text"
          value={inputMessage} // ステートと入力欄の値を同期
          onChange={(e) => setInputMessage(e.target.value)} // 入力値が変更されたらステートを更新
          onKeyPress={handleKeyPress} // キーが押された時のハンドラ（Enterキーで送信）
          placeholder={t.chatInputPlaceholder} // 言語に応じたプレースホルダーテキスト
          className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {/* 送信ボタン */}
        <button
          onClick={handleSend} // クリックでメッセージ送信ハンドラを呼び出す
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-75"
        >
          {t.sendButton} {/* 言語に応じたボタンテキスト */}
        </button>
      </div>
    </div>
  );
};

export default KohakuChat;