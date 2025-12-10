import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { submitAssignment } from '@/lib/actions/assignmentActions';
// Duplicate from lib/waf.ts due to build system export resolution issues
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

function containsSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_REGEX.test(input);
}

interface CustomSession {
  user?: { id?: string; email: string };
}

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
    if (containsSqlInjection(assignmentId)) {
      return NextResponse.json({ message: 'Security Alert: Malicious content detected.' }, { status: 400 });
    }

    const file = formData.get('file') as File | null;
    if (file && containsSqlInjection(file.name)) {
      return NextResponse.json({ message: 'Security Alert: Malicious filename detected.' }, { status: 400 });
    }

    const result = await submitAssignment(userId, assignmentId, formData);

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
