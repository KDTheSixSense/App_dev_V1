// /workspaces/my-next-app/src/app/api/event/[eventId]/participants/[participantId]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

interface SessionData {
  user?: {
    id: string;
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: any
) {
  const session = await getIronSession<SessionData>(await cookies() as any, sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  const eventId = parseInt(params.eventId, 10);
  
  if (isNaN(eventId)) {
    return NextResponse.json({ error: '無効なID形式です。' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { hasAccepted, userId } = body;

    if (typeof hasAccepted !== 'boolean' || !userId) {
      return NextResponse.json({ error: 'リクエストボディの形式が正しくありません。' }, { status: 400 });
    }

    // セッションのユーザーIDとリクエストのユーザーIDが一致するか確認（セキュリティ対策）
    if (Number(session.user.id) !== userId) {
      return NextResponse.json({ error: '操作を行う権限がありません。' }, { status: 403 });
    }

    // 複合ユニークキー(eventIdとuserId)を使って更新対象を特定する、より安全な方法
    const result = await prisma.event_Participants.updateMany({
      where: {
        eventId: eventId,
        userId: userId,
      },
      data: {
        hasAccepted: hasAccepted,
      },
    });

    if (result.count === 0) {
      // where句に一致するレコードがなかった場合
      return NextResponse.json({ error: '参加者情報が見つかりません。' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('参加承認APIエラー:', error);
    // PrismaのエラーコードP2025は 'Record to update not found.'
    if (error instanceof Error && (error as any).code === 'P2025') {
      return NextResponse.json({ error: '参加者情報が見つかりません。' }, { status: 404 });
    }
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
