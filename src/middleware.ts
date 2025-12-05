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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log(`[Middleware] Path: ${pathname}`);

  const cookieName = process.env.COOKIE_NAME!;
  const sessionCookie = req.cookies.get(cookieName);
  
  // 2. 保護対象のルートか判定
  const isProtectedRoute = routeConfig.protectedRoutes.some(path =>
    new RegExp(`^${path.replace(/:\w+\*/, '.*')}$`).test(pathname)
  );

  // --- Security Headers ---
  const nonce = crypto.randomUUID();

  // CSPの設定（修正箇所）
  // 開発・本番問わず、まずは画面を表示させるために 'unsafe-inline' を許可します
  const scriptSrc = `'self' 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}' blob: https://static.cloudflareinsights.com;`;

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://lh3.googleusercontent.com;
    font-src 'self';
    connect-src 'self' https://raw.githubusercontent.com blob: data: https://static.cloudflareinsights.com;
    worker-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval';
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    frame-src 'self' https://www.youtube.com; 
  `.replace(/\s{2,}/g, ' ').trim();
  // ↑ frame-src に youtube.com を追加しました

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
    if (!sessionCookie) {
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