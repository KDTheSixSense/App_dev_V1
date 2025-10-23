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
export async function POST(req: Request) {
  try {
    const session = await getAppSession();
    if (!session.user) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    const userId = Number(session.user.id);

    // トランザクションを使って、XPの消費とクレジットの付与を同時に行う
    const result = await prisma.$transaction(async (tx) => {
      // 1. 現在のユーザー情報を取得してロック
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });

      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // 2. XPが足りるかチェック
      if (user.xp < EXCHANGE_COST_XP) {
        throw new Error('XPが不足しています');
      }

      // 3. XPを消費し、クレジットを付与
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: {
            decrement: EXCHANGE_COST_XP,
          },
          aiAdviceCredits: {
            increment: CREDITS_PER_EXCHANGE,
          },
        },
        select: {
          xp: true,
          aiAdviceCredits: true,
        },
      });

      return updatedUser;
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
