import RankingListItem from "./RankingListItem";

// TypeScript用の型定義
type User = {
  id: number;
  rank: number;
  name: string;
  avatarUrl: string;
  score: number;
};

type Props = {
  users: User[];
};

export default function RankingList({ users }: Props) {
  return (
    <div className="mt-4">
      <ul className="space-y-2">
        {users.map((user) => (
          <RankingListItem key={user.id} user={user} />
        ))}
      </ul>
    </div>
  );
}