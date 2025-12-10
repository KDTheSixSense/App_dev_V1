import { NextRequest, NextResponse } from 'next/server';
import { detectThreatType, checkObjectForThreats } from './waf-rules';

export { detectThreatType, checkObjectForThreats }; // Re-export


export function createBlockResponse(reason: string): NextResponse {
    return new NextResponse(
        JSON.stringify({
            error: 'Security Alert: Malicious request detected.',
            reason: reason,
            code: 'WAF_BLOCK'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
}

export async function detectSecurityThreats(req: NextRequest): Promise<NextResponse | null> {
    const url = req.nextUrl;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // 1. Check Search Params (Query String)
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

// Helper for Page Components
export function validateSearchParams(searchParams: { [key: string]: string | string[] | undefined } | null) {
    if (searchParams) {
        for (const [key, value] of Object.entries(searchParams)) {
            let threat = detectThreatType(key);
            if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);

            if (typeof value === 'string') {
                threat = detectThreatType(value);
                if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);
            } else if (Array.isArray(value)) {
                for (const item of value) {
                    threat = detectThreatType(item);
                    if (threat) throw new Error(`Security Alert: Malicious query parameter detected (${threat}).`);
                }
            }
        }
    }
}
