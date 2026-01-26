// /workspaces/my-next-app/src/app/api/event/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { eventJoinSchema } from '@/lib/validations';

interface SessionData {
  user?: {
    id: string;
  };
}

/**
 * イベント参加API
 * 
 * 招待コードを使用してイベントに参加します。
 * コードの検証、終了期間チェック、重複参加チェックを行います。
 */
export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();

    const validationResult = eventJoinSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: '無効なリクエスト形式です。', details: validationResult.error.flatten() }, { status: 400 });
    }

    const { inviteCode } = validationResult.data;

    // 1. 招待コードに一致するイベントを検索
    const event = await prisma.create_event.findUnique({
      where: { inviteCode: inviteCode },
    });

    if (!event) {
      return NextResponse.json({ error: '無効な招待コードです。' }, { status: 404 });
    }

    // イベント終了チェック
    if (event.endTime && new Date(event.endTime) < new Date()) {
      return NextResponse.json({ error: 'このイベントは既に終了しています。' }, { status: 400 });
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