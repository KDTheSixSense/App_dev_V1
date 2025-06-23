import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user?.password || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
  }

  // 認証成功：必要なユーザー情報のみ返す
  return NextResponse.json({
    message: 'ログイン成功',
    user: {
      id: user.id,
      email: user.email,
      name: user.birth,
    },
  });
}
