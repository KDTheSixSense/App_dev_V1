// /workspaces/my-next-app/src/lib/ranking.ts

// 型定義: この関数が受け取るユーザーデータの基本的な形
type UserWithScore = {
  id: string;
  score: number;
  // ...その他のプロパティ (name, iconUrlなど) もジェネリクスTとして保持されます
};

/**
 * ユーザーのリストを受け取り、同順位を考慮した順位（1位, 1位, 3位形式）を付けて返す関数
 * @param users - スコアで降順にソート済みのユーザーリスト
 * @returns 順位(rank)プロパティが追加されたユーザーリスト
 */
export function assignRanks<T extends UserWithScore>(users: T[]): (T & { rank: number })[] {
  let currentRank = 0;           // 現在割り当てている順位
  let lastScore: number | null = null; // 直前の人のスコア（初期値はnull）

  return users.map((user, index) => {
    // スコアが変わった場合（または最初の人）の処理
    if (user.score !== lastScore) {
      // 【ポイント】
      // スコアが違う場合、順位を「現在のインデックス + 1」に更新します。
      // 例: 
      // index 0 (1人目): rank = 1
      // index 1 (2人目): スコア同じ -> rank更新せず (1のまま)
      // index 2 (3人目): スコア違う -> rank = 2 + 1 = 3 (ここが3位になる)
      currentRank = index + 1;
    }
    
    // スコアが同じ場合は if文に入らないため、currentRank は更新されず、
    // 前の人と同じ順位が割り当てられます。

    lastScore = user.score; // 今回のスコアを記録
    return { ...user, rank: currentRank };
  });
}