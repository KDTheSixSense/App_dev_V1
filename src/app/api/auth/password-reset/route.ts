import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs'; // パスワードのハッシュ化にbcryptjsを使用

/**
 * パスワード再設定完了API
 * 
 * トークンと新しいパスワードを受け取り、
 * トークンを検証してパスワードを更新します。
 */
export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'トークンとパスワードは必須です。' }, { status: 400 });
    }

    // 1. URLから受け取った生のトークンをハッシュ化して、DB検索用のキーにする
    const hashedToken = createHash('sha256').update(token).digest('hex');

    // 2. ハッシュ化されたトークンをDBで検索し、有効期限もチェック
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpiry: {
          gte: new Date(), // 有効期限が現在時刻より後か (期限切れでないか)
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'トークンが無効か、有効期限が切れています。' }, { status: 400 });
    }

    // 3. 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. ユーザーのパスワードを更新し、使用済みのリセットトークンを無効化（削除）
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword, // 'password' カラムを更新
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: 'パスワードが正常に更新されました。' });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}