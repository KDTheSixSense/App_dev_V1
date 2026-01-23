// app/(main)/home/Pet/PetStatusView.tsx

'use client'; // ユーザーインタラクション（ボタンクリック）やフックを使用するためクライアントコンポーネントとして定義

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UnsubmittedAssignment } from '@/lib/data';
import { SubjectProgress } from '../../../../components/kohakuUtils';

// 親コンポーネントから渡されるPropsの型を定義
// ペットの状態表示に必要なすべてのデータを受け取ります
interface PetStatusViewProps {
  initialHunger: number;
  maxHunger: number;
  petname: string;
  subjectProgress?: SubjectProgress[]; // 進化状態を判定するために追加
  userLevel: number; // レベル判定用に追加（進化条件）
  assignmentCount: number; // 未提出課題の総数
  nextAssignment: UnsubmittedAssignment | null; // 直近の課題データ
  evolutionType?: string | null; // DB保存済みの進化タイプ（例: "A-B"など）
}

/**
 * 満腹度に応じて、ステータス設定（表情サフィックス、テキスト、色、旧画像）を返すヘルパー関数
 * UIの条件分岐をこの関数に集約しています
 * @param hungerLevel 現在の満腹度
 */
const getStatusConfig = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return {
      suffix: 'smile', // 画像ファイル名の接尾辞（進化後用）
      legacyImage: '/images/Kohaku/kohaku-full.png', // 進化前の画像パス
      statusText: '満腹',
      colorClass: 'bg-gradient-to-r from-green-400 to-lime-500', // ゲージの色: 緑
    };
  } else if (hungerLevel >= 100) {
    return {
      suffix: 'base',
      legacyImage: '/images/Kohaku/kohaku-normal.png',
      statusText: '普通',
      colorClass: 'bg-gradient-to-r from-sky-400 to-cyan-500',   // ゲージの色: 水色
    };
  } else if (hungerLevel >= 50) {
    return {
      suffix: 'cry',
      legacyImage: '/images/Kohaku/kohaku-hungry.png',
      statusText: '空腹',
      colorClass: 'bg-gradient-to-r from-amber-400 to-orange-500', // ゲージの色: オレンジ
    };
  } else {
    return {
      suffix: 'death',
      legacyImage: '/images/Kohaku/kohaku-starving.png',
      statusText: '死にかけ…',
      colorClass: 'bg-gradient-to-r from-red-500 to-rose-600', // ゲージの色: 赤
    };
  }
};

