// app/api/event/event_list/route.ts
// イベントリスト画面のAPI処理

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppSession } from "@/lib/auth";

/**
 * GET: 参加中のイベントリストを取得する
 */
export async function GET(request: NextRequest) {
  const session = await getAppSession();

  // 認証チェック
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // ユーザーが参加しているイベントを取得
    // Event_Participantsテーブルを介してCreate_eventを取得
    const participants = await prisma.event_Participants.findMany({
      where: {
        userId: userId,
      },
      include: {
        event: true, // イベント詳細を含める
      },
    });

    // フロントエンドが期待する形式に整形 (Event_Participantsからevent情報を取り出す)
    const joinedEvents = participants.map((p) => ({
      id: p.event.id.toString(),
      name: p.event.title, // DBのカラム名は title
      code: p.event.inviteCode,
      description: p.event.description,
      startTime: p.event.startTime,
      endTime: p.event.endTime,
    }));

    return NextResponse.json(joinedEvents);
  } catch (error) {
    console.error("イベントリスト取得エラー:", error);
    return NextResponse.json(
      { message: "イベントの取得に失敗しました。" },
      { status: 500 }
    );
  }
}

/**
 * POST: イベントに参加する
 */
export async function POST(request: NextRequest) {
  const session = await getAppSession();

  // 認証チェック
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { eventCode } = body;

    if (!eventCode) {
      return NextResponse.json(
        { message: "イベントコードが必要です。" },
        { status: 400 }
      );
    }

    // イベントコード(inviteCode)に一致するイベントを検索
    const eventToJoin = await prisma.create_event.findUnique({
      where: {
        inviteCode: eventCode,
      },
    });

    if (!eventToJoin) {
      return NextResponse.json(
        { message: "無効なイベントコードです。" },
        { status: 404 }
      );
    }

    // 既に参加しているかチェック
    const existingParticipant = await prisma.event_Participants.findUnique({
      where: {
        eventId_userId_unique: {
          eventId: eventToJoin.id,
          userId: userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { message: "既に参加済みのイベントです。" },
        { status: 409 } // Conflict
      );
    }

    // 参加情報を保存
    await prisma.event_Participants.create({
      data: {
        eventId: eventToJoin.id,
        userId: userId,
        isAdmin: false,
      },
    });

    // 成功レスポンス: 参加したイベント情報を返す
    // フロントエンドの期待する形式に合わせて整形
    const responseEvent = {
      id: eventToJoin.id.toString(),
      name: eventToJoin.title,
      code: eventToJoin.inviteCode,
      description: eventToJoin.description,
    };

    return NextResponse.json(responseEvent, { status: 200 });

  } catch (error) {
    console.error("イベント参加処理でエラー:", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}