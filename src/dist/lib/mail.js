"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
// lib/mail.ts
const nodemailer_1 = __importDefault(require("nodemailer")); // nodemailerをインポートします
// メール送信関数の定義
async function sendPasswordResetEmail(to, url) {
    // 1. Gmail用の送信設定を作成します
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail', // Gmailサービスを指定
        auth: {
            user: process.env.EMAIL_SERVER_USER, // .env.localから取得
            pass: process.env.EMAIL_SERVER_PASSWORD, // .env.localから取得 (16桁のアプリパスワード)
        },
    });
    // 2. 送信するメールの内容を設定します
    const mailOptions = {
        from: `"INFOPIA" <${process.env.EMAIL_FROM}>`, // 送信元
        to: to, // 送信先
        subject: 'パスワードの再設定について', // 件名
        html: `
      <p>パスワードを再設定するには、以下のリンクをクリックしてください。</p>
      <p>このリンクは1時間有効です。</p>
      <a href="${url}">${url}</a>
    `,
    };
    // 3. メールを送信します
    try {
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent successfully via Gmail.');
    }
    catch (error) {
        console.error('Failed to send email via Gmail:', error);
        throw new Error('Email could not be sent.');
    }
}
