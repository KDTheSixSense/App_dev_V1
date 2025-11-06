"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
// /workspaces/my-next-app/src/app/api/event/join/route.ts
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const iron_session_1 = require("iron-session");
const headers_1 = require("next/headers");
const session_1 = require("@/lib/session");
async function POST(request) {
    var _a;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    if (!((_a = session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return server_1.NextResponse.json({ error: '認証されていません。' }, { status: 401 });
    }
    const userId = Number(session.user.id);
    try {
        const body = await request.json();
        const { inviteCode } = body;
        if (!inviteCode) {
            return server_1.NextResponse.json({ error: '招待コードが必要です。' }, { status: 400 });
        }
        // 1. 招待コードに一致するイベントを検索
        const event = await prisma_1.prisma.create_event.findUnique({
            where: { inviteCode: inviteCode },
        });
        if (!event) {
            return server_1.NextResponse.json({ error: '無効な招待コードです。' }, { status: 404 });
        }
        // 2. 既に参加済みか確認
        const existingParticipant = await prisma_1.prisma.event_Participants.findUnique({
            where: {
                eventId_userId_unique: {
                    eventId: event.id,
                    userId: userId,
                },
            },
        });
        if (existingParticipant) {
            return server_1.NextResponse.json({ error: '既にこのイベントに参加しています。' }, { status: 409 });
        }
        // 3. 参加者として登録
        const newParticipant = await prisma_1.prisma.event_Participants.create({
            data: {
                eventId: event.id,
                userId: userId,
                isAdmin: false, // 通常の参加者は管理者ではない
            },
        });
        return server_1.NextResponse.json({ success: true, data: newParticipant });
    }
    catch (error) {
        console.error('イベント参加APIエラー:', error);
        return server_1.NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}
