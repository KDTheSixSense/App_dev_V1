import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

// --- Configuration ---

// 保護対象のパス（前方一致で判定）
const protectedPathPrefixes = [
    '/home',
    '/issue_list',
    '/profile',
    '/create_questions',
    '/CreateProgrammingQuestion',
    '/categories',
    '/customize_trace',
    '/event',
    '/group',
    '/submit',
    '/unsubmitted-assignments',
    '/simulator',
];

// 管理者専用パス
const adminPathPrefixes = [
    '/admin-audit',
];

// 完全に公開するパス (Auth checkをスキップ)
const publicPaths = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/mail',
    '/auth/password-reset',
    '/auth/google',
    '/api/auth', // API Auth routes must be public
    '/help',
    '/images',     // Static images
    '/favicon.ico',
];

// --- Rate Limiting (In-Memory for Edge) ---
// Note: In serverless/edge, this map is per-instance, not global.
interface RateLimitState {
    count: number;
    startTime: number;
    blockedUntil: number;
    violationCount: number;
}

const ipMap = new Map<string, RateLimitState>();
const WINDOW_MS = 10 * 1000; // 10 seconds
const LIMIT = 50; // Increased limit slightly for standard usage (5 requests/sec average)
const CLEANUP_INTERVAL = 100;
let requestCounter = 0;

function getBlockDuration(violationCount: number): number {
    if (violationCount <= 1) return 60 * 1000; // 1 min
    if (violationCount === 2) return 5 * 60 * 1000; // 5 min
    return 20 * 60 * 1000; // 20 min max
}

function cleanupIpMap() {
    const now = Date.now();
    for (const [ip, state] of ipMap.entries()) {
        if (state.blockedUntil > now) continue;
        if (now - state.startTime > WINDOW_MS && state.blockedUntil === 0) {
            ipMap.delete(ip);
        }
    }
}

// --- Middleware ---

export async function middleware(req: NextRequest) {
    const response = NextResponse.next();
    const { pathname } = req.nextUrl;

    // 1. Global Rate Limiting
    const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();

    requestCounter++;
    if (requestCounter % CLEANUP_INTERVAL === 0) cleanupIpMap();

    let state = ipMap.get(ip);
    if (!state) {
        state = { count: 0, startTime: now, blockedUntil: 0, violationCount: 0 };
        ipMap.set(ip, state);
    }

    if (state.blockedUntil > now) {
        return new NextResponse(
            JSON.stringify({ error: 'Too Many Requests. You are blocked.' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (now - state.startTime > WINDOW_MS) {
        // Reset window
        state.count = 1;
        state.startTime = now;
    } else {
        state.count++;
    }

    if (state.count > LIMIT) {
        state.violationCount++;
        state.blockedUntil = now + getBlockDuration(state.violationCount);
        console.warn(`[Middleware] IP ${ip} blocked for ${state.blockedUntil - now}ms`);
        return new NextResponse(
            JSON.stringify({ error: 'Too Many Requests' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
    }


    // 2. Authentication & Authorization
    // 以下のパスはチェックをスキップ
    const isPublic = publicPaths.some(p => pathname.startsWith(p));
    const isProtected = protectedPathPrefixes.some(p => pathname.startsWith(p));
    const isAdminPath = adminPathPrefixes.some(p => pathname.startsWith(p));

    // セッション取得 (iron-session)
    // getIronSession は response オブジェクトを変更する可能性があるため、
    // 認証チェックが必要な場合のみ呼び出すか、常に呼び出して response に反映させる。
    // ここでは常に安全のために Session を確認するが、Public Route では強制しない。

    const session = await getIronSession(req, response, sessionOptions);

    if (isProtected || isAdminPath) {
        if (!session.user) {
            // APIリクエストの場合はJSONでエラー、ページの場合はリダイレクト
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            } else {
                const url = req.nextUrl.clone();
                url.pathname = '/auth/login';
                url.searchParams.set('returnTo', pathname); // Optional: redirect back after login
                return NextResponse.redirect(url);
            }
        }

        if (isAdminPath && !session.user.isAdmin) {
            // 管理者権限がない場合
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            } else {
                return NextResponse.redirect(new URL('/home', req.url));
            }
        }
    }

    // 3. Security Headers
    // CSP Nonce (crypto is available in Edge Runtime)
    const nonce = crypto.randomUUID();

    // CSP Header Construction
    const isDev = process.env.NODE_ENV !== 'production';
    // Allow 'unsafe-eval' in dev for hot reloading
    const scriptSrc = isDev
        ? "'self' 'unsafe-eval' 'unsafe-inline' blob:"
        : `'self' 'nonce-${nonce}' blob:`;

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
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('x-nonce', nonce); // For use in layout
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN'); // changed from DENY to SAMEORIGIN for internal iframes if needed
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // CORS for API
    if (pathname.startsWith('/api')) {
        response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    return response;
}

export const config = {
    // Apply to all routes except Next.js internals and static assets
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|gif|svg|jpg|jpeg|png|webp|ico)$).*)',
    ],
};
