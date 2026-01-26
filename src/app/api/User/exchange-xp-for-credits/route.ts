// /src/app/api/user/exchange-xp-for-credits/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';

// 交換に必要なXPと、交換で得られるクレジット数
const EXCHANGE_COST_XP = 500;
const CREDITS_PER_EXCHANGE = 1;

/**
 * ユーザーがXPを消費してAIアドバイスクレジットと交換するAPI
 */
/**
 * ユーザーがXPを消費してAIアドバイスクレジットと交換するAPI
 * 
 * 指定されたXP（EXCHANGE_COST_XP）を消費して、クレジットを付与します。
 * トランザクションを使用してアトミックに処理します。
 */
export async function POST(req: Request) {
  try {
    const session = await getAppSession();
    if (!session.user) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    const userId = session.user.id;

    // トランザクションを使って、XPの消費とクレジットの付与を同時に行う
    const result = await prisma.$transaction(async (tx) => {
      // 1. (Optional) Optimistic check for better error message
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });
      if (!currentUser) throw new Error('ユーザーが見つかりません');
      if (currentUser.xp < EXCHANGE_COST_XP) throw new Error('XPが不足しています');

      // 2. Atomic Update using updateMany with condition
      // "where xp >= cost" ensures we never drop below 0 even in race conditions
      const result = await tx.user.updateMany({
        where: {
          id: userId,
          xp: { gte: EXCHANGE_COST_XP },
        },
        data: {
          xp: { decrement: EXCHANGE_COST_XP },
          aiAdviceCredits: { increment: CREDITS_PER_EXCHANGE },
        },
      });

      if (result.count === 0) {
        // Race condition hit: XP was enough at step 1 but changed before step 2
        throw new Error('XPが不足しています');
      }

      // 3. Fetch updated state
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          xp: true,
          aiAdviceCredits: true,
        },
      });

      return updatedUser!;
    });

    return NextResponse.json({
      message: '交換が完了しました！',
      newXp: result.xp,
      newCredits: result.aiAdviceCredits,
    });

  } catch (error: any) {
    console.error("XP exchange failed:", error);
    // エラーの種類に応じて適切なメッセージを返す
    if (error.message === 'XPが不足しています') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: '交換処理中にエラーが発生しました。' }, { status: 500 });
  }
}
