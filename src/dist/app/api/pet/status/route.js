"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const iron_session_1 = require("iron-session");
const session_1 = require("@/lib/session");
const headers_1 = require("next/headers");
// 現在のペットステータスを取得する (GET)
async function GET() {
    var _a;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    if (!((_a = session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return server_1.NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }
    try {
        // --- ▼▼▼ ここで文字列を数値に変換します ▼▼▼ ---
        const userId = Number(session.user.id);
        if (isNaN(userId)) {
            return server_1.NextResponse.json({ success: false, message: '無効なユーザーIDです' }, { status: 400 });
        }
        const petStatus = await prisma_1.prisma.status_Kohaku.findFirst({
            where: { user_id: userId }, // 数値に変換したIDを使用
        });
        if (!petStatus) {
            // データがない場合も空の成功レスポンスを返す
            return server_1.NextResponse.json({ success: true, data: null });
        }
        return server_1.NextResponse.json({ success: true, data: petStatus });
    }
    catch (error) {
        console.error('ペットステータス取得エラー:', error);
        return server_1.NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
