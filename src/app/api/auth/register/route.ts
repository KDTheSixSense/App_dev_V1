// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requestToBodyStream } from 'next/dist/server/body-streams';

export async function POST(req: NextRequest) {
  try {
    const { email, password, birth } = await req.json();

    if (!email || !password || !birth) {
      return NextResponse.json({ message: 'email, password, birthは必須です' }, { status: 400 });
    }

    const birthDate = new Date(birth);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'このメールはすでに登録されています' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        birth: birthDate,
      },
    });

    return NextResponse.json({
      message: '登録完了',
      user: { id: user.id, email: user.email },
    });

  } catch (error) {
    console.error('登録処理エラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
