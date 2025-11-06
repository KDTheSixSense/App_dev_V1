"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const iron_session_1 = require("iron-session");
const session_1 = require("@/lib/session");
const headers_1 = require("next/headers");
const prisma = new client_1.PrismaClient();
async function POST(req) {
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    const user = session.user;
    if (!user || !user.id) {
        return server_1.NextResponse.json({ success: false, message: '認証されていません。' }, { status: 401 });
    }
    const userId = Number(user.id);
    try {
        const body = await req.json();
        const { title, description, explanation, answerOptions, correctAnswer, subjectId, difficultyId, } = body;
        if (!title || !description || !Array.isArray(answerOptions) || answerOptions.length === 0 || !correctAnswer || !subjectId || !difficultyId) {
            return server_1.NextResponse.json({ success: false, message: '必須項目が不足しています。' }, { status: 400 });
        }
        const newProblem = await prisma.selectProblem.create({
            data: {
                title,
                description,
                explanation,
                answerOptions: answerOptions,
                correctAnswer,
                subjectId,
                difficultyId,
                createdBy: userId,
            },
        });
        return server_1.NextResponse.json({ success: true, problem: newProblem }, { status: 201 });
    }
    catch (error) {
        console.error('Error creating select problem:', error);
        if (error instanceof Error) {
            return server_1.NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
        return server_1.NextResponse.json({ success: false, message: 'An unknown error occurred' }, { status: 500 });
    }
}
// 選択問題の一覧を取得するGETハンドラ (こちらも念のため記載)
async function GET(request) {
    console.warn('DEPRECATED: /api/select-problems is deprecated. Use /api/selects_problems instead.');
    // Redirect to the correct endpoint
    const url = new URL(request.url);
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/selects_problems${url.search}`, {
        method: 'GET',
        headers: Object.assign({}, Object.fromEntries(Array.from(request.headers.entries()).filter(([key]) => key.toLowerCase().includes('auth') || key.toLowerCase().includes('cookie'))))
    });
    return response;
}
