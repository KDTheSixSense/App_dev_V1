'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation'; // next/navigationからインポート

export default function PetStatus() {
  // 満腹度をパーセンテージで管理（デザイン固定のため今回は66%に設定）
  // 動的にする場合は、useStateやpropsでこの値を受け取る
  const fullnessPercentage = 66;

  const router = useRouter();
  return (
    // 全体を囲むコンテナ
    <div className="flex flex-col items-center gap-6 p-8 bg-white max-w-300 rounded-2xl shadow-lg">

      {/* 1. キャラクター画像 */}
      <div>
        <Image
          src="/images/kohaku.png" 
          alt="コハク"
          width={200}
          height={200}
          className="object-contain"
        />
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
          onClick={() => router.push('/issue_list')}
        >
          餌を探しに行く
        </button>
      </div>

    </div>
  );
}