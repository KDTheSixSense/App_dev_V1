"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const crypto_1 = require("crypto");
const nodemailer_1 = __importDefault(require("nodemailer")); // Nodemailerをインポートします
async function POST(req) {
    try {
        const { email } = await req.json();
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (user) {
            // --- トークン生成ロジック ---
            const rawToken = (0, crypto_1.randomBytes)(32).toString('hex');
            const hashedToken = (0, crypto_1.createHash)('sha256').update(rawToken).digest('hex');
            const expires = new Date(Date.now() + 3600000); // 1時間後
            await prisma_1.prisma.user.update({
                where: { email },
                data: {
                    resetPasswordToken: hashedToken,
                    resetPasswordTokenExpiry: expires,
                },
            });
            // 環境変数からベースURLを取得
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
            const resetUrl = `${baseUrl}/reset-password/${rawToken}`;
            console.log(`[開発用] リセットURL: ${resetUrl}`);
            // --- Nodemailer (Gmail) メール送信ロジック ---
            const transporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD, // 16桁のアプリパスワード
                },
            });
            const mailOptions = {
                from: `"INFOPIA" <${process.env.EMAIL_FROM}>`,
                to: email,
                subject: 'パスワードの再設定について',
                html: `
          <p>パスワードを再設定するには、以下のリンクをクリックしてください。</p>
          <p>このリンクは1時間有効です。</p>
          <a href="${resetUrl}">${resetUrl}</a>
        `,
            };
            await transporter.sendMail(mailOptions);
            console.log(`Gmail経由でメール送信成功 (to: ${email})`);
        }
        return server_1.NextResponse.json({
            message: 'パスワード再設定用のリクエストを受け付けました。'
        });
    }
    catch (error) {
        console.error('!!! Gmail送信またはDB処理でエラーが発生 !!!', error);
        return server_1.NextResponse.json({ message: 'サーバーでエラーが発生しました。' }, { status: 500 });
    }
}
