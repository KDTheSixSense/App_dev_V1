"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
// /app/api/groups/route.ts
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
// グループ一覧を取得
async function GET() {
    try {
        const groups = await prisma_1.prisma.groups.findMany({
            orderBy: { id: 'asc' },
            include: {
                _count: {
                    select: { groups_User: true },
                },
            },
        });
        return server_1.NextResponse.json(groups);
    }
    catch (error) {
        console.error('❌ グループ取得エラー:', error);
        return server_1.NextResponse.json({ message: 'グループの取得に失敗しました' }, { status: 500 });
    }
}
// 新しいグループを作成
async function POST(request) {
    try {
        const body = await request.json();
        const { groupname, body: description } = body;
        if (!groupname) {
            return server_1.NextResponse.json({ message: 'グループ名は必須です' }, { status: 400 });
        }
        // TODO: 実際の認証情報からユーザーIDを取得する
        const creatorId = 1; // 仮の作成者ID
        const newGroup = await prisma_1.prisma.groups.create({
            data: {
                groupname,
                body: description || '',
                groups_User: {
                    create: {
                        user_id: creatorId,
                        admin_flg: true,
                    },
                },
                invite_code: '', // 招待コードは後で生成するか、別の方法で設定する
            },
        });
        return server_1.NextResponse.json(newGroup, { status: 201 });
    }
    catch (error) {
        console.error('❌ グループ作成エラー:', error);
        return server_1.NextResponse.json({ message: 'グループの作成に失敗しました' }, { status: 500 });
    }
}
