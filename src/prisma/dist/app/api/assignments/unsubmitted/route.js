"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const headers_1 = require("next/headers"); // サーバーコンポーネント/Route Handlerでクッキーを取得
const jsonwebtoken_1 = require("jsonwebtoken"); // JWTを検証
const prisma = new client_1.PrismaClient();
async function GET() {
    var _a;
    try {
        // 1. Cookieからトークンを取得し、ユーザーIDを復元
        const cookieStore = await (0, headers_1.cookies)();
        const token = (_a = cookieStore.get('token')) === null || _a === void 0 ? void 0 : _a.value;
        if (!token) {
            return server_1.NextResponse.json({ error: '認証されていません' }, { status: 401 });
        }
        // JWTを検証してユーザーIDを取得
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        if (!userId) {
            return server_1.NextResponse.json({ error: '無効なユーザーです' }, { status: 401 });
        }
        // 2. Prismaで未提出の課題を検索
        const unsubmittedAssignments = await prisma.assignment.findMany({
            where: {
                // ユーザーが所属しているグループの課題に絞り込む
                group: {
                    groups_User: {
                        some: {
                            user_id: userId,
                        },
                    },
                },
                // かつ、そのユーザーからの提出記録(Submissions)が存在しない課題に絞り込む
                Submissions: {
                    none: {
                        userid: userId,
                    },
                },
            },
            // レスポンスに含めたい情報を指定
            select: {
                id: true,
                title: true,
                description: true,
                due_date: true,
                group: {
                    select: {
                        groupname: true,
                        hashedId: true,
                    },
                },
            },
            orderBy: {
                due_date: 'asc', // 期限が近い順に並び替え
            },
        });
        // 3. フロントエンドが使いやすいようにデータを整形
        const formattedData = unsubmittedAssignments.map(assignment => ({
            id: assignment.id,
            title: assignment.title,
            dueDate: assignment.due_date,
            groupName: assignment.group.groupname,
            groupHashedId: assignment.group.hashedId,
        }));
        return server_1.NextResponse.json({ assignments: formattedData }, { status: 200 });
    }
    catch (error) {
        console.error('未提出課題の取得に失敗しました:', error);
        // JWTの期限切れなどのエラーをハンドリング
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return server_1.NextResponse.json({ error: '認証トークンが無効です' }, { status: 401 });
        }
        return server_1.NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
