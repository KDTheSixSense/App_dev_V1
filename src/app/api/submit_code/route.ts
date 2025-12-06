import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execPromise = promisify(exec);

// 入力データの検証スキーマ
const submitCodeSchema = z.object({
  language: z.string(),
  source_code: z.string(),
  problemId: z.string().or(z.number()),
});

/**
 * コードをローカル環境で実行する関数 (多言語対応・コンパイルエラー許容版)
 */
async function executeLocally(language: string, sourceCode: string, input: string): Promise<{ output: string; error: string; isError: boolean }> {
  // 1. 一時ディレクトリ作成
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'submission-'));

  try {
    let fileName = '';
    let runCmd = '';
    let runArgs: string[] = [];
    let compileCmd = '';
    let compiledFile = ''; // 生成されるはずのファイル名を追跡

    // 2. 言語ごとの設定
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
        compiledFile = 'main.js'; // TSはJSに変換される
        // コンパイラへのパス (環境に合わせて自動検出)
        const tscExec = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
        const tscPath = path.join(process.cwd(), 'node_modules', '.bin', tscExec);
        // --noEmitOnError false を明示 (エラーがあってもJSを出す)
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

    // 4. コンパイル実行 (エラーがあっても成果物があれば続行するロジックに変更)
    if (compileCmd) {
      try {
        await execPromise(compileCmd, { cwd: tempDir });
      } catch (compileError: any) {
        // コンパイルコマンドが失敗(exit code != 0)した場合でも、
        // 実行に必要なファイル(main.js等)が生成されていれば無視して進む
        const isArtifactCreated = compiledFile && fs.existsSync(path.join(tempDir, compiledFile));

        if (!isArtifactCreated) {
          // 成果物がない＝本当に致命的なエラー
          return {
            output: '',
            error: `Compilation Error:\n${compileError.stdout || ''}\n${compileError.stderr || compileError.message}`,
            isError: true
          };
        }
        // 成果物がある場合は、型エラーなどは無視して実行ステップへ進む
      }
    }

    // 5. プロセスを起動して実行
    return await new Promise((resolve) => {
      // Dynamic command construction to avoid build-time static analysis
      // trying to resolve these as module imports
      const cmd = runCmd;
      const args = [...runArgs];

      const child = spawn(cmd, args, { cwd: tempDir });

      let stdout = '';
      let stderr = '';

      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      }

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });

      child.on('close', (code) => {
        if (code !== 0 && stderr) {
          resolve({ output: stdout, error: stderr, isError: true });
        } else {
          resolve({ output: stdout, error: stderr, isError: false });
        }
      });

      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          resolve({ output: stdout, error: 'Time Limit Exceeded (2s)', isError: true });
        }
      }, 2000);
    });

  } catch (e: any) {
    return { output: '', error: `System Error: ${e.message}`, isError: true };
  } finally {
    // 6. お掃除
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('Temp dir clean error', e);
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { language, source_code, problemId } = submitCodeSchema.parse(body);
    const pId = Number(problemId);

    const testCases = await prisma.testCase.findMany({
      where: { problemId: pId },
      orderBy: { order: 'asc' },
    });

    if (testCases.length === 0) {
      return NextResponse.json({ success: false, message: 'テストケースが設定されていません。' }, { status: 400 });
    }

    const results = [];

    for (const testCase of testCases) {
      const result = await executeLocally(language, source_code, testCase.input);

      const actualOutput = result.output.trim();
      const expectedOutput = testCase.expectedOutput.trim();

      const isCorrect = !result.isError && actualOutput === expectedOutput;

      let status = 'Accepted';
      if (result.isError) {
        status = result.error.includes('Time Limit') ? 'Time Limit Exceeded' : 'Runtime Error';
        if (result.error.includes('Compilation Error')) status = 'Compilation Error';
      } else if (!isCorrect) {
        status = 'Wrong Answer';
      }

      results.push({
        name: testCase.name || `Test ${testCase.order}`,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.isError ? result.error : actualOutput,
        isCorrect: isCorrect,
        status: status,
      });
    }

    const allPassed = results.every(r => r.isCorrect);

    return NextResponse.json({
      success: allPassed,
      message: allPassed ? '正解です！おめでとうございます！' : '不正解のテストケースがあります。',
      testCaseResults: results,
    });

  } catch (error) {
    console.error('Local Execution Error:', error);
    return NextResponse.json({
      success: false,
      message: '実行中にサーバーエラーが発生しました。'
    }, { status: 500 });
  }
}