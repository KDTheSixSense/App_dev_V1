import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getAppSession } from '@/lib/auth'; // ★ 作成した関数をインポート

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    // --- ▼▼ この部分を修正 ▼▼ ---
    // 専用関数を呼び出してセッションを取得します
    const session = await getAppSession();

    session.user = {
      id: String(user.id),
      email: user.email,
      username: user.username,
    };
    await session.save();

    return NextResponse.json({ message: 'ログイン成功' });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
