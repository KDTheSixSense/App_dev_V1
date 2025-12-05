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

//  // 1. ブロックチェック
//  if (state.blockedUntil > now) {
//    const remainingSeconds = Math.ceil((state.blockedUntil - now) / 1000);
//    return new NextResponse(
//      JSON.stringify({ error: `Too Many Requests. Blocked for ${remainingSeconds}s` }),
//      { status: 429, headers: { 'Content-Type': 'application/json' } }
//    );
//  }
//
//  // ブロック解除後のリセット (ブロック期間が過ぎていれば)
//  if (state.blockedUntil !== 0 && state.blockedUntil <= now) {
//    state.blockedUntil = 0;
//    state.count = 0;
//    state.startTime = now;
//  }
//
//  // 2. カウントアップ
//  if (now - state.startTime > WINDOW_MS) {
//    // ウィンドウリセット
//    state.count = 1;
//    state.startTime = now;
//  } else {
//    state.count++;
//  }

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

  // --- Security Headers ---
  // Use crypto.randomUUID() directly (works in Edge Runtime and Node.js 19+)
  const nonce = crypto.randomUUID();

  // CSPの設定
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev
    ? `'self' 'unsafe-eval' 'unsafe-inline' blob:`
    : `'self' 'nonce-${nonce}' blob:`; // unsafe-inline removed in prod

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://lh3.googleusercontent.com;
    font-src 'self';
    connect-src 'self' https://raw.githubusercontent.com blob: data:;
    worker-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval';
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  // リクエストヘッダーにnonceを設定
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // レスポンスの初期化
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isProtectedRoute) {
    if (!hasCookie) {
      console.log(`[Middleware] No cookie found. Redirecting to /auth/login...`);
      const absoluteURL = new URL('/auth/login', req.nextUrl.origin);
      response = NextResponse.redirect(absoluteURL.toString());
    }
  }

  // レスポンスヘッダーにセキュリティ設定を追加
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // --- CORS Headers for API Routes ---
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Prevent caching for security
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');

  return response;
}

export const config = {
  // api, _next/static, _next/image, .png, .ico, .json を除くすべてのパスにミドルウェアを適用
  matcher: '/((?!_next/static|_next/image|.*\\.png$|favicon\\.ico|.*\\.json$).*)',
};