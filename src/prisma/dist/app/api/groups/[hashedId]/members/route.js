"use strict";
// src/app/api/groups/[hashedId]/members/route.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const session_1 = require("@/lib/session");
async function GET(request, context) {
    const { params } = context;
    try {
        const session = await (0, session_1.getSession)();
        if (!session.user) {
            return server_1.NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
        }
        const { hashedId } = params;
        const group = await prisma_1.prisma.groups.findUnique({
            where: { hashedId },
            include: {
                groups_User: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                icon: true,
                                level: true,
                                xp: true,
                            },
                        },
                    },
                },
            },
        });
        if (!group) {
            return server_1.NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
        }
        // フロントエンドの型定義に合わせてデータを整形
        const members = group.groups_User.map(gu => {
            var _a;
            return ({
                id: gu.user.id,
                name: gu.user.username || '名無し',
                email: gu.user.email,
                avatar: gu.user.icon || ((_a = gu.user.username) === null || _a === void 0 ? void 0 : _a.charAt(0)) || '?', // アバターがない場合のフォールバック
                isAdmin: gu.admin_flg,
                onlineStatus: 'offline', // オンライン状態は別途実装が必要です
                level: gu.user.level,
                xp: gu.user.xp,
                posts: 0, // 仮の値
                assignments: 0, // 仮の値
                attendance: 0, // 仮の値
            });
        });
        const adminCount = members.filter(m => m.isAdmin).length;
        const stats = {
            totalMembers: members.length,
            onlineMembers: 0, // オンライン状態は別途実装が必要です
            adminCount: adminCount,
            studentCount: members.length - adminCount,
        };
        return server_1.NextResponse.json({ success: true, data: { members, stats } });
    }
    catch (error) {
        console.error('メンバー情報の取得エラー:', error);
        return server_1.NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
