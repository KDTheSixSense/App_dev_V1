
// Comprehensive SQL Injection Patterns
export const SQL_INJECTION_REGEX = new RegExp(
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
export const TRAVERSAL_REGEX = new RegExp(
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
export const XSS_REGEX = new RegExp(
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

export function detectThreatType(input: string): string | null {
    if (!input || typeof input !== 'string') return null;

    // Normalize input to NFKC form to handle Unicode equivalence (e.g., Fullwidth characters, Kelvin sign)
    // This prevents WAF bypasses using alternative Unicode representations.
    const normalizedInput = input.normalize('NFKC');

    if (SQL_INJECTION_REGEX.test(normalizedInput)) return 'SQL Injection';
    if (TRAVERSAL_REGEX.test(normalizedInput)) return 'Path Traversal';
    if (XSS_REGEX.test(normalizedInput)) return 'XSS';

    return null;
}

export function checkObjectForThreats(obj: any): string | null {
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
