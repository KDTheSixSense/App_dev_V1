import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';

/**
 * ユーザーのAIアドバイスクレジットを1つ消費するAPI
 */
export async function POST(req: Request) {
  try {
    const session = await getAppSession();
    if (!session.user) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    const userId = Number(session.user.id);

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiAdviceCredits: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // クレジットが残っているかチェック
    if (user.aiAdviceCredits <= 0) {
      return NextResponse.json({ error: 'アドバイス回数が残っていません' }, { status: 400 });
    }

    // クレジットを1つ減らす
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        aiAdviceCredits: {
          decrement: 1,
        },
      },
      select: {
        aiAdviceCredits: true,
      },
    });

    return NextResponse.json({
      message: 'クレジットを消費しました。',
      newCredits: updatedUser.aiAdviceCredits,
    });

  } catch (error: any) {
    console.error("Credit decrement failed:", error);
    return NextResponse.json({ error: '処理中にエラーが発生しました。' }, { status: 500 });
  }
}
