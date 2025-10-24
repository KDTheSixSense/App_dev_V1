"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionOptions = void 0;
exports.getSession = getSession;
// /workspaces/my-next-app/src/lib/session.ts
const iron_session_1 = require("iron-session");
const headers_1 = require("next/headers");
/**
 * セッションの設定オブジェクト
 */
exports.sessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD,
    cookieName: process.env.COOKIE_NAME,
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
};
/**
 * サーバーコンポーネント、Server Actions、APIルートで現在のセッションを取得するためのヘルパー関数です。
 */
async function getSession() {
    // ▼▼▼【修正】再度 as any を追加して、頑固な型エラーを回避します ▼▼▼
    const session = await (0, iron_session_1.getIronSession)((0, headers_1.cookies)(), exports.sessionOptions);
    return session;
}
