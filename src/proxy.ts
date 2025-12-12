import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession, IronSessionData } from 'iron-session';
import { sessionOptions } from '@/lib/session-config';

import { generateCsp } from '@/lib/csp';
import { SECURITY_HEADERS } from '@/lib/security-headers';
// Note: This logic is inlined here to ensure compatibility with the Next.js Edge Runtime which has strict
// limitations on imports. Externalizing this to a library file caused 500 errors in this specific environment.

// Comprehensive SQL Injection Patterns
const SQL_INJECTION_REGEX = new RegExp(
    [
        /(--)/.source,                              // Standard SQL comment
        /(\/\*)/.source,                            // Inline comment start
        /(#\s)/.source,                             // MySQL comment
        /(\bUNION\s+SELECT\b)/.source,              // Union Select
        /(\b(AND|OR)\s+[\w'"]+\s*[=<>!])/.source,   // Boolean Blind (e.g., " AND 1=1")
        /(\b(AND|OR)\s+\d+\s*=\s*\d+)/.source,      // Boolean Blind Numeric (e.g., " AND 1=1")
        /(pg_sleep)/.source,                        // PostgreSQL Time-based
        /(WAITFOR\s+DELAY)/.source,                 // SQL Server Time-based
        /(SLEEP\()/.source,                         // MySQL Time-based
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b.*\bFROM\b)/.source, // Broad SQL keywords
        /(\b(EXEC|EXECUTE)\s*\(+)/.source,          // Execution of raw commands
        /(;\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|SHUTDOWN|DECLARE))\b/.source, // Stacked queries (strict)
        /('\s*\))/.source,                          // Common closing parenthesis for string injections
        /(DBMS_PIPE)/.source,                       // Oracle specific
    ].join('|'),
    'i' // Case insensitive
);

// Path Traversal Patterns
const TRAVERSAL_REGEX = new RegExp(
    [
        /(\.\.\/)/.source,           // ../
        /(\.\.%2f)/.source,          // ..%2f (URL encoded)
        /(\.\.\\)/.source,           // ..\ (Windows)
        /(\.\.%5c)/.source,          // ..%5c (URL encoded Windows)
        /(\/etc\/passwd)/.source,    // Common target
        /(\/windows\/system\.ini)/.source, // Common Windows target
    ].join('|'),
    'i'
);

// XSS Patterns (Basic)
const XSS_REGEX = new RegExp(
    [
        /(<script)/.source,
        /(javascript:)/.source,
        /(onerror=)/.source,
        /(onload=)/.source,
        /(onclick=)/.source,
        /(alert\()/.source,
    ].join('|'),
    'i'
);

function detectThreatType(input: string): string | null {
    if (!input || typeof input !== 'string') return null;

    if (SQL_INJECTION_REGEX.test(input)) return 'SQL Injection';
    if (TRAVERSAL_REGEX.test(input)) return 'Path Traversal';
    if (XSS_REGEX.test(input)) return 'XSS';

    return null;
}

function createBlockResponse(reason: string): NextResponse {
    return new NextResponse(
        JSON.stringify({
            error: 'Security Alert: Malicious request detected.',
            reason: reason,
            code: 'WAF_BLOCK'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
}

function checkObjectForThreats(obj: any): string | null {
    if (typeof obj === 'string') {
        return detectThreatType(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
        for (const key of Object.keys(obj)) {
            const keyThreat = detectThreatType(key);
            if (keyThreat) return keyThreat;

            // Recursive check
            const valueThreat = checkObjectForThreats(obj[key]);
            if (valueThreat) return valueThreat;
        }
    }
    return null;
}

async function detectSecurityThreats(req: NextRequest): Promise<NextResponse | null> {
    const url = req.nextUrl;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // 0. Check Raw Query String (for payloads hidden from searchParams, e.g. _rsc)
    const rawSearch = url.search; // Includes ? and all params
    if (rawSearch) {
        // Check raw (for signatures like ..%2f)
        let threat = detectThreatType(rawSearch);
        if (threat) {
            console.warn(`[WAF] Blocked ${threat} attempt in Raw Query (Raw): ${rawSearch} from IP: ${ip}`);
            return createBlockResponse(threat);
        }

        // Check decoded (for signatures like <script>)
        try {
            const decodedSearch = decodeURIComponent(rawSearch);
            threat = detectThreatType(decodedSearch);
            if (threat) {
                console.warn(`[WAF] Blocked ${threat} attempt in Raw Query (Decoded): ${decodedSearch} from IP: ${ip}`);
                return createBlockResponse(threat);
            }
        } catch (e) {
            // Decoding failed, ignore or block? Safest to ignore and rely on raw check or loose decoding.
        }
    }

    // 1. Check Search Params (Query String) - Keep for granular reporting/parsing
    for (const [key, value] of url.searchParams.entries()) {
        const threat = detectThreatType(value) || detectThreatType(key);
        if (threat) {
            console.warn(`[WAF] Blocked ${threat} attempt in Query: ${key}=${value} from IP: ${ip}`);
            return createBlockResponse(threat);
        }
    }

    // 2. Check Headers (Specific headers)
    const headersToCheck = ['referer', 'user-agent'];
    for (const headerName of headersToCheck) {
        const headerValue = req.headers.get(headerName);
        if (headerValue) {
            const threat = detectThreatType(headerValue);
            if (threat) {
                console.warn(`[WAF] Blocked ${threat} attempt in Header: ${headerName}=${headerValue} from IP: ${ip}`);
                return createBlockResponse(threat);
            }
        }
    }

    // 3. Check Cookies
    for (const cookie of req.cookies.getAll()) {
        // Skip session cookie checking as it contains encrypted data that may trigger false positives
        if (cookie.name === sessionOptions.cookieName) continue;

        const threat = detectThreatType(cookie.value) || detectThreatType(cookie.name);
        if (threat) {
            console.warn(`[WAF] Blocked ${threat} attempt in Cookie: ${cookie.name}=${cookie.value} from IP: ${ip}`);
            return createBlockResponse(threat);
        }
    }

    // 4. Check Request Body (JSON only)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        const contentType = req.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                // Clone the request to read body without consuming it for the actual handler
                const bodyText = await req.clone().text();
                const body = JSON.parse(bodyText);

                const threat = checkObjectForThreats(body);
                if (threat) {
                    console.warn(`[WAF] Blocked ${threat} attempt in Body from IP: ${ip}`);
                    return createBlockResponse(threat);
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        }
    }

    return null; // No threat detected
}

// End of Inlined WAF Logic

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
const LIMIT = 1000; // Adjusted for shared IP environment (approx 400 students)
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

export async function proxy(req: NextRequest) {
    // 0. Security: WAF (SQL Injection)
    // Run this FIRST to block malicious requests before any processing
    const wafResponse = await detectSecurityThreats(req);
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
            // console.log(`[Middleware] Rate limit exceeded but skipped in dev mode for ${limitKey}`);
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
            // console.log(`[Middleware] Rate limit count exceeded but skipped in dev mode for ${limitKey}`);
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
                url.searchParams.set('returnTo', pathname);
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

    // Apply Standard Security Headers
    response.headers.set('X-DNS-Prefetch-Control', SECURITY_HEADERS.dnsPrefetchControl);
    response.headers.set('Strict-Transport-Security', SECURITY_HEADERS.strictTransportSecurity);
    response.headers.set('X-XSS-Protection', SECURITY_HEADERS.xXssProtection);
    response.headers.set('X-Frame-Options', SECURITY_HEADERS.xFrameOptions);
    response.headers.set('X-Content-Type-Options', SECURITY_HEADERS.xContentTypeOptions);
    response.headers.set('Referrer-Policy', SECURITY_HEADERS.referrerPolicy);
    response.headers.set('Permissions-Policy', SECURITY_HEADERS.permissionsPolicy);

    // CORS for API
    if (pathname.startsWith('/api')) {
        response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-control-Allow-Headers', 'Content-Type, Authorization');
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
    response.headers.set('X-WAF-Version', '2.0');

    return response;
}

export const config = {
    // Apply to all routes except Next.js internals and static assets
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|gif|svg|jpg|jpeg|png|webp|ico)$).*)',
    ],
};
