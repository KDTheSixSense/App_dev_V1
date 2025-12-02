import { NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execPromise = promisify(exec);

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
        result.build_stdout = stdout;
        result.build_stderr = stderr;
      } catch (compileError: any) {
        // コンパイルエラー時はここで終了
        result.build_stdout = compileError.stdout || '';
        result.build_stderr = compileError.stderr || compileError.message;
        
        // 成果物がなければ実行せずに返す
        const isArtifactCreated = compiledFile && fs.existsSync(path.join(tempDir, compiledFile));
        if (!isArtifactCreated) {
            return result; 
        }
      }
    }

    // 4. プログラムの実行
    await new Promise<void>((resolve) => {
      const child = spawn(runCmd, runArgs, { cwd: tempDir });

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
    const { language, source_code, input } = await request.json();

    if (!language || !source_code) {
      return NextResponse.json({ error: 'Language and source_code are required.' }, { status: 400 });
    }

    // 自作のローカル実行関数を呼び出し
    const result = await executeLocally(language, source_code, input || '');

    // フロントエンドが期待する形式（Paiza.IO互換）に合わせてレスポンスを作成
    const formattedResult = {
      build_result: {
        stdout: result.build_stdout || null,
        stderr: result.build_stderr || null,
      },
      program_output: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
      },
      // 実行完了ステータス
      status: 'completed' 
    };

    return NextResponse.json(formattedResult, { status: 200 });

  } catch (error) {
    console.error('Backend execution error:', error);
    return NextResponse.json({ error: 'Internal server error during code execution.' }, { status: 500 });
  }
}