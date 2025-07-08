import RankingListItem from "./RankingListItem";
import type { UserForRanking } from "@/lib/types/ranking"; // 型定義をインポート
// 型定義
type Props = {
  users: UserForRanking[];
  myRankInfo: UserForRanking | null; // 自分のランク情報も受け取る
};

export default function RankingList({ users, myRankInfo }: Props) {
  return (
    <div className="mt-4">
      <ul className="space-y-2">
        {users.map((user) => (
          <RankingListItem 
            key={user.id} 
            user={user} 
            // 表示するユーザーがログイン中のユーザーと一致するか判定
            isCurrentUser={user.id === myRankInfo?.id} 
          />
        ))}
      </ul>
    </div>
  );
}