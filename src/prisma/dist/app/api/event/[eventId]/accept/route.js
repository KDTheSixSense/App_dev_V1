"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATCH = PATCH;
// /workspaces/my-next-app/src/app/api/event/[eventId]/participants/[participantId]/accept/route.ts
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const iron_session_1 = require("iron-session");
const headers_1 = require("next/headers");
const session_1 = require("@/lib/session");
async function PATCH(request, { params }) {
    var _a;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    if (!((_a = session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return server_1.NextResponse.json({ error: '認証されていません。' }, { status: 401 });
    }
    const eventId = parseInt(params.eventId, 10);
    if (isNaN(eventId)) {
        return server_1.NextResponse.json({ error: '無効なID形式です。' }, { status: 400 });
    }
    try {
        const body = await request.json();
        const { hasAccepted, userId } = body;
        if (typeof hasAccepted !== 'boolean' || !userId) {
            return server_1.NextResponse.json({ error: 'リクエストボディの形式が正しくありません。' }, { status: 400 });
        }
        // セッションのユーザーIDとリクエストのユーザーIDが一致するか確認（セキュリティ対策）
        if (Number(session.user.id) !== userId) {
            return server_1.NextResponse.json({ error: '操作を行う権限がありません。' }, { status: 403 });
        }
        // 複合ユニークキー(eventIdとuserId)を使って更新対象を特定する、より安全な方法
        const result = await prisma_1.prisma.event_Participants.updateMany({
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
            return server_1.NextResponse.json({ error: '参加者情報が見つかりません。' }, { status: 404 });
        }
        return server_1.NextResponse.json({ success: true, data: result });
    }
    catch (error) {
        console.error('参加承認APIエラー:', error);
        // PrismaのエラーコードP2025は 'Record to update not found.'
        if (error instanceof Error && error.code === 'P2025') {
            return server_1.NextResponse.json({ error: '参加者情報が見つかりません。' }, { status: 404 });
        }
        return server_1.NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}
