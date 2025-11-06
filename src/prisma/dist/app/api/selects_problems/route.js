"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const iron_session_1 = require("iron-session");
const session_1 = require("@/lib/session");
const headers_1 = require("next/headers");
async function GET(req) {
    var _a;
    try {
        const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
        if (!((_a = session.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return server_1.NextResponse.json({ message: '認証が必要です' }, { status: 401 });
        }
        // Fetch all selection problems
        const selectionProblemsRaw = await prisma_1.prisma.selectProblem.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                subject: true,
                difficulty: true,
                creator: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
        // Flatten the data structure for easier consumption by the frontend
        const selectionProblems = selectionProblemsRaw.map(problem => {
            var _a, _b;
            return ({
                id: problem.id,
                title: problem.title,
                description: problem.description,
                explanation: problem.explanation,
                answerOptions: problem.answerOptions,
                correctAnswer: problem.correctAnswer,
                difficulty: ((_a = problem.difficulty) === null || _a === void 0 ? void 0 : _a.id) || problem.difficultyId,
                difficultyId: ((_b = problem.difficulty) === null || _b === void 0 ? void 0 : _b.id) || problem.difficultyId,
                subjectId: problem.subjectId,
                createdBy: problem.createdBy,
                createdAt: problem.createdAt,
                updatedAt: problem.updatedAt,
                subject: problem.subject,
                creator: problem.creator
            });
        });
        return server_1.NextResponse.json(selectionProblems, { status: 200 });
    }
    catch (error) {
        console.error('Error fetching selection problems:', error);
        return server_1.NextResponse.json({ message: '選択問題の取得中にエラーが発生しました' }, { status: 500 });
    }
}
async function POST(req) {
    try {
        const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
        // ログインしていない場合はエラーを返す
        if (!session.user || !session.user.id) {
            return server_1.NextResponse.json({ message: '認証が必要です' }, { status: 401 });
        }
        const userId = parseInt(String(session.user.id), 10);
        if (isNaN(userId)) {
            return server_1.NextResponse.json({ message: '無効なユーザーIDです' }, { status: 400 });
        }
        const body = await req.json();
        const { title, description, explanation, answerOptions, correctAnswer, subjectId, difficultyId, } = body;
        if (!title || !description || !answerOptions || !correctAnswer || !subjectId || !difficultyId) {
            return server_1.NextResponse.json({ message: '必須フィールドが不足しています' }, { status: 400 });
        }
        const newProblem = await prisma_1.prisma.selectProblem.create({
            data: {
                title, description, explanation, answerOptions,
                correctAnswer, difficultyId, subjectId, createdBy: userId,
            },
        });
        return server_1.NextResponse.json({ success: true, problem: newProblem, id: newProblem.id, title: newProblem.title }, { status: 201 });
    }
    catch (error) {
        console.error('Error creating select problem:', error);
        return server_1.NextResponse.json({ message: '問題の作成中にエラーが発生しました' }, { status: 500 });
    }
}
