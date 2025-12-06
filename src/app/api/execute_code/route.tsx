import { NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { LRUCache } from 'lru-cache';
import { executeCodeSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit';

const execPromise = promisify(exec);

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
function sanitizeOutput(output: string): string {
  const tmpDir = os.tmpdir();
  let sanitized = output.split(tmpDir).join('/sandbox');
  // ユーザー名なども隠す
  const username = os.userInfo().username;
  if (username) {
    sanitized = sanitized.split(username).join('user');
  }
  return sanitized;
}

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

    // Sandbox service URL (docker-compose service name 'sandbox')
    // Note: In Docker network, hostname is service name.
    const sandboxUrl = 'http://sandbox:4000/execute';

    try {
      const response = await fetch(sandboxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language, source_code, input }),
      });

      if (!response.ok) {
        throw new Error(`Sandbox service error: ${response.statusText}`);
      }

      result = await response.json();
    } catch (sandboxError: any) {
      console.error('Sandbox connection error:', sandboxError);
      // Fallback or error reporting
      throw new Error(`Failed to connect to sandbox: ${sandboxError.message}. Make sure the sandbox container is running.`);
    }

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

    return NextResponse.json(formattedResult, { status: 200 });

  } catch (error: any) {
    console.error('Backend execution error:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}