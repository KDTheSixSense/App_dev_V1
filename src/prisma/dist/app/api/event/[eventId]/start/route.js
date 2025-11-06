"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATCH = PATCH;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const iron_session_1 = require("iron-session");
const headers_1 = require("next/headers");
const session_1 = require("@/lib/session");
async function PATCH(request, { params }) {
    var _a;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    const userId = ((_a = session.user) === null || _a === void 0 ? void 0 : _a.id) ? Number(session.user.id) : null;
    if (!userId) {
        return server_1.NextResponse.json({ error: '認証されていません。' }, { status: 401 });
    }
    const eventId = Number(params.eventId);
    if (isNaN(eventId)) {
        return server_1.NextResponse.json({ error: '無効なイベントIDです。' }, { status: 400 });
    }
    try {
        // この操作を行うユーザーがイベントの管理者であるかを確認
        const participant = await prisma_1.prisma.event_Participants.findUnique({
            where: {
                eventId_userId_unique: {
                    eventId: eventId,
                    userId: userId,
                },
            },
        });
        if (!(participant === null || participant === void 0 ? void 0 : participant.isAdmin)) {
            return server_1.NextResponse.json({ error: 'この操作を行う権限がありません。' }, { status: 403 });
        }
        const { isStarted } = await request.json();
        const updatedEvent = await prisma_1.prisma.create_event.update({
            where: { id: eventId },
            data: { isStarted: isStarted },
        });
        return server_1.NextResponse.json(updatedEvent);
    }
    catch (error) {
        console.error('イベント状態の更新エラー:', error);
        return server_1.NextResponse.json({ error: 'イベント状態の更新中にエラーが発生しました。' }, { status: 500 });
    }
}
