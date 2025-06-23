import Image from 'next/image';
import { Crown } from 'lucide-react'; // アイコンをインポート

// TypeScript用の型定義
type User = {
  id: number;
  rank: number;
  name: string;
  avatarUrl: string;
  score: number;
};

type Props = {
  user: User;
};

// ランクに応じた王冠の色を返すヘルパー関数
const getCrownColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-slate-400';
  if (rank === 3) return 'text-orange-400';
  return 'text-transparent'; // 4位以下は表示しない
};

export default function RankingListItem({ user }: Props) {
  return (
    <li className="flex items-center p-3 transition-colors hover:bg-slate-50 rounded-lg">
      {/* ランクと王冠 */}
      <div className="flex items-center justify-center w-12 shrink-0">
        {user.rank <= 3 ? (
          <Crown className={`w-6 h-6 ${getCrownColor(user.rank)}`} fill="currentColor" />
        ) : (
          <span className="text-slate-500 font-medium">{user.rank}</span>
        )}
      </div>
      
      {/* アバター */}
      <div className="shrink-0 ml-2">
        <Image
          src={user.avatarUrl}
          alt={user.name}
          width={48}
          height={48}
          className="rounded-full"
        />
      </div>

      {/* ユーザー名 */}
      <div className="ml-4">
        <p className="font-semibold text-slate-800">{user.name} さん</p>
      </div>
      
      {/* ランク（スコア） */}
      <div className="ml-auto text-right">
        <p className="text-sm font-medium text-slate-600">ランク {user.score}</p>
      </div>
    </li>
  );
}