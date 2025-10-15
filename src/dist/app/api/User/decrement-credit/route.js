"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const auth_1 = require("@/lib/auth");
/**
 * ユーザーのAIアドバイスクレジットを1つ消費するAPI
 */
async function POST(req) {
    try {
        const session = await (0, auth_1.getAppSession)();
        if (!session.user) {
            return server_1.NextResponse.json({ error: '認証されていません' }, { status: 401 });
        }
        const userId = Number(session.user.id);
        // 現在のユーザー情報を取得
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { aiAdviceCredits: true },
        });
        if (!user) {
            return server_1.NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
        }
        // クレジットが残っているかチェック
        if (user.aiAdviceCredits <= 0) {
            return server_1.NextResponse.json({ error: 'アドバイス回数が残っていません' }, { status: 400 });
        }
        // クレジットを1つ減らす
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                aiAdviceCredits: {
                    decrement: 1,
                },
            },
            select: {
                aiAdviceCredits: true,
            },
        });
        return server_1.NextResponse.json({
            message: 'クレジットを消費しました。',
            newCredits: updatedUser.aiAdviceCredits,
        });
    }
    catch (error) {
        console.error("Credit decrement failed:", error);
        return server_1.NextResponse.json({ error: '処理中にエラーが発生しました。' }, { status: 500 });
    }
}
