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
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b.*\bFROM\b)/.source, // Broad SQL keywords
        /(\b(EXEC|EXECUTE)\s*\(+)/.source,          // Execution of raw commands
        /(;\s*)/.source,                            // Statement separator (cautious with this one)
        /('\s*\))/.source,                          // Common closing parenthesis for string injections
    ].join('|'),
    'i' // Case insensitive
);

const input = "password123 OR 1=1 --";
const match = SQL_INJECTION_REGEX.test(input);
console.log(`Input: "${input}"`);
console.log(`Match: ${match}`);

if (match) {
    console.log("Regex matches!");
} else {
    console.log("Regex FAILED to match.");
}
