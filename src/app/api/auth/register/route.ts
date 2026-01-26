// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit';
import { RateLimiter } from '@/lib/rate-limit';

// Registration Rate Limiter
// Stricter than login: 5 registrations per hour per IP
// Base lockout: 60 minutes
const registerLimiter = new RateLimiter({
  maxAttempts: 5,
  ttl: 60 * 60 * 1000, // 1 hour
  baseLockoutMinutes: [60, 120, 240] // 1h, 2h, 4h
});

/**
 * 新規会員登録API
 * 
 * メールアドレス、パスワード、生年月日などを受け取り、
 * 新規ユーザーを作成します。レート制限機能付きです。
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    // 1. Rate Limit Check
    const checkResult = registerLimiter.check(ip);
    if (!checkResult.success) {
      const now = Date.now();
      const remainingMinutes = Math.ceil((checkResult.reset - now) / 60000);
      return NextResponse.json(
        { message: `登録試行回数が多すぎます。あと約${remainingMinutes}分後に再試行してください。` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      // Just count invalid attempts logic? Or only successfully started ones?
      // Usually better to count all attempts to stop brute forcing schema or spamming
      registerLimiter.increment(ip);
      return NextResponse.json(
        { message: '入力内容が正しくありません', errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, birth } = validation.data;
    const birthDate = birth ? new Date(birth) : null;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      registerLimiter.increment(ip);
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

    // Success - we might NOT want to clear limits here to prevent
    // a single IP creating unlimited accounts even if they are valid.
    // So we invoke increment() to count this as a successful registration towards the limit.
    registerLimiter.increment(ip);

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
