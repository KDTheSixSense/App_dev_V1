//middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const { user } = session;

  const { pathname } = req.nextUrl;

  // Prevent API routes from being processed by this middleware
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // ユーザーが存在し、かつ認証ページにアクセスしようとした場合
  if (user && pathname.startsWith('/auth')) {
    const homeUrl = new URL('/home', req.url);
    return NextResponse.redirect(homeUrl);
  }

  // ユーザーが存在しない、かつ保護されたルートにアクセスしようとした場合
  if (!user && !pathname.startsWith('/auth')) {
    const loginUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ユーザーがセッションに存在する場合、DBにも実在するかAPI経由で確認
  if (user?.id) {
    const validateUrl = new URL('/api/validate-user', req.url);
    const response = await fetch(validateUrl, {
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('error', 'session_expired');
      // Here we don't destroy the session, the API route does it.
      // We just redirect.
      const redirectResponse = NextResponse.redirect(loginUrl);
      // Clear the session cookie by setting an expired cookie
      redirectResponse.cookies.set(sessionOptions.cookieName, '', { maxAge: -1 });
      return redirectResponse;
    }
  }

  return res;
}

export const config = {
  // 保護したいルートと、ログイン/登録ページなどを matcher に含める
  matcher: [
    '/home/:path*',
    '/profile/:path*',
    '/group/:path*',
    '/event/:path*',
    '/issue_list/:path*',
    '/create_questions/:path*',
    '/CreateProgrammingQuestion/:path*',
    '/unsubmitted-assignments/:path*',
    '/auth/:path*', // 認証ページを追加
  ],
};