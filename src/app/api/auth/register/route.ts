// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requestToBodyStream } from 'next/dist/server/body-streams';

import { registerSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: '入力内容が正しくありません', errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, birth } = validation.data;
    const birthDate = birth ? new Date(birth) : null;

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

    // Audit Log
    try {
      await logAudit(user.id, AuditAction.REGISTER, { email });
    } catch (e) {
      // Ignore audit failure
    }

    return NextResponse.json({
      message: '登録完了',
      user: { id: user.id, email: user.email },
    });

  } catch (error) {
    console.error('登録処理エラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
