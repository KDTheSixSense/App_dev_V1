// api/auth/mail.ts （POSTで呼び出される想定）
// api/auth/password-reset/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes, createHash } from 'crypto'; // createHash を追加

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    // ★ 修正点1: ユーザーが存在する場合のみ処理を行う
    if (user) {
      // ★ 修正点3: トークンを生成し、ハッシュ化する
      const rawToken = randomBytes(32).toString('hex');
      const hashedToken = createHash('sha256').update(rawToken).digest('hex');
      
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

      // ★ 修正点2: DBスキーマに合わせた正しいフィールド名を使用
      await prisma.user.update({
        where: { email },
        data: {
          resetPasswordToken: hashedToken, // ハッシュ化したトークンを保存
          resetPasswordTokenExpiry: expires,
        },
      });

      // メールにはハッシュ化する前の生のトークンを使用する
      const resetUrl = `https://yourdomain.com/reset-password?token=${rawToken}`;
      const message = `パスワードをリセットするには、次のリンクをクリックしてください:\n\n${resetUrl}`;

      // 実際のメール送信処理
      // await sendMail(email, message);
      console.log(`[開発用] リセットURL: ${resetUrl}`); // 開発中はコンソールで確認
    }
    
    // ★ 修正点1: ユーザーの存在有無に関わらず、常に同じ成功応答を返す
    // ★ 修正点4: NextResponse.json() を使用
    return NextResponse.json({ 
      message: 'パスワード再設定用のメールを送信しました。メールボックスをご確認ください。' 
    });

  } catch (error) {
    console.error(error);
    // 予期せぬエラーが発生した場合も、詳細を返さず一般的なメッセージを返す
    return NextResponse.json({ message: 'サーバーでエラーが発生しました。' }, { status: 500 });
  }
}