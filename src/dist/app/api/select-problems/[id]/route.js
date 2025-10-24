"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const session_1 = require("@/lib/session");
// GET: IDに基づいて単一の選択問題を取得
async function GET(request, { params }) {
    try {
        const session = await (0, session_1.getSession)();
        if (!session.user) {
            return server_1.NextResponse.json({ message: '認証が必要です' }, { status: 401 });
        }
        const problemId = parseInt(params.id, 10);
        if (isNaN(problemId)) {
            return server_1.NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
        }
        const problem = await prisma_1.prisma.selectProblem.findUnique({
            where: { id: problemId },
        });
        if (!problem) {
            return server_1.NextResponse.json({ message: '問題が見つかりません' }, { status: 404 });
        }
        // セキュリティ: ログインユーザーが作成者か確認
        if (problem.createdBy !== Number(session.user.id)) {
            return server_1.NextResponse.json({ message: '権限がありません' }, { status: 403 });
        }
        return server_1.NextResponse.json(problem);
    }
    catch (error) {
        console.error("Error fetching select problem:", error);
        return server_1.NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
// PUT: IDに基づいて選択問題を更新
async function PUT(request, { params }) {
    try {
        const session = await (0, session_1.getSession)();
        if (!session.user) {
            return server_1.NextResponse.json({ message: '認証が必要です' }, { status: 401 });
        }
        const problemId = parseInt(params.id, 10);
        if (isNaN(problemId)) {
            return server_1.NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
        }
        // セキュリティ: ログインユーザーが作成者か確認
        const existingProblem = await prisma_1.prisma.selectProblem.findUnique({ where: { id: problemId } });
        if (!existingProblem || existingProblem.createdBy !== Number(session.user.id)) {
            return server_1.NextResponse.json({ message: '権限がありません' }, { status: 403 });
        }
        const body = await request.json();
        const { title, description, explanation, answerOptions, correctAnswer, difficultyId } = body;
        const updatedProblem = await prisma_1.prisma.selectProblem.update({
            where: { id: problemId },
            data: {
                title,
                description,
                explanation,
                answerOptions,
                correctAnswer,
                difficultyId,
            },
        });
        return server_1.NextResponse.json({ success: true, problem: updatedProblem });
    }
    catch (error) {
        console.error("Error updating select problem:", error);
        return server_1.NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
