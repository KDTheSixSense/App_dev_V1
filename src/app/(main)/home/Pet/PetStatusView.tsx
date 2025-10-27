'use client'; // ボタン操作やルーターを使うので、クライアントコンポーネントにする

import Image from 'next/image';
import { useRouter } from 'next/navigation';

// 親コンポーネントから渡されるPropsの型を定義
interface PetStatusViewProps {
  initialHunger: number;
  maxHunger: number;
}

/**
 * 満腹度に応じて、表示するコハクの画像パスとステータステキストを返すヘルパー関数
 * @param hungerLevel 現在の満腹度
 * @returns { image: string, statusText: string }
 */
const getPetDisplayInfo = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return {
      image: '/images/Kohaku/kohaku-full.png',      // 満腹の画像
      statusText: '満腹',
      colorClass: 'bg-gradient-to-r from-green-400 to-lime-500', // 緑色
    };
  } else if (hungerLevel >= 100) {
    return {
      image: '/images/Kohaku/kohaku-normal.png',    // 普通の画像
      statusText: '普通',
      colorClass: 'bg-gradient-to-r from-sky-400 to-cyan-500',   // 水色
    };
  } else if (hungerLevel >= 50) {
    return {
      image: '/images/Kohaku/kohaku-hungry.png',    // 空腹の画像
      statusText: '空腹',
      colorClass: 'bg-gradient-to-r from-amber-400 to-orange-500', // オレンジ色
    };
  } else {
    return {
      image: '/images/Kohaku/kohaku-starving.png',  // 死にかけの画像
      statusText: '死にかけ…',
      colorClass: 'bg-gradient-to-r from-red-500 to-rose-600', // 赤色
    };
  }

};

export default function PetStatusView({ initialHunger, maxHunger }: PetStatusViewProps) {
  const router = useRouter();

  // ヘルパー関数を呼び出して、現在の状態を取得
  const petInfo = getPetDisplayInfo(initialHunger);

  // プログレスバーのパーセンテージを計算
  const fullnessPercentage = (initialHunger / maxHunger) * 100;

  return (
    <div className="flex flex-col items-center h-100 gap-2 p-5 bg-white rounded-2xl shadow-lg">

      {/* 1. キャラクター画像 */}
      <div>
        <Image
          src={petInfo.image} 
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
            className={`h-full rounded-full transition-all duration-500 ease-out ${petInfo.colorClass}`}
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
          className="w-full py-3 px-6 rounded-full bg-[#68F3FF] text-[#fff] font-bold text-xl shadow-md hover:bg-[#83F7FF] transition-colors"
          onClick={() => router.push('/issue_list')} // useRouterを使ってページ遷移
        >
          餌を探しに行く
        </button>
      </div>

    </div>
  );
}
