'use client'; // ボタン操作やルーターを使うので、クライアントコンポーネントにする

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UnsubmittedAssignment } from '@/lib/data';

// 親コンポーネントから渡されるPropsの型を定義
interface PetStatusViewProps {
  initialHunger: number;
  maxHunger: number;
  petname: string;
  assignmentCount: number;
  nextAssignment: UnsubmittedAssignment | null;
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

export default function PetStatusView({ initialHunger, maxHunger, petname, assignmentCount, nextAssignment }: PetStatusViewProps) {
  const router = useRouter();

  // ヘルパー関数を呼び出して、現在の状態を取得
  const petInfo = getPetDisplayInfo(initialHunger);

  // プログレスバーのパーセンテージを計算
  const fullnessPercentage = (initialHunger / maxHunger) * 100;

  // 課題リンクの生成ロジック
  let linkPath = '/issue_list';
  if (nextAssignment) {
    if (nextAssignment.programmingProblemId) {
      linkPath = `/group/coding-page/${nextAssignment.programmingProblemId}?assignmentId=${nextAssignment.id}&hashedId=${nextAssignment.groupHashedId}`;
    } else if (nextAssignment.selectProblemId) {
      linkPath = `/group/select-page/${nextAssignment.selectProblemId}?assignmentId=${nextAssignment.id}&hashedId=${nextAssignment.groupHashedId}`;
    } else if (nextAssignment.groupHashedId) {
      // Problem not attached -> Go to Group Member Page
      linkPath = `/group/${nextAssignment.groupHashedId}/member`;
    }
  }

  return (
    <div className="flex flex-col justify-center p-8 bg-[#e0f4f9] rounded-3xl shadow-sm w-full relative overflow-hidden min-h-[400px]">
      {/* Decorative background circles (optional, to match style) */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-cyan-200 blur-2xl opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-blue-200 blur-2xl opacity-40 pointer-events-none"></div>

      {/* 1. Character Circle Frame */}
      <div className="flex mx-6 justify-center items-center gap-10 mb-5">
        <div className="min-w-50 min-h-50 rounded-full bg-white p-1.5 shadow-xl">
          <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden border-4 border-white relative">
            {/* Background behind pet inside circle */}
            <div className="absolute inset-0 bg-[url('/images/tech_circle_bg.png')] opacity-20 animate-spin-slow"></div>
            {/* Note: User didn't provide tech_circle_bg.png, so we use a dark gradient or similar */}
            <div className="absolute inset-0"></div>

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

      

      {/* 5. Due Tasks Section (Integrated) */}
      <div className="w-full bg-white rounded-2xl shadow-sm p-6 relative z-10">
        <h3 className="text-lg font-bold text-slate-800 mb-4">提出期限が近い課題</h3>

        {assignmentCount > 0 ? (
          <div className='flex items-center'>
            <div className="flex flex-col w-full">
              <div className="w-full text-left p-3 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-700 text-lg mb-1 truncate">{nextAssignment?.title || '未提出の課題'}</p>
              </div>
              <div className='text-center'>
                <p className="text-sm text-slate-500">他 {assignmentCount - 1} 件</p>
              </div>
            </div>
            <div className='flex justify-center items-center w-50 h-10'>
              <Link href={linkPath} className="!no-underline bg-gradient-to-r from-sky-400 to-cyan-500 !text-white px-5 rounded-full font-bold flex items-center gap-2 transition-colors shadow-md w-full h-full">
                <span>課題を解く</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="transform rotate-0">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-4">
            現在、提出期限が近い課題はありません
          </div>
        )}
      </div>

    </div>
  );
}
