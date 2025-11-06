"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("@/lib/auth"); // ★ 作成した関数をインポート
async function POST(req) {
    const { email, password } = await req.json();
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!(user === null || user === void 0 ? void 0 : user.password) || !(await bcryptjs_1.default.compare(password, user.password))) {
            return server_1.NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
        }
        // --- ▼▼ この部分を修正 ▼▼ ---
        // 専用関数を呼び出してセッションを取得します
        const session = await (0, auth_1.getAppSession)();
        session.user = {
            id: user.id,
            email: user.email,
            username: user.username,
        };
        await session.save();
        return server_1.NextResponse.json({ message: 'ログイン成功' });
    }
    catch (error) {
        console.error("API Error:", error);
        return server_1.NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
