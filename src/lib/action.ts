import { prisma } from './prisma';
import { calculateLevelFromXp } from './leveling'; // Step 2で更新した関数をインポート

/**
 * ユーザーに経験値を加算し、レベルアップ処理を行う関数（統一総量XPモデル版）
 * @param userId - 対象のユーザーID
 * @param subjectId - 対象の科目ID
 * @param xpAmount - 加算する経験値の量
 */
export async function addXp(userId: number, subjectId: number, xpAmount: number) {

  const result = await prisma.$transaction(async (tx) => {
    
    // === 1. 科目レベルの更新処理 ===

    // a. 科目の総XPを加算し、更新後の進捗データを取得
    const updatedProgress = await tx.userSubjectProgress.upsert({
      where: { userId_subjectId: { userId, subjectId } },
      create: { userId, subjectId, xp: xpAmount, level: 1 },
      update: { xp: { increment: xpAmount } },
    });

    // b. 新しい科目レベルを計算
    const newSubjectLevel = calculateLevelFromXp(updatedProgress.xp);

    // c. 計算後のレベルが現在のDBの値と異なれば、レベルを更新
    if (newSubjectLevel > updatedProgress.level) {
      await tx.userSubjectProgress.update({
        where: { userId_subjectId: { userId, subjectId } },
        data: { level: newSubjectLevel },
      });
      console.log(`[科目レベルアップ!] subjectId:${subjectId} がレベル ${newSubjectLevel} に！`);
    }

    // === 2. アカウントレベルの更新処理 ===

    // a. アカウントの総XPを加算し、更新後のユーザーデータを取得
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: xpAmount } },
    });

    // b. 新しいアカウントレベルを計算
    const newAccountLevel = calculateLevelFromXp(updatedUser.xp);
    
    // c. 計算後のレベルが現在のDBの値と異なれば、レベルを更新
    if (newAccountLevel > updatedUser.level) {
      await tx.user.update({
        where: { id: userId },
        data: { level: newAccountLevel },
      });
      console.log(`[アカウントレベルアップ!] ${updatedUser.username} がアカウントレベル ${newAccountLevel} に！`);
    }

    return { updatedUser, updatedProgress };
  });

  console.log('XP加算処理が完了しました。');
  return result;
}