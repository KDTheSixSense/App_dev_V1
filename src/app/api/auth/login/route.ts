import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getAppSession } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit';
import { RateLimiter } from '@/lib/rate-limit';

// Instantiate the rate limiter with default settings (matches original logic)
// Default: 5 attempts, IP-based, 24h TTL, Exponential Backoff [1, 5, 10, 20...]
const limiter = new RateLimiter();

/**
 * ログインAPI
 * 
 * メールアドレスとパスワードによる認証を行います。
 * レート制限（Rate Limiting）と監査ログ（Audit Logging）の機能を含みます。
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // 1. Check Rate Limit (Before processing)
  const checkResult = limiter.check(ip);

  if (!checkResult.success) {
    const now = Date.now();
    const remainingMinutes = Math.ceil((checkResult.reset - now) / 60000);
    return NextResponse.json(
      { error: `ログイン試行回数が多すぎます。あと約${remainingMinutes}分後に再試行してください。` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const validationResult = loginSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json({ error: '入力内容が正しくありません', details: validationResult.error.flatten() }, { status: 400 });
  }

  const { email, password } = validationResult.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Timing Attack対策: ユーザーが存在しない場合でもハッシュ比較を行う
    const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvwxyz12345';
    const targetHash = user?.password || DUMMY_HASH;

    const isPasswordValid = await bcrypt.compare(password, targetHash);

    if (!user || !isPasswordValid) {
      // Increment attempt count on failure
      const limitResult = limiter.increment(ip);

      if (limitResult.isLockout) {
        const durationMinutes = limitResult.lockoutDurationMinutes || 1;
        await logAudit(null, AuditAction.LOGIN, { email, status: 'failed', reason: 'lockout', duration: durationMinutes });
        return NextResponse.json(
          { error: `ログイン試行回数が多すぎます。${durationMinutes}分間ロックアウトされました。` },
          { status: 429 }
        );
      } else {
        await logAudit(null, AuditAction.LOGIN, { email, status: 'failed', attempts: 5 - limitResult.remaining }); // approximate attempts
        return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
      }
    }

    // Login Success
    limiter.clear(ip); // Reset limits on success

    await logAudit(user.id, AuditAction.LOGIN, { status: 'success' });

    const session = await getAppSession();
    session.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: (user as any).isAdmin,
      tokenVersion: user.tokenVersion || 0,
    };
    await session.save();

    return NextResponse.json({ message: 'ログイン成功' });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
