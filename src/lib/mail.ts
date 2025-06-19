// lib/mail.ts
import nodemailer from 'nodemailer';

// メール送信関数の定義
export async function sendPasswordResetEmail(to: string, url: string) {
  // 1. 送信に使用するSMTPサーバーの情報を設定
  //    実際には環境変数から取得するのが安全です
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SERVER_USER, // .env.localファイルから取得
      pass: process.env.EMAIL_SERVER_PASSWORD, // .env.localファイルから取得
    },
  });

  // 2. 送信するメールの内容を設定
  const mailOptions = {
    from: `"あなたのサービス名" <${process.env.EMAIL_FROM}>`, // 送信元
    to: to, // 送信先
    subject: 'パスワードの再設定について', // 件名
    html: `
      <p>パスワードを再設定するには、以下のリンクをクリックしてください。</p>
      <p>このリンクは1時間有効です。</p>
      <a href="${url}">${url}</a>
    `,
  };

  // 3. メールを送信
  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully.');
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // エラーを投げるか、あるいはここで適切に処理します
    throw new Error('Email could not be sent.');
  }
}