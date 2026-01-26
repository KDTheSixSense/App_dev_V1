import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * ログアウトAPI
 * 
 * セッションを破棄し、ユーザーのトークンバージョンをインクリメントして
 * 既存のセッションを無効化します。
 */
export async function POST() {
  try {
    // 専用関数でセッションを取得
    const session = await getAppSession();

    // セッションを破棄します
    if (session.user?.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { tokenVersion: { increment: 1 } },
      });
    }
    session.destroy();

    return NextResponse.json({ message: 'ログアウトしました' });

  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ error: 'ログアウト処理に失敗しました' }, { status: 500 });
  }
}