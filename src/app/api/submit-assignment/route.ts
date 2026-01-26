import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { submitAssignment } from '@/lib/actions/assignmentActions';
// Duplicate from lib/waf.ts due to build system export resolution issues
// Comprehensive SQL Injection Patterns
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
    /(;\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|SHUTDOWN|DECLARE))\b/.source, // Stacked queries (strict)
    /('\s*\))/.source,                          // Common closing parenthesis for string injections
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

function containsSecurityThreats(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_REGEX.test(input) || TRAVERSAL_REGEX.test(input) || XSS_REGEX.test(input);
}

interface CustomSession {
  user?: { id?: string; email: string };
}

/**
 * 課題ファイル提出API
 * 
 * ファイル形式での課題提出を受け付けます。
 * セキュリティチェック（WAF）を行い、ファイルを処理します。
 */
export async function POST(request: NextRequest) {
  const session = await getIronSession<CustomSession>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const assignmentId = request.nextUrl.searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ message: 'assignmentId is required' }, { status: 400 });
    }

    const formData = await request.formData();

    // Security Check: WAF
    if (containsSecurityThreats(assignmentId)) {
      return NextResponse.json({ message: 'Security Alert: Malicious content detected.' }, { status: 400 });
    }

    const file = formData.get('file') as File | null;
    if (file && containsSecurityThreats(file.name)) {
      return NextResponse.json({ message: 'Security Alert: Malicious filename detected.' }, { status: 400 });
    }

    const language = formData.get('language') as string | undefined;
    const result = await submitAssignment(userId, assignmentId, formData, language);

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
  } catch (error) {
    console.error('課題提出APIエラー:', error);
    // This top-level catch is for unexpected errors during session handling or form parsing.
    return NextResponse.json({ message: 'リクエスト処理中に予期せぬエラーが発生しました。' }, { status: 500 });
  }
}
