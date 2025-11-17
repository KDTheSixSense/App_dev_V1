//app/api/event/event_list/route.ts
//イベントリスト画面のAPI処理

import { NextRequest, NextResponse } from "next/server";

// --- モックデータ ---
// 本来はデータベースから取得・照合します。
const allEvents = [
  { id: "1", name: "Next.js勉強会", code: "NEXT2024" },
  { id: "2", name: "TypeScriptハンズオン", code: "TSHANDSON" },
  { id: "3", name: "React中級者向け講座", code: "REACTPRO" },
  { id: "4", name: "GraphQL入門", code: "GQLBEGIN" },
];

// ユーザーが既に参加しているイベントのIDリスト（これも本来はDBなどから取得）
let userJoinedEventIds = new Set(["1", "2", "3"]);

/**
 * GET: 参加中のイベントリストを取得する
 */
export async function GET(request: NextRequest) {
  // TODO: 認証情報からユーザーを特定し、そのユーザーが参加しているイベントをDBから取得する
  const joinedEvents = allEvents.filter((event) =>
    userJoinedEventIds.has(event.id)
  );

  return NextResponse.json(joinedEvents);
}

/**
 * POST: イベントに参加する
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventCode } = body;

    if (!eventCode) {
      return NextResponse.json(
        { message: "イベントコードが必要です。" },
        { status: 400 }
      );
    }

    // TODO: データベースでイベントコードに一致するイベントを検索する
    const eventToJoin = allEvents.find((event) => event.code === eventCode);

    if (!eventToJoin) {
      return NextResponse.json(
        { message: "無効なイベントコードです。" },
        { status: 404 }
      );
    }

    // TODO: ユーザーの参加情報をデータベースに保存する
    userJoinedEventIds.add(eventToJoin.id);

    // 参加したイベント情報を返す
    return NextResponse.json(eventToJoin, { status: 200 });
  } catch (error) {
    console.error("イベント参加処理でエラー:", error);
    return NextResponse.json(
      { message: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}