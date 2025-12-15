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

// --- レート制限の設定 ---
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

// --- 基本的なキーワードブロック (多層防御) ---
// 注: これは完全なセキュリティソリューションではありません
function containsForbiddenKeywords(code: string, language: string): boolean {
  const dangerousKeywords = [
    'child_process', 'spawn', 'exec', 'fork', // Node.js
    'import os', 'import subprocess', 'import sys', 'from os', 'from subprocess', // Python
    'system(', 'exec(', 'popen(', // C/C++
    'Runtime.getRuntime', 'ProcessBuilder', // Java
    'System.Diagnostics.Process' // C#
  ];

  // Pythonの場合、入力ハックのために 'import sys' を許可する必要がある場合がありますが、
  // ユーザーコードとしての使用はブロックするのが一般的です。
  // ただし、lib/sandbox.ts で自動挿入される sys はここを通過した後なので問題ありません。
  return dangerousKeywords.some(keyword => code.includes(keyword));
}

export async function POST(request: Request) {
  try {
    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. レート制限のチェック
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

    // ★重要: source_code はクライアントから「プレーンテキスト」で送られてきます。
    // executeCode 関数 (lib/sandbox.ts) が Base64 エンコードを担当します。

    // 2. セキュリティチェック: 入力値に対するWAF (SQLi, XSS, Path Traversal)
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

    // 3. セキュリティチェック: 禁止キーワードの確認
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
      // エラーメッセージを含めて 200 OK を返す (クライアント側で表示するため)
      return NextResponse.json({
        build_result: { stdout: '', stderr: 'Security Error: Forbidden keywords detected.' },
        program_output: { stdout: '', stderr: '' },
      }, { status: 200 });
    }

    let result;

    // 4. サンドボックスでの実行
    // 共通の実行ロジックを使用 (ここで Base64化 などの処理が行われます)
    result = await executeCode(language, source_code, input || '') as any;

    if (result.error && result.error.startsWith('Sandbox Error')) {
      // ネットワークやシステムのエラー
      throw new Error(result.error);
    }

    // レスポンスの整形
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