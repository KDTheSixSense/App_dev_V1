"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppSession = getAppSession;
const iron_session_1 = require("iron-session");
const headers_1 = require("next/headers");
const session_1 = require("./session");
async function getAppSession() {
    const cookieStore = (0, headers_1.cookies)();
    const session = await (0, iron_session_1.getIronSession)(await (cookieStore), session_1.sessionOptions);
    return session;
}
