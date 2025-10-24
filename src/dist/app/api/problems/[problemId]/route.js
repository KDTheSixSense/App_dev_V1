"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
// /app/api/problems/[problemId]/route.ts
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const auth_1 = require("@/lib/auth"); // セッション取得関数をインポート
const prisma = new client_1.PrismaClient();
// --- GET関数 (変更なし) ---
async function GET(request, { params }) {
    const problemId = parseInt(params.problemId, 10);
    if (isNaN(problemId)) {
        return server_1.NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
    }
    try {
        const problem = await prisma.programmingProblem.findUnique({
            where: { id: problemId },
            include: {
                sampleCases: true,
                testCases: true,
                files: true,
            },
        });
        if (!problem) {
            return server_1.NextResponse.json({ message: '問題が見つかりません' }, { status: 404 });
        }
        return server_1.NextResponse.json(problem, { status: 200 });
    }
    catch (error) {
        console.error('問題の取得中にエラーが発生しました:', error);
        return server_1.NextResponse.json({ message: '問題の取得に失敗しました', error: error.message }, { status: 500 });
    }
}
// --- PUT関数 (問題データを更新するため) ---
async function PUT(request, { params }) {
    var _a;
    const problemId = parseInt(params.problemId, 10);
    if (isNaN(problemId)) {
        return server_1.NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
    }
    try {
        // 1. 認可：セッションからユーザー情報を取得
        const session = await (0, auth_1.getAppSession)();
        const userId = (_a = session.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return server_1.NextResponse.json({ message: '認証が必要です。ログインしてください。' }, { status: 401 });
        }
        // 2. 認可：問題の存在と所有者を確認
        const existingProblem = await prisma.programmingProblem.findUnique({
            where: { id: problemId },
        });
        if (!existingProblem) {
            return server_1.NextResponse.json({ message: '更新対象の問題が見つかりません' }, { status: 404 });
        }
        if (Number(existingProblem.createdBy) !== Number(userId)) {
            return server_1.NextResponse.json({ message: 'この問題を編集する権限がありません' }, { status: 403 });
        }
        const body = await request.json();
        // 3. トランザクション内で安全にデータ更新
        const updatedProblem = await prisma.$transaction(async (tx) => {
            // a. 既存の関連データ（サンプル、テストケース）を一旦削除
            await tx.sampleCase.deleteMany({ where: { problemId: problemId } });
            await tx.testCase.deleteMany({ where: { problemId: problemId } });
            // ※ ファイルの更新処理も必要であればここに追加します
            // b. 問題本体を更新
            const problem = await tx.programmingProblem.update({
                where: { id: problemId },
                data: {
                    title: body.title,
                    problemType: body.problemType,
                    difficulty: body.difficulty,
                    timeLimit: body.timeLimit,
                    category: body.category,
                    topic: body.topic,
                    tags: JSON.stringify(body.tags || []), // 配列をJSON文字列に変換
                    description: body.description,
                    codeTemplate: body.codeTemplate,
                    isPublic: body.isPublic,
                    allowTestCaseView: body.allowTestCaseView,
                    updatedAt: new Date(), // 更新日時をセット
                },
            });
            // c. 新しいサンプルケースを登録
            if (body.sampleCases && body.sampleCases.length > 0) {
                await tx.sampleCase.createMany({
                    data: body.sampleCases.map((sc, index) => ({
                        problemId: problemId,
                        input: sc.input,
                        expectedOutput: sc.expectedOutput,
                        description: sc.description || '',
                        order: index + 1,
                    })),
                });
            }
            // d. 新しいテストケースを登録
            if (body.testCases && body.testCases.length > 0) {
                await tx.testCase.createMany({
                    data: body.testCases.map((tc, index) => ({
                        problemId: problemId,
                        name: tc.name,
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        description: tc.description || '',
                        order: index + 1,
                    })),
                });
            }
            return problem;
        });
        return server_1.NextResponse.json({ message: '問題が正常に更新されました！', problem: updatedProblem }, { status: 200 });
    }
    catch (error) {
        console.error('問題の更新中にエラーが発生しました:', error);
        return server_1.NextResponse.json({ message: '問題の更新に失敗しました', error: error.message }, { status: 500 });
    }
}
