// app/lib/data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * IDを元に、単一の問題をデータベースから取得します。
 * @param id 問題ID (文字列)
 * @returns Prisma.Problem | null
 */
export async function getProblemFromDbById(id: string) {
  const problemId = parseInt(id, 10);
  if (isNaN(problemId)) {
    console.error("無効なIDです:", id);
    return null;
  }

  try {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });
    return problem;
  } catch (error) {
    console.error("データベースからのデータ取得に失敗しました:", error);
    // 本番環境ではより堅牢なエラーハンドリングを推奨します
    throw new Error('Failed to fetch problem from database.');
  }
}