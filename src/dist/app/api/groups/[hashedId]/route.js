"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const iron_session_1 = require("iron-session");
const session_1 = require("@/lib/session");
const headers_1 = require("next/headers");
/**
 * グループの詳細情報を取得する (GET)
 * 招待コード(invite_code)も一緒に返します。
 */
async function GET(request, { params } // Next.js 13+ の標準的な引数の書き方
) {
    var _a, _b;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    if (!((_a = session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        // 認証されていない場合はエラーを返す
        return server_1.NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }
    try {
        const { hashedId } = params; // Next.js 13+ では context の代わりに params から取得します
        if (!hashedId) {
            return server_1.NextResponse.json({ message: 'IDが指定されていません' }, { status: 400 });
        }
        const group = await prisma_1.prisma.groups.findUnique({
            where: {
                hashedId: hashedId,
            },
            select: {
                id: true,
                hashedId: true,
                groupname: true,
                body: true,
                invite_code: true, // ★ これが一番重要です
                _count: {
                    select: { groups_User: true },
                },
            },
        });
        if (!group) {
            return server_1.NextResponse.json({ message: 'グループが見つかりません' }, { status: 404 });
        }
        const formattedGroup = {
            id: group.id,
            hashedId: group.hashedId,
            name: group.groupname,
            description: group.body,
            memberCount: ((_b = group._count) === null || _b === void 0 ? void 0 : _b.groups_User) || 0,
            invite_code: group.invite_code,
        };
        return server_1.NextResponse.json(formattedGroup);
    }
    catch (error) {
        console.error('❌ グループ詳細取得エラー:', error);
        return server_1.NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
