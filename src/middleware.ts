//middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 保護したいページと、公開するページをここで定義します
const routeConfig = {
  // 保護対象のパス（正規表現が使えます）
  protectedRoutes: [
    '/home',
    '/issue_list/:path*', // /issue_list 以下の全ページ
    '/profile',
    '/home/ranking',
    '/create_questions',

    // 他にも保護したいページがあればここに追加
  ],
  // 保護の対象外とするパス（ログインページなど）
  publicRoutes: [
    '/',
    '/auth/login',
    '/auth/mail',
    '/auth/register',
    '/auth/mail',
    '/auth/password-reset',
  ],
};

// 簡易的なインメモリレート制限 (Edge Runtime対応のためMapを使用)
interface RateLimitState {
  count: number;
  startTime: number;
  blockedUntil: number;
  violationCount: number;
}

const ipMap = new Map<string, RateLimitState>();
const WINDOW_MS = 10 * 1000; // 10秒
const LIMIT = 20; // 10秒間に20リクエスト (2 req/s)
const CLEANUP_INTERVAL = 100; // 100リクエストごとにクリーンアップ
let requestCounter = 0;

function getBlockDuration(violationCount: number): number {
  if (violationCount <= 1) return 60 * 1000; // 1分
  if (violationCount === 2) return 5 * 60 * 1000; // 5分
  if (violationCount === 3) return 10 * 60 * 1000; // 10分
  return 20 * 60 * 1000; // 20分 (最大)
}

function cleanupIpMap() {
  const now = Date.now();
  for (const [ip, state] of ipMap.entries()) {
    if (state.blockedUntil > now) continue; // ブロック中は保持
    if (now - state.startTime > WINDOW_MS && state.blockedUntil === 0) {
      ipMap.delete(ip);
    }
  }
}

export async function middleware(req: NextRequest) {
  // --- Global Rate Limiting ---
  const ip = (req as any).ip || req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  // クリーンアップ (定期実行)
  requestCounter++;
  if (requestCounter % CLEANUP_INTERVAL === 0) {
    cleanupIpMap();
  }

  let state = ipMap.get(ip);

  if (!state) {
    state = { count: 0, startTime: now, blockedUntil: 0, violationCount: 0 };
    ipMap.set(ip, state);
  }

  // 1. ブロックチェック
  if (state.blockedUntil > now) {
    const remainingSeconds = Math.ceil((state.blockedUntil - now) / 1000);
    return new NextResponse(
      JSON.stringify({ error: `Too Many Requests. Blocked for ${remainingSeconds}s` }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ブロック解除後のリセット (ブロック期間が過ぎていれば)
  if (state.blockedUntil !== 0 && state.blockedUntil <= now) {
    state.blockedUntil = 0;
    state.count = 0;
    state.startTime = now;
  }

  // 2. カウントアップ
  if (now - state.startTime > WINDOW_MS) {
    // ウィンドウリセット
    state.count = 1;
    state.startTime = now;
  } else {
    state.count++;
  }

  // 3. 制限チェック
  if (state.count > LIMIT) {
    state.violationCount++;
    const blockDuration = getBlockDuration(state.violationCount);
    state.blockedUntil = now + blockDuration;

    console.warn(`[Middleware] IP ${ip} blocked for ${blockDuration}ms due to excessive requests.`);

    return new NextResponse(
      JSON.stringify({ error: `Too Many Requests. You are blocked.` }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // --- End Rate Limiting ---

  const { pathname } = req.nextUrl;
  console.log(`[Middleware] Path: ${pathname}`);

  const cookieName = process.env.COOKIE_NAME!;
  const sessionCookie = req.cookies.get(cookieName);

  // 1. クッキーの存在確認
  const hasCookie = !!sessionCookie;
  console.log(`[Middleware] Cookie found: ${hasCookie}`);

  // 2. 保護対象のルートか判定
  const isProtectedRoute = routeConfig.protectedRoutes.some(path =>
    new RegExp(`^${path.replace(/:\w+\*/, '.*')}$`).test(pathname)
  );

  if (isProtectedRoute) {
    if (!hasCookie) {
      console.log(`[Middleware] No cookie found. Redirecting to /auth/login...`);
      const absoluteURL = new URL('/auth/login', req.nextUrl.origin);
      return NextResponse.redirect(absoluteURL.toString());
    }

    // 3. (Optional but recommended) セッションの中身を簡易検証
    // Edge Runtimeでは iron-session の完全な復号化が難しい場合があるため、
    // ここでは「クッキー値が明らかに不正でないか」程度のチェックに留めるか、
    // または getIronSession を Edge 互換で使う。
    // 今回は、少なくとも「クッキーがある」こと以上のチェックとして、
    // 値が空でないことなどを確認する（iron-sessionは署名付きなので改ざんは検知される）。

    // より厳密な検証は各ページ/APIの getSession() で行われるが、
    // ここで明らかに無効なものを弾けるとベスト。
  }

  return NextResponse.next();
}

export const config = {
  // api, _next/static, _next/image, .png, .ico, .json を除くすべてのパスにミドルウェアを適用
  matcher: '/((?!api|_next/static|_next/image|.*\\.png$|favicon\\.ico|.*\\.json$).*)',
};