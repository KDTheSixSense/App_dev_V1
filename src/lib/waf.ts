import { NextRequest, NextResponse } from 'next/server';

/**
 * Web Application Firewall (WAF) Logic
 * 
 * Detects common SQL Injection, XSS, and other malicious patterns in the request.
 * Primarily focuses on Query Parameters as they are the most common vector for
 * automated scanners like ZAP.
 */

// Comprehensive SQL Injection Patterns
// 1. Comments: --, /*, #
// 2. Boolean Logic: AND/OR followed by comparators
// 3. Union Based: UNION SELECT
// 4. Time Based: pg_sleep, WAITFOR DELAY
// 5. System commands (broad)
export const SQL_INJECTION_REGEX = new RegExp(
    [
        /(--)/.source,                              // Standard SQL comment
        /(\/\*)/.source,                            // Inline comment start
        /(#\s)/.source,                             // MySQL comment
        /(\bUNION\s+SELECT\b)/.source,              // Union Select
        /(\b(AND|OR)\s+[\w']+\s*[=<>!])/.source,    // Boolean Blind (e.g., " AND 1=1")
        /(\b(AND|OR)\s+\d+\s*=\s*\d+)/.source,      // Boolean Blind Numeric (e.g., " AND 1=1")
        /(pg_sleep)/.source,                        // PostgreSQL Time-based
        /(WAITFOR\s+DELAY)/.source,                 // SQL Server Time-based
        /(SLEEP\()/.source,                         // MySQL Time-based
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b.*\bFROM\b)/.source, // Broad SQL keywords
        /(\b(EXEC|EXECUTE)\s*\(+)/.source,          // Execution of raw commands
        /(;\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|SHUTDOWN|DECLARE))\b/.source, // Stacked queries (strict)
        /('\s*\))/.source,                          // Common closing parenthesis for string injections
    ].join('|'),
    'i' // Case insensitive
);

/**
 * Checks if a string contains SQL Injection patterns.
 * @param input The string to check
 * @returns true if malicious pattern is found
 */
export function containsSqlInjection(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    return SQL_INJECTION_REGEX.test(input);
}


export async function detectSqlInjection(req: NextRequest): Promise<NextResponse | null> {
    const url = req.nextUrl;
    const ip = (req as any).ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // 1. Check Search Params (Query String)
    for (const [key, value] of url.searchParams.entries()) {
        if (containsSqlInjection(value) || containsSqlInjection(key)) {
            console.warn(`[WAF] Blocked SQL Injection attempt in Query: ${key}=${value} from IP: ${ip}`);
            return createBlockResponse();
        }
    }

    // 2. Check Headers (Specific headers)
    const headersToCheck = ['referer', 'user-agent'];
    for (const headerName of headersToCheck) {
        const headerValue = req.headers.get(headerName);
        if (headerValue && containsSqlInjection(headerValue)) {
            console.warn(`[WAF] Blocked SQL Injection attempt in Header: ${headerName}=${headerValue} from IP: ${ip}`);
            return createBlockResponse();
        }
    }

    // 3. Check Cookies
    for (const cookie of req.cookies.getAll()) {
        if (containsSqlInjection(cookie.value) || containsSqlInjection(cookie.name)) {
            console.warn(`[WAF] Blocked SQL Injection attempt in Cookie: ${cookie.name}=${cookie.value} from IP: ${ip}`);
            return createBlockResponse();
        }
    }

    // 4. Check Request Body (JSON only)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        const contentType = req.headers.get('content-type');
        console.log(`[WAF DEBUG] Method: ${req.method}, Content-Type: ${contentType}`);
        if (contentType && contentType.includes('application/json')) {
            try {
                // Clone the request to read body without consuming it for the actual handler
                const bodyText = await req.clone().text();
                console.log(`[WAF DEBUG] Body Text: ${bodyText}`);
                const body = JSON.parse(bodyText);

                if (checkObjectForSqlInjection(body)) {
                    console.warn(`[WAF] Blocked SQL Injection attempt in Body from IP: ${ip}`);
                    return createBlockResponse();
                }
            } catch (e) {
                console.error(`[WAF DEBUG] Body parse error:`, e);
                // Ignore JSON parse errors, or treat as suspicious if needed
            }
        }
    }

    return null; // No threat detected
}

function createBlockResponse(): NextResponse {
    return new NextResponse(
        JSON.stringify({
            error: 'Security Alert: Malicious request detected.',
            code: 'WAF_SQLI_BLOCK'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
}

function checkObjectForSqlInjection(obj: any): boolean {
    if (typeof obj === 'string') {
        return containsSqlInjection(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
        for (const key of Object.keys(obj)) {
            if (containsSqlInjection(key)) return true;
            // Recursive check
            if (checkObjectForSqlInjection(obj[key])) return true;
        }
    }
    return false;
}

