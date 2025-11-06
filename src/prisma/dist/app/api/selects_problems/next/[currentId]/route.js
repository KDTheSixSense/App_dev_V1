"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma"); // 名前付きインポートを使用
async function GET(req, { params }) {
    try {
        const currentId = parseInt(params.currentId, 10);
        if (isNaN(currentId)) {
            return server_1.NextResponse.json({ message: '無効なIDです' }, { status: 400 });
        }
        // 現在のIDより大きいIDを持つ、同じ科目の問題をID順で検索し、最初の1件を取得する
        const nextProblem = await prisma_1.prisma.selectProblem.findFirst({
            where: {
                id: {
                    gt: currentId, // gt = greater than (より大きい)
                },
                subjectId: 4, // "プログラミング選択問題"の科目に限定
            },
            orderBy: {
                id: 'asc', // IDの昇順
            },
            select: {
                id: true, // IDのみ取得
            },
        });
        // 見つかればそのIDを、見つからなければnullを返す
        return server_1.NextResponse.json({ nextProblemId: (nextProblem === null || nextProblem === void 0 ? void 0 : nextProblem.id) || null });
    }
    catch (error) {
        console.error('Error fetching next problem ID:', error);
        return server_1.NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
