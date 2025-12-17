import RankingListItem from "./RankingListItem";
import type { UserForRanking } from "@/lib/types/ranking"; // 型定義をインポート

// 型定義
type Props = {
  users: UserForRanking[];
  myRankInfo: UserForRanking | null; // 自分のランク情報も受け取る
};

export default function RankingList({ users, myRankInfo }: Props) {
  return (
    <div className="mt-4 flex-1 overflow-hidden bg-[#fff] rounded-2xl">
      <ul className="space-y-2 h-full overflow-y-auto pr-2 custom-scrollbar">
        {users.map((user) => (
          <RankingListItem
            key={user.id}
            user={user}
            isCurrentUser={user.id === myRankInfo?.id}
          />
        ))}
      </ul>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}