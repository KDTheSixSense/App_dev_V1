"use strict";
// /app/api/submissions/route.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const iron_session_1 = require("iron-session");
const headers_1 = require("next/headers");
const prisma_1 = require("@/lib/prisma");
const session_1 = require("@/lib/session");
/**
 * 課題に対する新しい提出を作成します。
 */
async function POST(req) {
    var _a;
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    const sessionUserId = (_a = session.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!sessionUserId) {
        return server_1.NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { assignmentId, // どの課題に対する提出か
        status, // 例: '提出済み', '採点中'
        description, // 選択問題の答えや、プログラミング問題へのコメントなど
        codingId, // プログラミング問題の提出コードID
         } = body;
        // 基本的なバリデーション
        if (!assignmentId) {
            return server_1.NextResponse.json({ success: false, message: '課題IDが必要です' }, { status: 400 });
        }
        const userId = Number(sessionUserId);
        // トランザクションで権限チェックと作成を同時に行う
        const newSubmission = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. 課題が存在し、どのグループに属しているか確認
            const assignment = await tx.assignment.findUnique({
                where: { id: Number(assignmentId) },
                select: { groupid: true },
            });
            if (!assignment || !assignment.groupid) {
                throw new Error('指定された課題が見つかりません。');
            }
            // 2. ユーザーがそのグループのメンバーであるか確認
            const membership = await tx.groups_User.findFirst({
                where: { group_id: assignment.groupid, user_id: userId },
            });
            if (!membership) {
                throw new Error('この課題に提出する権限がありません。');
            }
            // 3. 既存の提出レコードを検索
            const existingSubmission = await tx.submissions.findUnique({
                where: {
                    assignment_id_userid: {
                        assignment_id: Number(assignmentId),
                        userid: userId,
                    },
                },
            });
            if (existingSubmission) {
                // 4a. レコードがあれば更新
                return tx.submissions.update({
                    where: { id: existingSubmission.id },
                    data: Object.assign(Object.assign({ status: status || '提出済み', description: description || '' }, (codingId !== undefined && { codingid: Number(codingId) })), { submitted_at: new Date() }),
                });
            }
            else {
                // 4b. レコードがなければ作成
                return tx.submissions.create({
                    data: {
                        assignment_id: Number(assignmentId),
                        userid: userId,
                        status: status || '提出済み',
                        description: description || '',
                        codingid: codingId ? Number(codingId) : 0,
                        submitted_at: new Date(),
                    },
                });
            }
        });
        return server_1.NextResponse.json({ success: true, data: newSubmission }, { status: 201 });
    }
    catch (error) {
        console.error('提出APIエラー:', error instanceof Error ? error.message : error);
        if (error instanceof Error) {
            if (error.message.includes('課題が見つかりません')) {
                return server_1.NextResponse.json({ success: false, message: error.message }, { status: 404 });
            }
            if (error.message.includes('権限がありません')) {
                return server_1.NextResponse.json({ success: false, message: error.message }, { status: 403 });
            }
        }
        return server_1.NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
