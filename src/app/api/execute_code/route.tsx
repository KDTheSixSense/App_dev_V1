import { NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import { executeCodeSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit';
import { getAppSession } from '@/lib/auth';
import { executeCode } from '@/lib/sandbox';
import { SQL_INJECTION_REGEX, TRAVERSAL_REGEX, XSS_REGEX } from '@/lib/waf';

function containsSecurityThreats(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_REGEX.test(input) || TRAVERSAL_REGEX.test(input) || XSS_REGEX.test(input);
}

// --- Rate Limiting Setup ---
const rateLimit = new LRUCache<string, number>({
  max: 500, // 最大500ユーザー
  ttl: 60 * 1000, // 1分間
});

function checkRateLimit(ip: string): boolean {
  const count = rateLimit.get(ip) || 0;
  if (count >= 5) { // 実行は重いので1分間に5回まで
    return false;
  }
  rateLimit.set(ip, count + 1);
  return true;
}

// --- Output Sanitization ---
// --- Output Sanitization (Removed unused local function) ---

// --- Basic Keyword Blocking (Defense in Depth) ---
// Note: This is NOT a complete security solution.
function containsForbiddenKeywords(code: string, language: string): boolean {
  const dangerousKeywords = [
    'child_process', 'spawn', 'exec', 'fork', // Node.js
    'import os', 'import subprocess', 'import sys', 'from os', 'from subprocess', // Python
    'system(', 'exec(', 'popen(', // C/C++
    'Runtime.getRuntime', 'ProcessBuilder', // Java
    'System.Diagnostics.Process' // C#
  ];

  return dangerousKeywords.some(keyword => code.includes(keyword));
}

export async function POST(request: Request) {
  try {
    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limiting Check
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json();
    const validationResult = executeCodeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validationResult.error }, { status: 400 });
    }

    const { language, source_code, input } = validationResult.data;

    // Security Check: WAF for Input (SQL Injection, XSS, Path Traversal)
    if (input && containsSecurityThreats(input)) {
      await logAudit(
        session.user.id,
        AuditAction.EXECUTE_CODE,
        {
          message: 'Blocked Security Threat in input',
          input_snippet: input.substring(0, 50)
        }
      );
      return NextResponse.json({
        error: 'Security Alert: Malicious input detected.',
        code: 'WAF_SQLI_BLOCK'
      }, { status: 400 });
    }

    // Security Check: Forbidden Keywords
    if (containsForbiddenKeywords(source_code, language)) {
      await logAudit(
        null,
        AuditAction.EXECUTE_CODE,
        {
          message: 'Blocked forbidden keyword usage',
          language,
          code_snippet: source_code.substring(0, 50)
        }
      );
      return NextResponse.json({
        build_result: { stdout: '', stderr: 'Security Error: Forbidden keywords detected.' },
        program_output: { stdout: '', stderr: '' },
      }, { status: 200 }); // 200 OK with error message in body
    }

    let result;

    // Sandbox Execution
    // console.log('Executing code via Sandbox Container...');



    // Use shared execution logic
    // Use shared execution logic
    result = await executeCode(language, source_code, input || '') as any;

    if (result.error && result.error.startsWith('Sandbox Error')) {
      // Network/System error
      throw new Error(result.error);
    }
    // Note: If result.error is a compilation/runtime error string, it might be in result.error or stderr.
    // The original code expected raw JSON. executeCode returns raw JSON (mostly).
    // But executeCode MIGHT return { error: ... } if fetch failed.
    // If fetch succeeded, it returns the JSON.


    // Format Response
    const formattedResult = {
      build_result: {
        stdout: result.build_stdout || '',
        stderr: result.build_stderr || '',
      },
      program_output: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exit_code: result.exit_code,
      },
      status: 'completed'
    };

    // Log Successful Execution
    await logAudit(
      session.user.id,
      AuditAction.EXECUTE_CODE,
      {
        message: 'Code Execution Completed',
        language,
        input_snippet: input ? input.substring(0, 50) : null,
        exit_code: result.exit_code,
        duration: result.duration // If available from executeCode
      }
    );

    return NextResponse.json(formattedResult, { status: 200 });

  } catch (error: any) {
    console.error('Backend execution error:', error);
    console.error(`Internal server error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}