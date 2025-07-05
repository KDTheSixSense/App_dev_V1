import Image from 'next/image';

// RankingListItemのPropsの型定義
type UserForRanking = {
  id: number;
  rank: number;
  name: string;
  iconUrl: string;
  score: number;
};

type Props = {
  user: UserForRanking;
};

const renderRankIcon = (rank: number) => {
  let iconSrc = '';

  if (rank === 1) {
    // 1位の王冠画像
    iconSrc = '/images/rank1_icon.png'; 
  } else if (rank === 2) {
    // 2位の王冠画像
    iconSrc = '/images/rank2_icon.png'; 
  } else if (rank === 3) {
    // 3位の王冠画像
    iconSrc = '/images/rank3_icon.png';  
  }

  // 1~3位以外は何もしない
  if (!iconSrc) {
    return null;
  }

  // 画像があればImageコンポーネントを返す
  return (
    <Image
      src={iconSrc}
      alt={`${rank}位の王冠`}
      width={24} // 表示サイズは適宜調整
      height={24}
    />
  );
};

// このコンポーネントは受け取ったpropsを表示するだけなので変更不要
export default function RankingListItem({ user }: Props) {
  return (
    <li className="flex items-center p-3 transition-colors rounded-lg m-0">
      {/* ランクと王冠 */}
      <div className="flex items-center justify-end w-20 shrink-0 gap-4 pr-5"> 
        {/* ヘルパー関数を呼び出して王冠を表示 */}
        {renderRankIcon(user.rank)}
        {/* ランク */}
        <span className="text-slate-500 font-medium">{user.rank}</span>
      </div>
      {/*アイコン */}
      <div className="flex items-center justify-center w-12">
        <a href="profile">
          <img
            src={user.iconUrl}
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