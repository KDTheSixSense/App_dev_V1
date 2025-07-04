import { prisma } from './prisma';
import { calculateLevelFromXp } from './leveling';

/**
 * ユーザーに経験値を加算し、レベルアップ処理を行う関数（最終版）
 * @param userId - 対象のユーザーID
 * @param subjectId - 対象の科目ID
 * @param difficultyId - 難易度のID
 */
export async function addXp(userId: number, subjectId: number, difficultyId: number) {

  // 1. 難易度IDから獲得XP量を取得
  const difficulty = await prisma.difficulty.findUnique({
    where: { id: difficultyId },
  });

  if (!difficulty) {
    throw new Error(`'${difficultyId}' が見つかりません。`);
  }
  const xpAmount = difficulty.xp;
  console.log(`${difficultyId}: ${xpAmount}xp`);
  
  // 2. トランザクションでXPを加算・レベルアップ処理
  const result = await prisma.$transaction(async (tx) => {
    
    // === 2a. 科目レベルの更新処理 ===
    const updatedProgress = await tx.userSubjectProgress.upsert({
      where: { user_id_subject_id: { user_id: userId, subject_id: subjectId } },
      create: { user_id: userId, subject_id: subjectId, xp: xpAmount, level: 1 },
      update: { xp: { increment: xpAmount } },
    });
    const newSubjectLevel = calculateLevelFromXp(updatedProgress.xp);
    if (newSubjectLevel > updatedProgress.level) {
      await tx.userSubjectProgress.update({
        where: { user_id_subject_id: { user_id: userId, subject_id: subjectId } },
        data: { level: newSubjectLevel },
      });
      console.log(`[科目レベルアップ!] subjectId:${subjectId} がレベル ${newSubjectLevel} に！`);
    }


    const newSubjectLevel = calculateLevelFromXp(updatedProgress.xp);
    if (newSubjectLevel > updatedProgress.level) {
      await tx.userSubjectProgress.update({
        where: {
          user_id_subject_id: { // ⬅️ 修正: 複合キーの指定方法
            user_id: userId,
            subject_id: subjectId,
          },
        },
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