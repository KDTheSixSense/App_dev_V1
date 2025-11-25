/**
 * 日本時間 (JST: UTC+9) のオフセット (ミリ秒)
 */
const JST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * アプリのリセット時間 (時)
 * 例: 6 にすると、AM 6:00 に日付が変わります。
 */
const APP_RESET_HOUR = 6; 

/**
 * 現在の日本時間を取得する関数
 */
export function getNowJST(baseDate: Date = new Date()): Date {
  return new Date(baseDate.getTime() + JST_OFFSET);
}

/**
 * 「アプリ上の今日の日付」を取得する関数 (リセット時間考慮)
 */
export function getAppToday(baseDate: Date = new Date()): Date {
  const target = new Date(baseDate.getTime());
  const effectiveOffset = JST_OFFSET - (APP_RESET_HOUR * 60 * 60 * 1000);
  const adjustedDate = new Date(target.getTime() + effectiveOffset);
  return new Date(adjustedDate.toISOString().split('T')[0]);
}

/**
 * 2つの日付が「アプリ上で同じ日」かどうかを判定する関数
 */
export function isSameAppDay(date1: Date, date2: Date): boolean {
  const d1 = getAppToday(date1);
  const d2 = getAppToday(date2);
  return d1.getTime() === d2.getTime();
}

/**
 * 指定した日数が経過しているか判定する関数
 */
export function getDaysDiff(lastDate: Date, today: Date = getAppToday()): number {
  const d1 = getAppToday(lastDate);
  const d2 = today;
  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}