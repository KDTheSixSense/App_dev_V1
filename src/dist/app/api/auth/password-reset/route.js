"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const crypto_1 = require("crypto");
const bcryptjs_1 = __importDefault(require("bcryptjs")); // パスワードのハッシュ化にbcryptjsを使用
async function POST(req) {
    try {
        const { token, password } = await req.json();
        if (!token || !password) {
            return server_1.NextResponse.json({ message: 'トークンとパスワードは必須です。' }, { status: 400 });
        }
        // 1. URLから受け取った生のトークンをハッシュ化して、DB検索用のキーにする
        const hashedToken = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        // 2. ハッシュ化されたトークンをDBで検索し、有効期限もチェック
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordTokenExpiry: {
                    gte: new Date(), // 有効期限が現在時刻より後か (期限切れでないか)
                },
            },
        });
        if (!user) {
            return server_1.NextResponse.json({ message: 'トークンが無効か、有効期限が切れています。' }, { status: 400 });
        }
        // 3. 新しいパスワードをハッシュ化
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // 4. ユーザーのパスワードを更新し、使用済みのリセットトークンを無効化（削除）
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword, // 'password' カラムを更新
                resetPasswordToken: null,
                resetPasswordTokenExpiry: null,
            },
        });
        return server_1.NextResponse.json({ message: 'パスワードが正常に更新されました。' });
    }
    catch (error) {
        console.error('Password reset error:', error);
        return server_1.NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}
