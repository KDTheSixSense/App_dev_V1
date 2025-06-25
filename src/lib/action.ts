import { prisma } from './prisma';
import { calculateLevelFromXp } from './leveling';

/**
 * ユーザーに経験値を加算し、レベルアップ処理を行う関数（最終版）
 * @param userId - 対象のユーザーID
 * @param subjectId - 対象の科目ID
 * @param difficultyName - 難易度の名前 (例: "Easy", "上級")
 */
export async function addXp(userId: number, subjectId: number, difficultyName: string) {

  // 1. 難易度名から獲得XP量を取得
  const difficulty = await prisma.difficulty.findUnique({
    where: { name: difficultyName },
  });

  if (!difficulty) {
    throw new Error(`'${difficultyName}' が見つかりません。`);
  }
  const xpAmount = difficulty.xp;
  console.log(`${difficultyName}: ${xpAmount}xp`);
  
  // 2. トランザクションでXPを加算・レベルアップ処理
  const result = await prisma.$transaction(async (tx) => {
    
    // === 2a. 科目レベルの更新処理 ===
    const updatedProgress = await tx.userSubjectProgress.upsert({
      where: { userId_subjectId: { userId, subjectId } },
      create: { userId, subjectId, xp: xpAmount, level: 1 },
      update: { xp: { increment: xpAmount } },
    });
    const newSubjectLevel = calculateLevelFromXp(updatedProgress.xp);
    if (newSubjectLevel > updatedProgress.level) {
      await tx.userSubjectProgress.update({
        where: { userId_subjectId: { userId, subjectId } },
        data: { level: newSubjectLevel },
      });
      console.log(`[科目レベルアップ!] subjectId:${subjectId} がレベル ${newSubjectLevel} に！`);
    }

    // === 2b. アカウントレベルの更新処理 ===
    let user = await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: xpAmount } },
    });
    const newAccountLevel = calculateLevelFromXp(user.xp);
    if (newAccountLevel > user.level) {
      // レベルアップ後の最新情報で user 変数を上書きする
      user = await tx.user.update({
        where: { id: userId },
        data: { level: newAccountLevel },
      });
      console.log(`[アカウントレベルアップ!] ${user.username} がアカウントレベル ${newAccountLevel} に！`);
    }

    return { updatedUser: user, updatedProgress };
  });

  console.log('XP加算処理が完了しました。');
  return result;
}