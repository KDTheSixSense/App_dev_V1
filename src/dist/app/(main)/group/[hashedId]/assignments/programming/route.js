"use strict";
// /app/api/groups/[hashedId]/assignments/programming/route.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const iron_session_1 = require("iron-session");
const session_1 = require("@/lib/session");
const headers_1 = require("next/headers");
const client_1 = require("@prisma/client");
async function POST(req, context) {
    var _a;
    const { params } = context;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    const sessionUserId = (_a = session.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!sessionUserId) {
        return server_1.NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }
    const userId = Number(sessionUserId);
    try {
        const body = await req.json();
        // selectProblemId も受け取る
        const { title, description, dueDate, programmingProblemId, selectProblemId } = body;
        if (!title || !description || !dueDate) {
            return server_1.NextResponse.json({ success: false, message: '必須項目が不足しています' }, { status: 400 });
        }
        const group = await prisma_1.prisma.groups.findUnique({
            where: { hashedId: params.hashedId },
            select: { id: true },
        });
        if (!group) {
            return server_1.NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
        }
        const membership = await prisma_1.prisma.groups_User.findUnique({
            where: {
                group_id_user_id: { group_id: group.id, user_id: userId },
            },
        });
        if (!(membership === null || membership === void 0 ? void 0 : membership.admin_flg)) {
            return server_1.NextResponse.json({ success: false, message: '権限がありません' }, { status: 403 });
        }
        // ★ 修正: Prismaに渡すデータを作成
        const dataToCreate = {
            title,
            description,
            due_date: new Date(dueDate),
            group: {
                connect: { id: group.id }
            },
        };
        // programmingProblemId があれば接続
        if (programmingProblemId) {
            dataToCreate.programmingProblem = {
                connect: { id: Number(programmingProblemId) }
            };
        }
        // selectProblemId があれば接続
        else if (selectProblemId) {
            dataToCreate.selectProblem = {
                connect: { id: Number(selectProblemId) }
            };
        }
        const newAssignment = await prisma_1.prisma.assignment.create({
            data: dataToCreate,
        });
        return server_1.NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
    }
    catch (error) {
        console.error('課題作成エラー:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // Prismaのエラーをより具体的に返す
            return server_1.NextResponse.json({ success: false, message: `データベースエラー: ${error.message}` }, { status: 500 });
        }
        return server_1.NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
