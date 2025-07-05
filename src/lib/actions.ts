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
export async function updateUserLoginStats(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) { throw new Error('User not found'); }

  const today = new Date();
  const todayDateString = today.toDateString();
  const lastLoginDate = user.lastlogin;

  if (lastLoginDate && lastLoginDate.toDateString() === todayDateString) {
    console.log('本日既にログイン済みです。');
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayDateString = yesterday.toDateString();

  let newConsecutiveDays: number = user.continuouslogin ?? 0;
  let newTotalDays: number = user.totallogin ?? 0;

  if (lastLoginDate && lastLoginDate.toDateString() === yesterdayDateString) {
    newConsecutiveDays += 1;
  } else {
    newConsecutiveDays = 1;
  }
  newTotalDays += 1;

  await prisma.user.update({
    where: { id: userId },
    data: {
      totallogin: newTotalDays,
      continuouslogin: newConsecutiveDays,
      lastlogin: today,
    },
  });

  console.log(`ログイン情報を更新しました: 総${newTotalDays}日, 連続${newConsecutiveDays}日`);
}