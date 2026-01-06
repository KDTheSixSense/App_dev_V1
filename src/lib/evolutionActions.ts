'use server';

import { prisma } from "@/lib/prisma";
import { calculateEvolutionType, SubjectProgress } from "@/components/kohakuUtils";

/**
 * レベルアップ時に進化判定を行い、30の倍数であればDBを更新する関数
 * 既存のレベルアップ処理（XP加算処理など）の直後に呼び出してください。
 */
export async function checkAndSaveEvolution(userId: string, currentLevel: number) {
  // 30の倍数でなければ何もしない
  if (currentLevel < 30 || currentLevel % 30 !== 0) {
    return;
  }

  // ユーザーの学習進捗を取得
  const userProgress = await prisma.userSubjectProgress.findMany({
    where: { user_id: userId },
    include: { subject: true },
  });

  // kohakuUtils用の形式に変換
  const subjectProgressList: SubjectProgress[] = userProgress.map((p) => ({
    subjectName: p.subject.name,
    level: p.level,
  }));

  // 進化タイプを計算 (例: "A-A", "P-O")
  const evolutionType = calculateEvolutionType(subjectProgressList);

  if (evolutionType) {
    // DBを更新
    await prisma.status_Kohaku.update({
      where: { user_id: userId },
      data: { evolutionType: evolutionType },
    });
  }
}