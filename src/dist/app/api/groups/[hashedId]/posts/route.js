"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
// /app/api/groups/[hashedId]/posts/route.ts (新規作成)
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const iron_session_1 = require("iron-session");
const session_1 = require("@/lib/session");
const headers_1 = require("next/headers");
// お知らせ一覧を取得 (GET)
async function GET(req, { params }) {
    var _a;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    if (!((_a = session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return server_1.NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }
    try {
        // hashedIdからグループのIDを取得
        const group = await prisma_1.prisma.groups.findUnique({
            where: { hashedId: params.hashedId },
            select: { id: true },
        });
        if (!group) {
            return server_1.NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
        }
        // グループIDに紐づく投稿を、投稿者情報を含めて取得
        const posts = await prisma_1.prisma.post.findMany({
            where: { groupId: group.id },
            include: {
                author: {
                    select: {
                        username: true, // ユーザー名だけ取得
                    },
                },
            },
            orderBy: {
                createdAt: 'desc', // 新しい順に並び替え
            },
        });
        return server_1.NextResponse.json({ success: true, data: posts });
    }
    catch (error) {
        console.error('お知らせ取得エラー:', error);
        return server_1.NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
// ✨【ここから追加】お知らせを投稿 (POST)
async function POST(req, { params }) {
    var _a;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    const sessionUserId = (_a = session.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!sessionUserId) {
        return server_1.NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }
    const userId = Number(sessionUserId);
    try {
        const body = await req.json();
        const { content } = body;
        if (!content) {
            return server_1.NextResponse.json({ success: false, message: '投稿内容がありません' }, { status: 400 });
        }
        const group = await prisma_1.prisma.groups.findUnique({
            where: { hashedId: params.hashedId },
            select: { id: true },
        });
        if (!group) {
            return server_1.NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
        }
        // (オプション) 管理者のみ投稿可能にする場合は、ここで権限チェックを追加
        const newPost = await prisma_1.prisma.post.create({
            data: {
                content,
                groupId: group.id,
                authorId: userId,
            },
            include: {
                author: {
                    select: { username: true }
                }
            }
        });
        return server_1.NextResponse.json({ success: true, data: newPost }, { status: 201 });
    }
    catch (error) {
        console.error('お知らせ投稿エラー:', error);
        return server_1.NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
