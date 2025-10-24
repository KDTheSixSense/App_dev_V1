"use strict";
// /app/api/posts/route.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma"); // シングルトンインスタンスをインポート
const client_1 = require("@prisma/client");
async function POST(request) {
    try {
        const body = await request.json();
        const { content, groupId } = body;
        // --- バリデーション ---
        if (!content || !groupId) {
            return server_1.NextResponse.json({ message: '投稿内容とグループIDは必須です' }, { status: 400 });
        }
        // TODO: 実際の認証情報からユーザーIDを取得する
        const authorId = 1; // 仮のユーザーID
        const newPost = await prisma_1.prisma.post.create({
            data: {
                content,
                groupId: Number(groupId),
                authorId: authorId,
            },
        });
        return server_1.NextResponse.json({ message: '投稿に成功しました', post: newPost }, { status: 201 });
    }
    catch (error) {
        console.error('❌ 投稿APIエラー:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return server_1.NextResponse.json({ message: 'データベースエラー', error: error.code }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: 'サーバー内部エラー' }, { status: 500 });
    }
}
