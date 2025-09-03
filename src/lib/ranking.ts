// 型定義: この関数が受け取るユーザーデータの基本的な形
type UserWithScore = {
  id: number;
  score: number;
  // ...その他のプロパティ
};

/**
 * ユーザーのリストを受け取り、同順位を考慮した正しい順位を付けて返す関数
 * @param users - スコアで降順にソート済みのユーザーリスト
 * @returns 順位(rank)プロパティが追加されたユーザーリスト
 */
export function assignRanks<T extends UserWithScore>(users: T[]): (T & { rank: number })[] {
  let rank = 0;
  let lastScore = -1;
  let usersAtSameRank = 1;

  return users.map((user, index) => {
    if (user.score !== lastScore) {
      rank = index + 1;
      usersAtSameRank = 1;
    } else {
      usersAtSameRank++;
    }
    lastScore = user.score;
    return { ...user, rank };
  });
}
