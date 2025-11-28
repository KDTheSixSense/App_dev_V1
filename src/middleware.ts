//middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from './lib/prisma'; // Prisma Clientをインポート

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const { user } = session;

  const { pathname } = req.nextUrl;

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

  // ユーザーがセッションに存在する場合、DBにも実在するか確認
  if (user?.id) {
    const userId = Number(user.id);
    if (!isNaN(userId)) {
      const userFromDb = await prisma.user.findUnique({
        where: { id: userId },
      });

      // DBにユーザーが存在しない場合（アカウント削除後など）
      if (!userFromDb) {
        session.destroy(); // セッションを破棄
        const loginUrl = new URL('/auth/login', req.url);
        loginUrl.searchParams.set('error', 'session_expired'); // エラーメッセージを追加
        return NextResponse.redirect(loginUrl);
      }
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