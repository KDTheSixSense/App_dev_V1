import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';

/**
 * ユーザーのAIアドバイスクレジットを1つ消費するAPI
 */
/**
 * ユーザーのAIアドバイスクレジットを1つ消費するAPI
 * 
 * ユーザーのクレジット残高を確認し、1つ減算します。
 * クレジットが0の場合はエラーを返します。
 */
export async function POST(req: Request) {
  try {
    const session = await getAppSession();
    if (!session.user) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    const userId = session.user.id;

    // Atomic update to prevent race conditions (decrement only if > 0)
    const result = await prisma.user.updateMany({
      where: {
        id: userId,
        aiAdviceCredits: { gt: 0 },
      },
      data: {
        aiAdviceCredits: {
          decrement: 1,
        },
      },
    });

    if (result.count === 0) {
      // Check if user exists or just no credits
      const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { aiAdviceCredits: true } });
      if (!userExists) {
        return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
      }
      return NextResponse.json({ error: 'アドバイス回数が残っていません' }, { status: 400 });
    }

    // Get the new balance for the response
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiAdviceCredits: true },
    });

    if (!updatedUser) {
      throw new Error('予期せぬエラー: ユーザー情報の取得に失敗しました');
    }

    return NextResponse.json({
      message: 'クレジットを消費しました。',
      newCredits: updatedUser.aiAdviceCredits,
    });

  } catch (error: any) {
    console.error("Credit decrement failed:", error);
    return NextResponse.json({ error: '処理中にエラーが発生しました。' }, { status: 500 });
  }
}
