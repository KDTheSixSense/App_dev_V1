"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withApiSession = withApiSession;
const iron_session_1 = require("iron-session");
const headers_1 = require("next/headers");
const session_1 = require("./session");
/**
 * APIルートをラップして、セッションオブジェクトをハンドラに渡す関数
 * @param handler APIルートの実処理を行う関数
 * @returns ラップされたAPIルート
 */
function withApiSession(handler) {
    return async function (req) {
        const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
        return handler(req, session);
    };
}
