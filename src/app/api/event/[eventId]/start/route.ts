import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

interface SessionData {
  user?: {
    id: string;
  };
}

/**
 * イベント開始状態更新API
 * 
 * イベント管理者がイベントの開始状態（開始/未開始）を切り替えます。
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const params = await context.params;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? session.user.id : null;

  if (!userId) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  const eventId = Number(params.eventId);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: '無効なイベントIDです。' }, { status: 400 });
  }

  try {
    // この操作を行うユーザーがイベントの管理者であるかを確認
    const participant = await prisma.event_Participants.findUnique({
      where: {
        eventId_userId_unique: {
          eventId: eventId,
          userId: userId,
        },
      },
    });

    if (!participant?.isAdmin) {
      return NextResponse.json({ error: 'この操作を行う権限がありません。' }, { status: 403 });
    }

    const { isStarted } = await request.json();

    const updatedEvent = await prisma.create_event.update({
      where: { id: eventId },
      data: { isStarted: isStarted },
    });

    return NextResponse.json(updatedEvent);

  } catch (error) {
    console.error('イベント状態の更新エラー:', error);
    return NextResponse.json({ error: 'イベント状態の更新中にエラーが発生しました。' }, { status: 500 });
  }
}

