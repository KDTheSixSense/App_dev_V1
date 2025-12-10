import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession, IronSessionData } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { detectSqlInjection } from '@/lib/waf';
import { generateCsp } from '@/lib/csp';

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

// deviceId または ip をキーにするため string 型で汎用的に扱う
const limitMap = new Map<string, RateLimitState>();
const WINDOW_MS = 10 * 1000; // 10 seconds
const LIMIT = 50; // Increased limit slightly for standard usage (5 requests/sec average)
const CLEANUP_INTERVAL = 100;
const DEVICE_ID_COOKIE_NAME = 'd_id'; // Device ID Cookie Name
let requestCounter = 0;

function getBlockDuration(violationCount: number): number {
    // 違反回数の2乗分（分）待機: 1回目=1分, 2回目=4分, 3回目=9分...
    const minutes = Math.pow(violationCount, 2);
    // 最大24時間に制限
    const maxMinutes = 24 * 60;
    return Math.min(minutes, maxMinutes) * 60 * 1000;
}

function cleanupLimitMap() {
    const now = Date.now();
    for (const [key, state] of limitMap.entries()) {
        if (state.blockedUntil > now) continue;
        if (now - state.startTime > WINDOW_MS && state.blockedUntil === 0) {
            limitMap.delete(key);
        }
    }
}

// Helper to set cookie if needed
function applyDeviceIdCookie(res: NextResponse, deviceId: string) {
    res.cookies.set(DEVICE_ID_COOKIE_NAME, deviceId, {
        path: '/',
        httpOnly: true, // JavaScriptからアクセス不可（セキュリティ向上）
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return res;
}

// --- Middleware ---

// --- Middleware ---

export async function middleware(req: NextRequest) {
    // Debug: Ensure middleware is running
    // console.log(`[Middleware] Processing ${req.method} ${req.nextUrl.pathname}`);

    // 0. Security: WAF (SQL Injection)
    // Run this FIRST to block malicious requests before any processing
    const wafResponse = await detectSqlInjection(req);
    if (wafResponse) {
        return wafResponse;
    }

    let response = NextResponse.next();
    const { pathname } = req.nextUrl;

    // 1. Global Rate Limiting
    const ip = ((req as any).ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown') as string;

    // Device ID Check
    let deviceId = req.cookies.get(DEVICE_ID_COOKIE_NAME)?.value;
    let limitKey = deviceId;
    let shouldSetCookie = false;

    if (!deviceId) {
        // Cookieがない場合はIPをキーにするが、次回用にIDを発行する
        limitKey = ip;
        deviceId = crypto.randomUUID();
        shouldSetCookie = true;
    }

    const now = Date.now();

    requestCounter++;
    if (requestCounter % CLEANUP_INTERVAL === 0) cleanupLimitMap();

    // limitKey (IP or DeviceID) で状態管理
    let state = limitMap.get(limitKey!); // limitKey is always string
    if (!state) {
        state = { count: 0, startTime: now, blockedUntil: 0, violationCount: 0 };
        limitMap.set(limitKey!, state);
    }

    if (state.blockedUntil > now) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Middleware] Rate limit exceeded but skipped in dev mode for ${limitKey}`);
            return NextResponse.next();
        }

        const remainingSeconds = Math.ceil((state.blockedUntil - now) / 1000);
        const res = new NextResponse(
            JSON.stringify({ error: `沢山のアクセスを検知しました。 あなたのアカウントをブロックしました。解除まで約${remainingSeconds}秒。` }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
        if (shouldSetCookie) applyDeviceIdCookie(res, deviceId!);
        return res;
    }

    if (now - state.startTime > WINDOW_MS) {
        // Reset window
        state.count = 1;
        state.startTime = now;
    } else {
        state.count++;
    }

    if (state.count > LIMIT) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Middleware] Rate limit count exceeded but skipped in dev mode for ${limitKey}`);
        } else {
            state.violationCount++;
            state.blockedUntil = now + getBlockDuration(state.violationCount);
            console.warn(`[Middleware] Key ${limitKey} blocked for ${state.blockedUntil - now}ms`);
            const remainingSeconds = Math.ceil((state.blockedUntil - now) / 1000);
            const res = new NextResponse(
                JSON.stringify({ error: `沢山のアクセスを検知しました。 あなたのアカウントをブロックしました。解除まで約${remainingSeconds}秒。` }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
            if (shouldSetCookie) applyDeviceIdCookie(res, deviceId!);
            return res;
        }
    }

    if (shouldSetCookie) {
        applyDeviceIdCookie(response, deviceId!);
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

    const session = await getIronSession<IronSessionData>(req, response, sessionOptions);

    if (isProtected || isAdminPath) {
        if (!session.user) {
            // APIリクエストの場合はJSONでエラー、ページの場合はリダイレクト
            if (pathname.startsWith('/api')) {
                const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                if (shouldSetCookie) applyDeviceIdCookie(res, deviceId!);
                return res;
            } else {
                const url = req.nextUrl.clone();
                url.pathname = '/auth/login';
                url.searchParams.set('returnTo', pathname); // Optional: redirect back after login
                const res = NextResponse.redirect(url);
                if (shouldSetCookie) applyDeviceIdCookie(res, deviceId!);
                return res;
            }
        }

        if (isAdminPath && !session.user.isAdmin) {
            // 管理者権限がない場合
            if (pathname.startsWith('/api')) {
                const res = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                if (shouldSetCookie) applyDeviceIdCookie(res, deviceId!);
                return res;
            } else {
                const res = NextResponse.redirect(new URL('/home', req.url));
                if (shouldSetCookie) applyDeviceIdCookie(res, deviceId!);
                return res;
            }
        }
    }

    // 3. Security Headers
    // CSP Nonce (crypto is available in Edge Runtime)
    const nonce = crypto.randomUUID();

    // CSP Header Construction
    const isDev = process.env.NODE_ENV !== 'production';
    const cspHeader = generateCsp({ nonce, isDev, pathname });

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

    // 0. Security: SQL Injection & Path Traversal Prevention in Query Params
    const url = req.nextUrl;
    // Common SQL Injection Patterns:
    // - "--" (Comment)
    // - "; " (Statement separator)
    // - "' AND" or '" AND' (Boolean injection)
    // - "' OR" or '" OR'
    // - "UNION SELECT"

    response.headers.set('X-Debug-WAF', 'Active');

    return response;
}

export const config = {
    // Apply to all routes except Next.js internals and static assets
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|gif|svg|jpg|jpeg|png|webp|ico)$).*)',
    ],
};
