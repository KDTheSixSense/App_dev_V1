/**
 * 総経験値から現在のレベルを計算する関数
 * @param totalXp 累計の総経験値
 * @returns 現在のレベル
 */
export function calculateLevelFromXp(totalXp: number): number {
  if (totalXp < 0) return 1;

  // 0-999XPはレベル1, 1000-1999XPはレベル2...
  const level = Math.floor(totalXp / 1000) + 1;
  return level;
}