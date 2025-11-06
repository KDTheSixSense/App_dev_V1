"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const iron_session_1 = require("iron-session");
const session_1 = require("@/lib/session");
const headers_1 = require("next/headers");
async function POST(req) {
    var _a;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    const sessionUserId = (_a = session.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!sessionUserId) {
        return server_1.NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { assignmentTitle, assignmentDescription, dueDate, problemData, groupId } = body;
        if (!assignmentTitle || !dueDate || !problemData || !groupId) {
            return server_1.NextResponse.json({ success: false, message: '必須項目が不足しています。' }, { status: 400 });
        }
        const newAssignment = await prisma_1.prisma.$transaction(async (tx) => {
            // グループの存在と管理者の権限をチェック
            const group = await tx.groups.findUnique({
                where: { id: Number(groupId) },
            });
            if (!group) {
                throw new Error('グループが見つかりません');
            }
            const userId = Number(sessionUserId);
            const membership = await tx.groups_User.findFirst({
                where: {
                    group_id: group.id,
                    user_id: userId,
                    admin_flg: true,
                },
            });
            if (!membership) {
                throw new Error('この操作を行う権限がありません');
            }
            // 1. 4択問題 (SelectProblem) を作成
            const newProblem = await tx.selectProblem.create({
                data: {
                    title: problemData.title,
                    description: problemData.description,
                    explanation: problemData.explanation,
                    answerOptions: problemData.answerOptions || {}, // JSON形式
                    correctAnswer: problemData.correctAnswer,
                    difficulty: { connect: { id: Number(problemData.difficultyId) } },
                    subject: { connect: { id: Number(problemData.subjectId) } },
                    creator: { connect: { id: userId } },
                },
            });
            // 2. 課題 (Assignment) を作成し、作成した4択問題と紐付ける
            const createdAssignment = await tx.assignment.create({
                data: {
                    title: assignmentTitle,
                    description: assignmentDescription,
                    due_date: new Date(dueDate),
                    group: { connect: { id: group.id } },
                    // ★★★ ここで `selectProblem` に接続します ★★★
                    selectProblem: { connect: { id: newProblem.id } },
                },
                // レスポンスにselectProblemを含める
                include: {
                    selectProblem: true,
                },
            });
            return createdAssignment;
        });
        return server_1.NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
    }
    catch (error) {
        console.error('4択問題課題作成APIエラー:', error instanceof Error ? error.message : error);
        if (error instanceof Error) {
            if (error.message === 'グループが見つかりません') {
                return server_1.NextResponse.json({ success: false, message: error.message }, { status: 404 });
            }
            if (error.message === 'この操作を行う権限がありません') {
                return server_1.NextResponse.json({ success: false, message: error.message }, { status: 403 });
            }
        }
        return server_1.NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
