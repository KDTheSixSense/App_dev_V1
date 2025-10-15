"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const auth_1 = require("@/lib/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function POST(req) {
    var _a;
    try {
        const session = await (0, auth_1.getAppSession)();
        if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return server_1.NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }
        const { currentPassword, newPassword } = await req.json();
        if (!currentPassword || !newPassword) {
            return server_1.NextResponse.json({ message: '現在のパスワードと新しいパスワードは必須です。' }, { status: 400 });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: session.user.id },
        });
        if (!user) {
            return server_1.NextResponse.json({ message: 'ユーザーが見つかりません。' }, { status: 404 });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return server_1.NextResponse.json({ message: '現在のパスワードが正しくありません。' }, { status: 400 });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
        });
        return server_1.NextResponse.json({ message: 'パスワードが正常に更新されました。' });
    }
    catch (error) {
        console.error('Password change error:', error);
        return server_1.NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}
