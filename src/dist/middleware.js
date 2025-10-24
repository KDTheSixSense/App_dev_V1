"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const server_1 = require("next/server");
// 保護・公開ルートの設定
const protectedRoutes = [
    '/home',
    '/issue_list/:path*', // /issue_list 以下の全ページ
    '/profile',
    '/home/ranking',
    '/create_questions',
];
function middleware(req) {
    const { pathname } = req.nextUrl;
    console.log(`[Middleware] Path: ${pathname}`);
    const cookieName = process.env.COOKIE_NAME;
    if (!cookieName) {
        console.error('[Middleware] COOKIE_NAME is not set in environment variables!');
        return server_1.NextResponse.next();
    }
    const sessionCookie = req.cookies.get(cookieName);
    console.log(`[Middleware] Cookie named "${cookieName}" found: ${!!sessionCookie}`);
    const isProtectedRoute = protectedRoutes.some(path => new RegExp(`^${path.replace(/:\w+\*/, '.*')}$`).test(pathname));
    if (isProtectedRoute && !sessionCookie) {
        console.log(`[Middleware] Protected route accessed without session. Redirecting to /auth/login...`);
        const loginUrl = new URL('/auth/login', req.nextUrl.origin);
        return server_1.NextResponse.redirect(loginUrl.toString());
    }
    return server_1.NextResponse.next();
}
exports.config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
