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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log(`[Middleware] Path: ${pathname}`); // ① どのパスで実行されたか確認

  const cookieName = process.env.COOKIE_NAME!;
  const sessionCookie = req.cookies.get(cookieName);
  console.log(`[Middleware] Cookie found: ${!!sessionCookie}`); // ② クッキーを見つけられたか確認

const isProtectedRoute = routeConfig.protectedRoutes.some(path => 
  new RegExp(`^${path.replace(/:\w+\*/, '.*')}$`).test(pathname)
);  
  if (isProtectedRoute && !sessionCookie) {
    console.log(`[Middleware] Redirecting to /auth/login...`); // ③ リダイレクトが実行されたか確認
    const absoluteURL = new URL('/auth/login', req.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }

  return NextResponse.next();
}

export const config = {
  // api, _next/static, _next/image, .png, .ico, .json を除くすべてのパスにミドルウェアを適用
  matcher: '/((?!api|_next/static|_next/image|.*\\.png$|favicon\\.ico|.*\\.json$).*)',
};