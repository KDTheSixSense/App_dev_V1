import Image from 'next/image';
import Link from 'next/link';
import type { UserForRanking } from "@/lib/types/ranking"; // 型定義をインポート

// 型定義
type Props = {
  user: UserForRanking;
  isCurrentUser?: boolean; // isCurrentUserプロパティを追加
};

export default function RankingListItem({ user, isCurrentUser = false }: Props) {
  const renderRankIcon = (rank: number) => {
    let iconSrc = '';
    if (rank === 1) iconSrc = '/images/rank1_icon.png';
    else if (rank === 2) iconSrc = '/images/rank2_icon.png';
    else if (rank === 3) iconSrc = '/images/rank3_icon.png';
    
    if (!iconSrc) return null;
    return <Image src={iconSrc} alt={`${rank}位の王冠`} width={24} height={24} unoptimized />;
  };

  // isCurrentUserがtrueなら背景色を変える
  const bgColor = isCurrentUser ? 'bg-[#DDFEFF] shadow-md' : 'hover:bg-slate-50';

  return (
    <li className={`flex items-center p-3 m-0 transition-colors rounded-lg ${bgColor}`}>
      <div className="relative flex items-center justify-end w-20 shrink-0 pr-5"> {/* relativeを追加 */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2"> {/* アイコンを絶対配置 */}
          {renderRankIcon(user.rank)}
        </div>
        <span className="text-slate-500 font-bold text-lg">{user.rank}</span>
      </div>
      
      <div className="flex items-center justify-center w-12 h-12">
        <Link href={`/users/${user.id}`}>
          <Image
            src={user.iconUrl}
            alt={`${user.name}のアイコン`}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        </Link>
      </div>

      <div className="ml-4 font-semibold text-slate-800">
        <p className="truncate max-w-[150px] block">
          {user.name}
        </p>
      </div>
      
      <div className="ml-auto text-right">
        <p className="text-sm font-medium text-slate-600">ランク {user.score}</p>
      </div>
    </li>
  );
}