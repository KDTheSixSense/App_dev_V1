// /workspaces/my-next-app/src/app/api/event/[eventId]/start/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  // 1. セッションを取得し、認証済みユーザーか確認
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }
  const userId = Number(session.user.id);
  const eventId = parseInt(params.eventId, 10);

  if (isNaN(userId) || isNaN(eventId)) {
    return NextResponse.json({ error: '無効なID形式です。' }, { status: 400 });
  }

  try {
    // 2. イベントが存在し、かつ現在のユーザーがそのイベントの作成者（管理者）であるかを確認
    const event = await prisma.create_event.findFirst({
      where: {
        id: eventId,
        creatorId: userId,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'イベントを開始する権限がありません。' }, { status: 403 });
    }

    // 3. イベントの isStarted フラグを true に更新
    const updatedEvent = await prisma.create_event.update({
      where: {
        id: eventId,
      },
      data: {
        isStarted: true,
      },
    });

    return NextResponse.json({ success: true, event: updatedEvent }, { status: 200 });
  } catch (error) {
    console.error('イベント開始APIエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}