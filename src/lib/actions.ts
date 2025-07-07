'use server'; // このファイルがサーバーアクションであることを示す

import { prisma } from './prisma';
import { calculateLevelFromXp } from './leveling';

/**
 * 次の問題のIDを取得するサーバーアクション
 * @param currentId 現在の問題ID
 * @returns 次の問題が存在すればそのID、なければnull
 */
export async function getNextProblemId(currentId: number): Promise<number | null> {
  try {
    // 両方のテーブルからIDを取得
    const [staticIds, algoIds] = await Promise.all([
      prisma.questions.findMany({ select: { id: true } }),
      prisma.questions_Algorithm.findMany({ select: { id: true } })
    ]);

    // IDを一つの配列にまとめ、ソートし、重複を除外
    const allIds = [...staticIds.map(p => p.id), ...algoIds.map(p => p.id)];
    const sortedUniqueIds = [...new Set(allIds)].sort((a, b) => a - b);

    // 現在のIDの次のIDを探す
    const currentIndex = sortedUniqueIds.indexOf(currentId);
    if (currentIndex === -1 || currentIndex >= sortedUniqueIds.length - 1) {
      return null; // 見つからないか、最後の問題
    }
    return sortedUniqueIds[currentIndex + 1];
  } catch (error) {
    console.error("Failed to get next problem ID:", error);
    return null;
  }
}

/**
 * ユーザーに経験値を加算し、レベルアップ処理を行う関数
 */
export async function addXp(user_id: number, subject_id: number, difficulty_id: number) {
  const difficulty = await prisma.difficulty.findUnique({
    where: { id: difficulty_id },
  });

  if (!difficulty) {
    throw new Error(`'${difficulty_id}' が見つかりません。`);
  }
  const xpAmount = difficulty.xp;
  console.log(`${difficulty_id}: ${xpAmount}xp`);
  
  const result = await prisma.$transaction(async (tx) => {
    const updatedProgress = await tx.userSubjectProgress.upsert({
      where: { user_id_subject_id: { user_id, subject_id } },
      create: { user_id, subject_id, xp: xpAmount, level: 1 },
      update: { xp: { increment: xpAmount } },
    });
    const newSubjectLevel = calculateLevelFromXp(updatedProgress.xp);
    if (newSubjectLevel > updatedProgress.level) {
      await tx.userSubjectProgress.update({
        where: { user_id_subject_id: { user_id, subject_id } },
        data: { level: newSubjectLevel },
      });
      console.log(`[科目レベルアップ!] subjectId:${subject_id} がレベル ${newSubjectLevel} に！`);
    }

    let user = await tx.user.update({
      where: { id: user_id },
      data: { xp: { increment: xpAmount } },
    });
    const newAccountLevel = calculateLevelFromXp(user.xp);
    if (newAccountLevel > user.level) {
      user = await tx.user.update({
        where: { id: user_id },
        data: { level: newAccountLevel },
      });
      console.log(`[アカウントレベルアップ!] ${user.username} がアカウントレベル ${newAccountLevel} に！`);
    }

    return { updatedUser: user, updatedProgress };
  });

  console.log('XP加算処理が完了しました。');
  return result;
}

//ログイン日数計算
const RESET_HOUR = 6; // 日付のリセット時刻を朝6時に設定
/**
 * 指定された日時から6時間引いて、「アプリ内での日付」を返すヘルパー関数
 * @param date - 判定したい日時オブジェクト
 * @returns 6時間引いた後の日時オブジェクト
 */
function getAppDate(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() - RESET_HOUR);
  return newDate;
}
export async function updateUserLoginStats(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) { throw new Error('User not found'); }

  const now = new Date(); // 実際の現在時刻
  const lastLoginDate = user.lastlogin; // DBに保存されている実際の最終ログイン時刻

// 「アプリ内での今日」の日付文字列を取得
  const todayAppDateString = getAppDate(now).toDateString();

  // 最後にログインした「アプリ内での日付」の文字列を取得
  const lastLoginAppDateString = lastLoginDate ? getAppDate(lastLoginDate).toDateString() : null;

  // アプリ内での日付が同じなら、すでにログイン済み
  // if (lastLoginAppDateString && lastLoginAppDateString === todayAppDateString) {
  //   console.log('本日（アプリ内日付）は既にログイン済みです。');
  //   return;
  // }

  // --- 日数計算 ---
  
  // 「アプリ内での昨日」の日付文字列を取得
  const yesterdayAppDate = getAppDate(now);
  yesterdayAppDate.setDate(yesterdayAppDate.getDate() - 1);
  const yesterdayAppDateString = yesterdayAppDate.toDateString();

  let newConsecutiveDays = user.continuouslogin ?? 0;
  let newTotalDays = user.totallogin ?? 0;

  // if (lastLoginAppDateString && lastLoginAppDateString === yesterdayAppDateString) {
    // ケースA: 最後のログインが「アプリ内での昨日」 -> 連続ログイン
    newConsecutiveDays += 1;
  // } else {
    // ケースB: 連続ログインが途切れた -> リセット
    // newConsecutiveDays = 1;
  // }
  
  newTotalDays += 1;

  // データベースを更新
  await prisma.user.update({
    where: { id: userId },
    data: {
      totallogin: newTotalDays,
      continuouslogin: newConsecutiveDays,
      // DBに保存するのは、実際のログイン時刻
      lastlogin: now,
    },
  });
}