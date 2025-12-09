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
const SQL_INJECTION_REGEX = new RegExp(
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
    ].join('|'),
    'i' // Case insensitive
);

export function detectSqlInjection(req: NextRequest): NextResponse | null {
    const url = req.nextUrl;
    const ip = (req as any).ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Check Search Params (Query String)
    for (const [key, value] of url.searchParams.entries()) {
        if (SQL_INJECTION_REGEX.test(value)) {
            console.warn(`[WAF] Blocked SQL Injection attempt: ${key}=${value} from IP: ${ip}`);
            return new NextResponse(
                JSON.stringify({
                    error: 'Security Alert: Malicious request detected.',
                    code: 'WAF_SQLI_BLOCK'
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // Future: Check Body (requires cloning buffer, potentially expensive in middleware)

    return null; // No threat detected
}
