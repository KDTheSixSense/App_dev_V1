// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requestToBodyStream } from 'next/dist/server/body-streams';

import { z } from 'zod';

const registerApiSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  birth: z.string().optional(), // birth is optional in schema but required in logic? Original code required it.
  // Let's keep original logic: required.
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Manual validation or Zod? Let's use Zod for consistency but keep it simple.
    // Original code: if (!email || !password || !birth)

    const { email, password, birth } = body;

    if (!email || !password || !birth) {
      return NextResponse.json({ message: 'email, password, birthは必須です' }, { status: 400 });
    }

    // Additional Type Check to prevent Object Injection or weird types
    if (typeof email !== 'string' || typeof password !== 'string' || typeof birth !== 'string') {
      return NextResponse.json({ message: '無効なデータ形式です' }, { status: 400 });
    }

    const birthDate = new Date(birth);
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json({ message: '無効な日付です' }, { status: 400 });
    }

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