export default function PetStatusView({ initialHunger, maxHunger, petname, subjectProgress, userLevel, assignmentCount, nextAssignment, evolutionType }: PetStatusViewProps) {
  const router = useRouter();

  // 1. 現在のステータス設定を取得（色や表情サフィックスなど）
  const statusConfig = getStatusConfig(initialHunger);

  // 2. プログレスバーの長さ（パーセンテージ）を計算
  const fullnessPercentage = (initialHunger / maxHunger) * 100;

  // 3. 表示する画像の決定ロジック
  // 初期値は「進化前（レガシー）」の画像をセット
  let displayImage = statusConfig.legacyImage;

  // レベル30以上の場合のみ「進化画像」ロジックを適用
  if (userLevel >= 30) {
    // A. 進化のベース画像を取得 (デフォルトはnormal)
    let evolvedBaseImage = '/images/Kohaku/kohaku-normal.png';

    if (evolutionType) {
      // DBに保存された進化タイプがあればそれを使用 (例: "A-B" -> "/images/evolution/A-B-base.png")
      evolvedBaseImage = `/images/evolution/${evolutionType}-base.png`;
    }
    
    // B. 進化している場合（normal以外）、表情差分を適用
    // ファイル名の 'base.png' 部分を、現在の状態に応じたサフィックス（smile.pngなど）に置換して表情を変える
    if (evolvedBaseImage !== '/images/Kohaku/kohaku-normal.png') {
      displayImage = evolvedBaseImage.replace('base.png', `${statusConfig.suffix}.png`);
    }
  }

  // 4. 「課題を解く」ボタンのリンク先決定ロジック
  // 課題の種類（プログラミング、選択式、その他）によって遷移先を振り分け
  let linkPath = '/issue_list'; // デフォルトは課題一覧
  if (nextAssignment) {
    if (nextAssignment.programmingProblemId) {
      // プログラミング課題ページへ
      linkPath = `/group/coding-page/${nextAssignment.programmingProblemId}?assignmentId=${nextAssignment.id}&hashedId=${nextAssignment.groupHashedId}`;
    } else if (nextAssignment.selectProblemId) {
      // 選択式課題ページへ
      linkPath = `/group/select-page/${nextAssignment.selectProblemId}?assignmentId=${nextAssignment.id}&hashedId=${nextAssignment.groupHashedId}`;
    } else if (nextAssignment.groupHashedId) {
      // 問題IDがない場合はグループメンバーページへ（フォールバック）
      linkPath = `/group/${nextAssignment.groupHashedId}/member`;
    }
  }

  return (
    <div className="flex flex-col justify-center p-8 bg-gradient-to-r from-[#e0f4f9] to-cyan-100 rounded-3xl shadow-sm w-full relative overflow-hidden min-h-[400px]">
      {/* 装飾用の背景円（右下と左上） */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-cyan-200 blur-2xl opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-blue-200 blur-2xl opacity-40 pointer-events-none"></div>

      {/* 上部エリア: キャラクター表示と満腹度ゲージ */}
      <div className="flex flex-col lg:flex-row mx-6 justify-center items-center gap-10 mb-5">
        
        {/* 左側: キャラクター画像エリア */}
        <div className="min-w-50 min-h-50 rounded-full bg-white p-1.5 shadow-xl">
          <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden border-4 border-white relative">
            {/* キャラの背景演出（回転アニメーション） */}
            <div className="absolute inset-0 bg-[url('/images/tech_circle_bg.png')] opacity-20 animate-spin-slow"></div>
            <div className="absolute inset-0"></div>

            {/* ペット画像本体 */}
            <Image
              src={displayImage}
              alt={petname}
              width={200}
              height={200}
              // scale-110 と translate-y-2 で枠内にうまく収まるよう微調整されている
              className="object-cover relative z-10 transform scale-110 translate-y-2"
            />
          </div>
        </div>
      
        {/* 右側: 満腹度情報とボタン */}
        <div className='relative w-full mx-5 justify-center'>
          {/* 満腹度ゲージ */}
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
              {/* プログレスバー本体 */}
              <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-[#B2EBF2]">
                <div
                  style={{ width: `${fullnessPercentage}%` }}
                  // statusConfig.colorClass で状態に応じた色（赤〜緑）を適用
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-out ${statusConfig.colorClass}`}
                ></div>
              </div>
            </div>
          </div>

          {/* エサを探しに行く（課題一覧へ）ボタン */}
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

      {/* 下部エリア: 提出期限が近い課題のカード */}
      <div className="w-full bg-white rounded-2xl shadow-sm p-6 relative z-10">
        <h3 className="text-lg font-bold text-slate-800 mb-4">提出期限が近い課題</h3>

        {assignmentCount > 0 ? (
          <div className='flex items-center'>
            {/* 課題情報テキスト */}
            <div className="flex flex-col w-full">
              <div className="w-full text-left p-3 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-700 text-lg mb-1 truncate">{nextAssignment?.title || '未提出の課題'}</p>
              </div>
              <div className='text-center'>
                <p className="text-sm text-slate-500">他 {assignmentCount - 1} 件</p>
              </div>
            </div>
            
            {/* 課題へ飛ぶリンクボタン */}
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
          /* 課題がない場合の表示 */
          <div className="text-center text-slate-500 py-4">
            現在、提出期限が近い課題はありません
          </div>
        )}
      </div>

    </div>
  );
}