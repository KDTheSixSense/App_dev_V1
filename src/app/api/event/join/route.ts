// /workspaces/my-next-app/src/app/api/event/join/route.ts
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

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json({ error: '招待コードが必要です。' }, { status: 400 });
    }

    // 1. 招待コードに一致するイベントを検索
    const event = await prisma.create_event.findUnique({
      where: { inviteCode: inviteCode },
    });

    if (!event) {
      return NextResponse.json({ error: '無効な招待コードです。' }, { status: 404 });
    }

    // 2. 既に参加済みか確認
    const existingParticipant = await prisma.event_Participants.findUnique({
      where: {
        eventId_userId_unique: {
          eventId: event.id,
          userId: userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ error: '既にこのイベントに参加しています。' }, { status: 409 });
    }

    // 3. 参加者として登録
    const newParticipant = await prisma.event_Participants.create({
      data: {
        eventId: event.id,
        userId: userId,
        isAdmin: false, // 通常の参加者は管理者ではない
      },
    });

    return NextResponse.json({ success: true, data: newParticipant });
  } catch (error) {
    console.error('イベント参加APIエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}