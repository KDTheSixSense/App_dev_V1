import RankingListItem from "./RankingListItem";

// 型定義（rankedUsersの型に合わせる）
type UserForRanking = {
  id: number;
  rank: number;
  name: string;
  iconUrl: string;
  score: number;
};

type Props = {
  users: UserForRanking[];
};

export default function RankingList({ users }: Props) {
  return (
    <div className="mt-4">
      <ul className="space-y-2">
        {/* このコンポーネントは渡された配列をループするだけなので変更不要 */}
        {users.map((user) => (
          <RankingListItem key={user.id} user={user} />
        ))}
      </ul>
    </div>
  );
}