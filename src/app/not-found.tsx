'use client'; // Stateを使うためクライアントコンポーネント化

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// 3Dシーンは重いのでダイナミックインポート（遅延読み込み）
// SSRは不要なので false
const Scene404 = dynamic(() => import('@/components/Scene404'), { 
  ssr: false,
  loading: () => <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">Loading World...</div>
});

export default function NotFound() {
  const [is3DMode, setIs3DMode] = useState(false);

  // 3DモードがONならSceneを表示
  if (is3DMode) {
    return <Scene404 onBack={() => setIs3DMode(false)} />;
  }

  // デフォルトは既存の2D画面を表示
  return (
    <div className="min-h-screen bg-[#D3F7FF] flex flex-col items-center justify-center text-slate-700 p-4 animate-in fade-in duration-500">
      {/* コハクのアイコン */}
      <div className="relative w-24 h-24 mb-6">
        <Image
          src="/images/Kohaku/kohaku-starving.png"
          alt="404 Kohaku"
          fill
          className="object-cover rounded-full border-4 border-white shadow-lg"
        />
      </div>

      <h2 className="text-4xl font-bold mb-2 text-[#575E75]">404 Not Found</h2>
      <p className="text-lg mb-8 text-center text-slate-600 font-bold">
        お探しのページは見つかりませんでした。<br />
        削除されたか、URLが間違っている可能性があります。
      </p>

      {/* ボタンエリア */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 既存のホームへ戻るボタン */}
        <Link
          href="/home"
          className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105 text-center"
        >
          ホームに戻る
        </Link>

        {/* 新規：3D世界へ行くボタン */}
        <button
          onClick={() => setIs3DMode(true)}
          className="bg-slate-700 text-cyan-300 border-2 border-cyan-500 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-slate-800 hover:text-cyan-200 transition-transform transform hover:scale-105 flex items-center justify-center gap-2 group"
        >
          <span>🚀</span>
          この世界を探索する
        </button>
      </div>
    </div>
  );
}