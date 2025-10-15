"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// グローバルオブジェクトにPrismaClientのインスタンスを格納するためのキーを定義
const globalForPrisma = globalThis;
// prismaインスタンスが存在すればそれを使い、なければ新しく作成する
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : new client_1.PrismaClient({
    // 開発環境でのみ、実行されたクエリをログに出力するように設定するとデバッグに便利です
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
// 開発環境でのみ、グローバルオブジェクトにprismaインスタンスを格納する
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
