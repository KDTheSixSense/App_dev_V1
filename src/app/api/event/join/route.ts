// /app/api/event/join/route.ts

import { NextRequest, NextResponse } from 'next/server';
// Prisma Clientをインポートします。
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import { z } from 'zod';

// APIが受け取るリクエストボディの型を定義します。
const joinEventSchema = z.object({
  inviteCode: z.string().min(1, "参加コードは必須です"),
});

// Next.js 13+ App RouterでのAPIルートの標準的な書き方です。
export async function POST(req: NextRequest) {
  try {
    // セッションからユーザーIDを取得
    const session = await getAppSession();
    const user = session.user;

    if (!user) {
      return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
    }

    const userId = user.id;

    const body = await req.json();
    const validation = joinEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'リクエスト情報が不足しています', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { inviteCode } = validation.data;

    // 参加コードに一致するイベントを検索
    const targetEvent = await prisma.create_event.findUnique({
      where: { inviteCode: inviteCode },
    });

    if (!targetEvent) {
      return NextResponse.json({ message: '参加コードが無効です。' }, { status: 404 });
    }

    // ユーザーが既に参加済みか確認
    const existingParticipant = await prisma.event_Participants.findFirst({
      where: {
        eventId: targetEvent.id,
        userId: userId,
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ message: '既にこのイベントに参加しています。' }, { status: 409 });
    }

    // 参加者を追加
    await prisma.event_Participants.create({
      data: {
        eventId: targetEvent.id,
        userId: userId,
        isAdmin: false,
      },
    });

    return NextResponse.json({ message: 'イベントへの参加が完了しました！', eventId: targetEvent.id }, { status: 201 });

  } catch (error) {
    console.error('イベント参加APIエラー:', error);
    return NextResponse.json({ message: 'サーバー内部でエラーが発生しました' }, { status: 500 });
  }
}
