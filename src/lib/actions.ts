'use server'; // このファイルの関数がサーバーでのみ実行されることを示すおまじない

import { prisma } from './prisma';

/**
 * 次の問題のIDを取得するServer Action
 * @param currentId 現在の問題ID
 * @returns 次の問題が存在すればそのID、なければnull
 */
export async function getNextProblemId(currentId: number): Promise<number | null> {
  // この中身は lib/data.ts からの移動なので変更なし
  const nextProblem = await prisma.problem.findFirst({
    where: { id: { gt: currentId } }, // 現在のIDより大きい最初の問題
    orderBy: { id: 'asc' },
    select: { id: true }
  });
  return nextProblem ? nextProblem.id : null;
}