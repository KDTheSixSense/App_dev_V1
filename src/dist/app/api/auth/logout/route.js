"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
async function POST() {
    try {
        // 専用関数でセッションを取得
        const session = await (0, auth_1.getAppSession)();
        // セッションを破棄します
        session.destroy();
        return server_1.NextResponse.json({ message: 'ログアウトしました' });
    }
    catch (error) {
        console.error('Logout Error:', error);
        return server_1.NextResponse.json({ error: 'ログアウト処理に失敗しました' }, { status: 500 });
    }
}
