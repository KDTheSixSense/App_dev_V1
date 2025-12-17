'use client'; // ボタン操作やルーターを使うので、クライアントコンポーネントにする

import Image from 'next/image';
import { useRouter } from 'next/navigation';

// 親コンポーネントから渡されるPropsの型を定義
interface PetStatusViewProps {
  initialHunger: number;
  maxHunger: number;
  petname: string;
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

export default function PetStatusView({ initialHunger, maxHunger, petname }: PetStatusViewProps) {
  const router = useRouter();

  // ヘルパー関数を呼び出して、現在の状態を取得
  const petInfo = getPetDisplayInfo(initialHunger);

  // プログレスバーのパーセンテージを計算
  const fullnessPercentage = (initialHunger / maxHunger) * 100;

  return (
    <div className="flex flex-col justify-center p-8 bg-[#e0f4f9] rounded-3xl shadow-sm w-full relative overflow-hidden min-h-[400px]">
      {/* Decorative background circles (optional, to match style) */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-cyan-200 blur-2xl opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-blue-200 blur-2xl opacity-40 pointer-events-none"></div>

      {/* 1. Character Circle Frame */}
      <div className="flex mx-6 justify-center items-center gap-10">
        <div className="min-w-50 min-h-50 rounded-full bg-gradient-to-b from-cyan-300 to-blue-400 p-1.5 shadow-xl">
          <div className="w-full h-full rounded-full bg-[#1e293b] flex items-center justify-center overflow-hidden border-4 border-white relative">
            {/* Background behind pet inside circle */}
            <div className="absolute inset-0 bg-[url('/images/tech_circle_bg.png')] opacity-20 animate-spin-slow"></div>
            {/* Note: User didn't provide tech_circle_bg.png, so we use a dark gradient or similar */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800"></div>

            <Image
              src={petInfo.image}
              alt={petname}
              width={200}
              height={200}
              className="object-cover relative z-10 transform scale-110 translate-y-2"
            />
          </div>
        </div>
      
        <div className='relative w-100 mx-5 justify-center'>
          {/*満腹度ゲージ */}
          <div className="w-full max-w-sm mb-8 text-center">
            <h2 className="text-xl font-bold text-slate-700 mb-2">{petname}の満腹度</h2>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-center">
                <div className="text-center w-full">
                  <span className="text-3xl font-bold inline-block text-slate-700">
                    {initialHunger} / {maxHunger}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-[#B2EBF2]">
                <div
                  style={{ width: `${fullnessPercentage}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-out ${petInfo.colorClass}`}
                ></div>
              </div>
            </div>
          </div>

          {/* 4. Action Button */}
          <div className="w-full max-w-sm">
            <button
              className="w-full py-4 rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 text-white font-bold text-xl shadow-[0_4px_14px_0_rgba(38,198,218,0.39)] hover:shadow-[0_6px_20px_rgba(38,198,218,0.23)] hover:scale-[1.02] transform transition-all active:scale-95"
              onClick={() => router.push('/issue_list')}
            >
              エサを探しに行く
            </button>
          </div>
        </div>


      </div>

      

    </div>
  );
}
