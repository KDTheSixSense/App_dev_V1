// ランキングリストで使用するユーザーの型
export type UserForRanking = {
  id: string;
  rank: number;
  name: string;
  iconUrl: string;
  score: number;
  level: number; // levelプロパティを追加
  isCurrentUser?: boolean; // ハイライト表示用のプロパティも追加
};