import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getAppSession } from '@/lib/auth';
import { LRUCache } from 'lru-cache';
import { loginSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit';

// レート制限の状態を管理するインターフェース
interface RateLimitState {
  attempts: number;      // 現在の失敗回数
  lockoutLevel: number;  // ロックアウトレベル (0: 初回, 1: 2回目...)
  lockoutUntil: number;  // ロックアウト解除時刻 (UNIX timestamp, 0ならロックなし)
}

// レート制限のキャッシュ (IPアドレスごとに制限)
// TTLは長めに設定 (24時間) し、ロジック内でロックアウト時間を管理する
const rateLimitCache = new LRUCache<string, RateLimitState>({
  max: 500,
  ttl: 24 * 60 * 60 * 1000, // 24時間
});

// ロックアウト時間の計算 (分)
function getLockoutDurationMinutes(level: number): number {
  if (level === 0) return 1;
  if (level === 1) return 5;
  if (level === 2) return 10;
  if (level === 3) return 20;
  // 4回目以降は前回の倍 (20 * 2^(level-3)) -> 40, 80, 160...
  return 20 * Math.pow(2, level - 3);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // キャッシュから状態を取得、なければ初期化
  let state = rateLimitCache.get(ip) || { attempts: 0, lockoutLevel: 0, lockoutUntil: 0 };

  // 1. ロックアウト中かチェック
  const now = Date.now();
  if (state.lockoutUntil > now) {
    const remainingMinutes = Math.ceil((state.lockoutUntil - now) / 60000);
    return NextResponse.json(
      { error: `ログイン試行回数が多すぎます。あと約${remainingMinutes}分後に再試行してください。` },
      { status: 429 }
    );
  }

  // ロックアウト時間が過ぎていれば、ロックアウト状態を解除
  if (state.lockoutUntil !== 0 && state.lockoutUntil <= now) {
    state.lockoutUntil = 0;
    state.attempts = 0; // 試行回数もリセットして再チャレンジ
    rateLimitCache.set(ip, state);
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
    // ダミーのハッシュ (有効なbcryptハッシュ形式)
    const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuvabcdefghijklmnopqrstuvwxyz12345';
    const targetHash = user?.password || DUMMY_HASH;

    // ユーザーが存在しない、またはパスワードが一致しない場合
    // userが存在しない場合でも bcrypt.compare を実行させることで、応答時間の差をなくす
    const isPasswordValid = await bcrypt.compare(password, targetHash);

    if (!user || !isPasswordValid) {
      state.attempts += 1;

      // 5回失敗したらロックアウト
      if (state.attempts >= 5) {
        const durationMinutes = getLockoutDurationMinutes(state.lockoutLevel);
        state.lockoutUntil = now + durationMinutes * 60 * 1000;
        state.lockoutLevel += 1; // 次回のロックアウトのためにレベルを上げる
        state.attempts = 0; // 試行回数はリセット

        rateLimitCache.set(ip, state);

        await logAudit(null, AuditAction.LOGIN, { email, status: 'failed', reason: 'lockout', duration: durationMinutes });
        return NextResponse.json(
          { error: `ログイン試行回数が多すぎます。${durationMinutes}分間ロックアウトされました。` },
          { status: 429 }
        );
      } else {
        // まだロックアウトではない
        rateLimitCache.set(ip, state);
        await logAudit(null, AuditAction.LOGIN, { email, status: 'failed', attempts: state.attempts });
        return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
      }
    }

    // ログイン成功
    // レート制限を完全リセット
    rateLimitCache.delete(ip);

    await logAudit(user.id, AuditAction.LOGIN, { status: 'success' });

    // 専用関数を呼び出してセッションを取得します
    // Session is updated with isAdmin flag
    const session = await getAppSession();

    session.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: (user as any).isAdmin, // Cast to any to avoid IDE cache issues
      tokenVersion: user.tokenVersion || 0, // セッションにバージョンを保存
    };
    await session.save();

    return NextResponse.json({ message: 'ログイン成功' });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
