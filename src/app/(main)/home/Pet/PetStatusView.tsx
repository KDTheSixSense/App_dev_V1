'use client'; // ボタン操作やルーターを使うので、クライアントコンポーネントにする

import Image from 'next/image';
import { useRouter } from 'next/navigation';

// 親コンポーネントから渡されるPropsの型を定義
interface PetStatusViewProps {
  initialHunger: number;
  maxHunger: number;
}

export default function PetStatusView({ initialHunger, maxHunger }: PetStatusViewProps) {
  const router = useRouter();

  // プログレスバーのパーセンテージを計算
  const fullnessPercentage = (initialHunger / maxHunger) * 100;

  return (
    // --- ▼▼▼ ここのクラス名を修正しました ▼▼▼ ---
    // max-w-sm と mx-auto を削除し、親要素の幅に追従するようにしました
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-lg">

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
        <div className="h-5 bg-gray-200 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${fullnessPercentage}%` }} 
          ></div>
        </div>
        <div className="text-right text-sm font-mono text-gray-500 mt-1">
            {initialHunger} / {maxHunger}
        </div>
      </div>

      {/* 4. アクションボタン */}
      <div className="w-full mt-2">
        <button 
          className="w-full py-3 px-6 rounded-full bg-cyan-400 text-white font-bold text-xl shadow-md hover:bg-cyan-500 transition-colors"
          onClick={() => router.push('/issue_list')} // useRouterを使ってページ遷移
        >
          餌を探しに行く
        </button>
      </div>

    </div>
  );
}
