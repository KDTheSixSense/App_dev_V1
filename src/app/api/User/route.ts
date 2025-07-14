import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
/**
 * GETリクエストはセキュリティリスクのため、
 * 管理者専用にするか、不要であれば削除することを推奨します。
 * ここでは、パスワードなどの機密情報を除外する例を示します。
 */
export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      level: true,
      xp: true,
    }
  });
  return NextResponse.json(users);
}

/**
 * 新規ユーザー登録 (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        birth: data.birth,
        username: data.username, // usernameも追加
      },
    });

    const { password, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002はユニーク制約違反（メールアドレス重複など）のエラーコード
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'このメールアドレスは既に使用されています。' }, { status: 409 });
      }
    }
    // その他のサーバーエラー
    console.error("User registration failed:", error);
    return NextResponse.json({ error: 'ユーザー登録に失敗しました。' }, { status: 500 });
  }
}
