// RankingListItemのPropsの型定義
type UserForRanking = {
  id: number;
  rank: number;
  name: string;
  avatarUrl: string;
  score: number;
};

type Props = {
  user: UserForRanking;
};

// このコンポーネントは受け取ったpropsを表示するだけなので変更不要
export default function RankingListItem({ user }: Props) {
  return (
    <li className="flex items-center p-3 transition-colors rounded-lg m-0">
      {/* ランクと王冠 */}
      <div className="flex items-center justify-center w-12 shrink-0">
        {/* ランク */}
        <span className="text-slate-500 font-medium">{user.rank}</span>
      </div>
      {/*アイコン */}
      <div className="flex items-center justify-center w-12">
        <a href="profile">
          <img
            src={user.avatarUrl}
            alt={`${user.name}のアイコン`}
            className="w-12 h-12 rounded-full object-cover"
          />
          </a>
      </div>
      {/* ユーザー名 */}
      <div className="ml-4">
        <a href="profile" className="font-semibold text-slate-800 ">{user.name} さん</a>
      </div>
      
      {/* スコア */}
      <div className="ml-auto text-right">
        <p className="text-sm font-medium text-slate-600">ランク {user.score}</p>
      </div>
    </li>
  );
}