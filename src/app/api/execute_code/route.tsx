import { NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { LRUCache } from 'lru-cache';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { executeCodeSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit';

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
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


function spawn_process(command: string, args: string[], options: any) {
  return spawn(command, args, options);
}


/**
 * ローカル環境でコードを実行する関数
 * submit_codeのロジックをベースに、コンパイル結果と実行結果を分けて返すように拡張
 */
async function executeLocally(language: string, sourceCode: string, input: string) {
  // 1. 一時ディレクトリ作成
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'execution-'));

  // 結果格納用
  const result = {
    build_stdout: '',
    build_stderr: '',
    stdout: '',
    stderr: '',
    exit_code: 0,
  };

  try {
    let fileName = '';
    let runCmd = '';
    let runArgs: string[] = [];
    let compileCmd = '';
    let compiledFile = '';

    // 2. 言語ごとの設定 (submit_codeと同様)
    switch (language) {
      case 'python':
      case 'python3':
        fileName = 'main.py';
        runCmd = process.platform === 'win32' ? 'python' : 'python3';
        runArgs = [fileName];
        break;

      case 'javascript':
        fileName = 'main.js';
        runCmd = 'node';
        runArgs = [fileName];
        break;

      case 'typescript':
        fileName = 'main.ts';
        compiledFile = 'main.js';
        // プロジェクト内の tsc を使用
        const tscExec = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
        const tscPath = path.join(process.cwd(), 'node_modules', '.bin', tscExec);
        compileCmd = `"${tscPath}" "${fileName}" --target es2020 --module commonjs --outDir . --noResolve --noEmitOnError false`;

        runCmd = 'node';
        runArgs = [compiledFile];
        break;

      case 'php':
        fileName = 'main.php';
        runCmd = 'php';
        runArgs = [fileName];
        break;

      case 'c':
        fileName = 'main.c';
        compiledFile = process.platform === 'win32' ? 'app.exe' : 'app';
        compileCmd = `gcc "${fileName}" -o ${compiledFile}`;
        runCmd = `./${compiledFile}`;
        runArgs = [];
        break;

      case 'cpp':
        fileName = 'main.cpp';
        compiledFile = process.platform === 'win32' ? 'app.exe' : 'app';
        compileCmd = `g++ "${fileName}" -o ${compiledFile}`;
        runCmd = `./${compiledFile}`;
        runArgs = [];
        break;

      case 'java':
        fileName = 'Main.java';
        compiledFile = 'Main.class';
        compileCmd = `javac "${fileName}"`;
        runCmd = 'java';
        runArgs = ['Main'];
        break;

      case 'csharp':
        fileName = 'Program.cs';
        compiledFile = 'app.exe';
        compileCmd = `mcs "${fileName}" -out:${compiledFile}`;
        runCmd = 'mono';
        runArgs = [compiledFile];
        break;

      default:
        throw new Error(`対応していない言語です: ${language}`);
    }

    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, sourceCode);

    // 3. コンパイル実行 (必要な場合)
    if (compileCmd) {
      try {
        const { stdout, stderr } = await execPromise(compileCmd, { cwd: tempDir });
        result.build_stdout = sanitizeOutput(stdout);
        result.build_stderr = sanitizeOutput(stderr);
      } catch (compileError: any) {
        // コンパイルエラー時はここで終了
        result.build_stdout = sanitizeOutput(compileError.stdout || '');
        result.build_stderr = sanitizeOutput(compileError.stderr || compileError.message);

        // 成果物がなければ実行せずに返す
        const isArtifactCreated = compiledFile && fs.existsSync(path.join(tempDir, compiledFile));
        if (!isArtifactCreated) {
          return result;
        }
      }
    }

    // 4. プログラムの実行
    await new Promise<void>((resolve) => {
      const child = spawn_process(runCmd, runArgs, { cwd: tempDir });

      // 入力を渡す
      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      }

      child.stdout.on('data', (data) => { result.stdout += data.toString(); });
      child.stderr.on('data', (data) => { result.stderr += data.toString(); });

      child.on('close', (code) => {
        result.exit_code = code || 0;
        resolve();
      });

      // タイムアウト設定 (3秒)
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          result.stderr += '\nError: Time Limit Exceeded (3s)';
          resolve();
        }
      }, 3000);
    });

    result.stdout = sanitizeOutput(result.stdout);
    result.stderr = sanitizeOutput(result.stderr);

    return result;

  } catch (e: any) {
    return { ...result, stderr: `System Error: ${e.message}` };
  } finally {
    // 5. お掃除
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('Temp dir clean error', e);
    }
  }
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

    // Determine Execution Environment
    const isDev = process.env.NODE_ENV === 'development';
    const hasAwsCreds = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    if (isDev || !hasAwsCreds) {
      // Local Execution (Development or No AWS Creds)
      console.log('Executing code locally...');
      result = await executeLocally(language, source_code, input || '');
    } else {
      // AWS Lambda Execution (Production)
      console.log('Executing code via AWS Lambda...');
      const command = new InvokeCommand({
        FunctionName: 'code-executor', // Lambda function name
        Payload: JSON.stringify({ language, source_code, input }),
      });
      const lambdaResponse = await lambdaClient.send(command);

      if (lambdaResponse.Payload) {
        const payloadString = new TextDecoder().decode(lambdaResponse.Payload);
        result = JSON.parse(payloadString);
      } else {
        throw new Error('Lambda returned no payload');
      }
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