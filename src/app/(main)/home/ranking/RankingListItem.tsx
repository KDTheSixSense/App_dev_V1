import Image from 'next/image';
import Link from 'next/link';
import type { UserForRanking } from "@/lib/types/ranking"; // 型定義をインポート

// 型定義
type Props = {
  user: UserForRanking;
  isCurrentUser?: boolean; // isCurrentUserプロパティを追加
};

export default function RankingListItem({ user, isCurrentUser = false }: Props) {
  // isCurrentUserがtrueなら背景色を変える
  const bgColor = isCurrentUser ? 'bg-[#DDFEFF] shadow-md' : 'hover:bg-slate-50';

  return (
    <li className={`flex items-center px-4 py-3 m-0 transition-colors rounded-xl mb-2 ${bgColor}`}>
      {/* Rank Icon or Checkbox */}
      <div className="flex items-center justify-center w-12 flex-shrink-0 relative">
        {user.rank <= 3 && (
          <img
            src={`/images/rank${user.rank}_icon.png`}
            alt={`${user.rank}位`}
            className="absolute top-0 -left-3 w-8 h-8 object-contain"
          />
        )}
        <span className={`font-black text-xl italic ${user.rank <= 3 ? 'text-slate-400' : 'text-cyan-500'}`}>
          {user.rank}
        </span>
      </div>

      <div className="flex items-center justify-center">
        <Image
          src={user.iconUrl}
          alt={`${user.name}のアイコン`}
          width={user.rank <= 3 ? 48 : 40}
          height={user.rank <= 3 ? 48 : 40}
          className="rounded-full object-cover border border-white shadow-sm"
        />
      </div>

      <div className="ml-4 font-semibold text-slate-800">
        <p className="truncate max-w-[150px] block">
          {user.name}
        </p>
      </div>

      <div className="ml-auto text-right">
        <p className="text-sm font-bold text-[#00BCD4]">ランク{user.score}</p>
      </div>
    </li>
  );
}