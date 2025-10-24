"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
async function GET(req, { params }) {
    console.log('--- API /api/select-problems/[problemId] CALLED ---'); // 1. APIが呼び出されたか確認
    try {
        const problemIdString = params.problemId;
        console.log(`[API LOG] Received problemId: "${problemIdString}"`); // 2. パラメータIDを確認
        const id = parseInt(problemIdString, 10);
        if (isNaN(id)) {
            console.error('[API ERROR] ID is not a number.');
            return server_1.NextResponse.json({ message: '無効なID形式です' }, { status: 400 });
        }
        console.log(`[API LOG] Parsed ID to number: ${id}`); // 3. 数値に変換できたか確認
        const problem = await prisma_1.prisma.selectProblem.findUnique({
            where: { id },
        });
        console.log('[API LOG] Prisma query result:', problem); // 4. DBからの取得結果を確認
        if (!problem) {
            console.warn(`[API WARN] Problem with ID ${id} not found in database.`);
            return server_1.NextResponse.json({ message: '問題が見つかりません' }, { status: 404 });
        }
        console.log('[API SUCCESS] Problem found. Returning data.'); // 5. 成功応答を返す直前
        return server_1.NextResponse.json(problem);
    }
    catch (error) {
        console.error('--- [API CATCH ERROR] ---', error);
        return server_1.NextResponse.json({ message: 'サーバー内部でエラーが発生しました' }, { status: 500 });
    }
}
