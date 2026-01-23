// /workspaces/my-next-app/src/app/(main)/home/ranking/RankingListItem.tsx

import Image from 'next/image';
import type { UserForRanking } from "@/lib/types/ranking";

// 型定義
type Props = {
  user: UserForRanking;
  isCurrentUser?: boolean; // 自分の行だけハイライトするためのフラグ（省略時はfalse）
};

export default function RankingListItem({ user, isCurrentUser = false }: Props) {
  // スタイル決定ロジック:
  // 自分の場合: 背景色を水色 (#DDFEFF) にし、影 (shadow-md) をつけて目立たせる
  // 他人の場合: ホバー時のみ薄いグレー (hover:bg-slate-50) に変化させる
  const bgColor = isCurrentUser ? 'bg-[#DDFEFF] shadow-md' : 'hover:bg-slate-50';

  return (
    <li className={`flex items-center px-4 py-3 m-0 transition-colors rounded-xl mb-2 ${bgColor}`}>
      
      {/* 1. 順位表示エリア (左側) */}
      <div className="flex items-center justify-center w-12 flex-shrink-0 relative">
        {/* トップ3 (1,2,3位) の場合のみ王冠などのランクアイコンを表示 */}
        {user.rank <= 3 && (
          <img
            src={`/images/rank${user.rank}_icon.png`} // 例: rank1_icon.png
            alt={`${user.rank}位`}
            className="absolute top-0 -left-3 w-8 h-8 object-contain" // 数字の左上に少し被さるように配置
          />
        )}
        {/* 順位の数字 */}
        {/* トップ3はアイコンが目立つので数字はグレー、それ以外はシアン色で表示 */}
        <span className={`font-black text-xl italic ${user.rank <= 3 ? 'text-slate-400' : 'text-cyan-500'}`}>
          {user.rank}
        </span>
      </div>

      {/* 2. ユーザーアイコンエリア */}
      <div className="flex items-center justify-center flex-shrink-0">
        <Image
          src={user.iconUrl}
          alt={`${user.name}のアイコン`}
          // トップ3は少し大きく(48px)、それ以外は標準サイズ(40px)にする演出
          width={user.rank <= 3 ? 48 : 40}
          height={user.rank <= 3 ? 48 : 40}
          className="rounded-full object-cover border border-white shadow-sm"
        />
      </div>

      {/* 3. ユーザー名エリア (中央) */}
      {/* min-w-0 と flex-1 を組み合わせることで、親要素からはみ出さずに truncate を効かせる */}
      <div className="ml-4 font-semibold text-slate-800 flex-1 min-w-0">
        <p className="truncate max-full block">
          {user.name}
        </p>
      </div>

      {/* 4. スコア表示エリア (右側) */}
      {/* flex-shrink-0 で画面が狭くなっても数値が潰れないように確保 */}
      <div className="ml-auto text-right whitespace-nowrap flex-shrink-0">
        <span className="text-[10px] text-blue-400">ランク</span>
        {/* ここで表示しているのは順位(rank)ではなく、スコア/レベル値 */}
        <span className="text-sm font-bold text-blue-400">{user.score}</span>
      </div>
    </li>
  );
}