import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  // セッションから取得するIDは文字列の可能性があるため、型をstringに想定
  user?: { id: string; email: string };
}

// 現在のペットステータスを取得する (GET)
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    // --- ▼▼▼ ここで文字列を数値に変換します ▼▼▼ ---
    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        return NextResponse.json({ success: false, message: '無効なユーザーIDです' }, { status: 400 });
    }

    const petStatus = await prisma.status_Kohaku.findFirst({
      where: { user_id: userId }, // 数値に変換したIDを使用
    });

    if (!petStatus) {
      // データがない場合も空の成功レスポンスを返す
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: petStatus });
  } catch (error) {
    console.error('ペットステータス取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

