import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import 'acorn';

// Ace Editorが要求するアノテーションの型
type Annotation = {
    row: number;    // 0-indexed
    column: number; // 0-indexed
    text: string;   // エラーメッセージ
    type: 'error' | 'warning' | 'info';
};

// --- ヘルパー関数: プロセスの実行 ---
/**
 * 外部コマンドを実行し、標準出力と標準エラーを取得します。
 * @param command 実行するコマンド (例: 'python3')
 * @param args コマンドの引数配列
 * @param codeContent ファイルに書き込むコード内容
 * @param extension ファイルの拡張子 (例: '.py')
 * @returns { stdout: string, stderr: string, tempFile: string }
 */
async function runLintProcess(
    command: string,
    args: string[],
    codeContent: string,
    extension: string,
    // 
    useNode: boolean = false
): Promise<{ stdout: string; stderr: string; tempFile: string }> {
    // 1. 一時ファイルを作成
    const tempFile = path.join(os.tmpdir(), `lint_${Date.now()}${extension}`);
    let stderr = '';
    let stdout = '';
    
    let effectiveCommand = command;
    let effectiveArgs = [...args, tempFile];

    // 
    if (useNode) {
      effectiveCommand = 'node';
      effectiveArgs = [command, ...args, tempFile]; // 
    }

    try {
        await fs.writeFile(tempFile, codeContent, 'utf-8');
        
        // 2. コマンドを実行
        const process = spawn(effectiveCommand, effectiveArgs);

        process.stdout.on('data', (data) => (stdout += data.toString()));
        process.stderr.on('data', (data) => (stderr += data.toString()));

        // 3. 完了を待つ
        await new Promise((resolve, reject) => {
            process.on('close', resolve);
            process.on('error', (err) => {
                console.error(`Failed to start ${effectiveCommand}: ${err.message}`);
                stderr += `Failed to start ${effectiveCommand}: ${err.message}`;
                resolve(null); 
            });
        });

    } catch (error: any) {
        console.error(`Error during lint process (${effectiveCommand}):`, error);
        stderr += `Linting process failed: ${error.message}`;
    }

    return { stdout, stderr, tempFile };
}

// --- ヘルパー関数: 一時ファイルのクリーンアップ ---
async function cleanupTempFile(filePath: string) {
    try {
        await fs.unlink(filePath);
    } catch (e) {
        // ファイルが存在しない場合などのエラーは無視
    }
}


// --- 各言語のリンティングロジック ---

function getJavaClassName(code: string): string {
    const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
    return match ? match[1] : 'Main';
}

async function lintPython(code: string): Promise<Annotation[]> {
    
    // 1. `pyflakes` を実行し、複数のエラーをリストアップする
    const { stdout, stderr, tempFile } = await runLintProcess(
        'python3',           // コマンド
        ['-m', 'pyflakes'],  // 引数で '-m pyflakes' を指定
        code,
        '.py'
    );
    await cleanupTempFile(tempFile);

    const output = stdout + stderr;
    const annotations: Annotation[] = [];

    if (!output || output.trim() === '') {
        // pyflakes がエラーを検知しなかった場合はエラーなし
        return [];
    }

    // 2. pyflakes の出力形式を解析する正規表現
    // 例: <stdin>:4: invalid syntax
    // 例: <stdin>:13: invalid syntax
    const regex = /^(.*?):(\d+):(?:\d+:)? (.*)$/gm;
    let match;

    while ((match = regex.exec(output)) !== null) {
        // match[2] = 行番号 (1-based)
        // match[3] = エラーメッセージ (例: "invalid syntax")
        
        const row = parseInt(match[2], 10) - 1; // 0-basedに変換
        let text = match[3];

        // "invalid syntax" の場合は、より分かりやすいメッセージに補足する
        if (text.includes('invalid syntax')) {
            text = '構文エラー (コロン ":" やインデントなどを確認してください)';
        }

        annotations.push({
            row: row,
            column: 0, // pyflakesは正確な列番号を返さないため、行頭(0)に設定
            text: text,
            type: 'error',
        });
    }

    // 3. ast.parse の補助関数呼び出しを「削除」します
    // await lintPythonWithAst(code, annotations); // ← この行を削除またはコメントアウト

    return annotations;
}

/**
 * 補助関数: ast.parse を実行し、既存のエラー情報をリッチにする
 * 【lintPythonから呼び出されなくなったため、この関数は削除してもOKです】
 */
async function lintPythonWithAst(code: string, annotations: Annotation[]): Promise<void> {
    const pythonValidatorScript = `
        import ast
        import sys
        import json
        try:
            file_path = sys.argv[1]
            with open(file_path, 'r', encoding='utf-8') as f:
                source = f.read()
            ast.parse(source)
        except SyntaxError as e:
            # 構文エラーの時だけJSONを返す
            error_data = {'row': e.lineno, 'column': e.offset, 'text': e.msg, 'type': 'error'}
            print(json.dumps(error_data))
        except Exception:
            pass # 構文エラー以外は pyflakes に任せる
            `;

    const { stdout, tempFile } = await runLintProcess(
        'python3',
        ['-c', pythonValidatorScript],
        code,
        '.py'
    );
    await cleanupTempFile(tempFile);

    if (!stdout || stdout.trim() === '') {
        return; // ast.parse ではエラーなし
    }

    try {
        const errorInfo = JSON.parse(stdout);
        const row = (errorInfo.row ? errorInfo.row : 1) - 1;
        
        // 既に pyflakes が同じ行に "invalid syntax" を報告しているか確認
        const pyflakesError = annotations.find(a => a.row === row && a.text.includes('invalid syntax'));

        if (pyflakesError) {
            // pyflakes のエラーを、より詳細な ast.parse のエラーで上書きする
            pyflakesError.text = errorInfo.text; // 例: "expected ':'"
            if (typeof errorInfo.column === 'number' && errorInfo.column > 0) {
                pyflakesError.column = errorInfo.column - 1; // 0-basedに補正
            }
        } else {
            // pyflakes が検知しなかった構文エラー（稀）の場合、新規追加
            const alreadyExists = annotations.some(a => a.row === row);
            if (!alreadyExists) {
                annotations.push({
                    row: row,
                    column: (typeof errorInfo.column === 'number' && errorInfo.column > 0) ? errorInfo.column - 1 : 0,
                    text: errorInfo.text,
                    type: 'error',
                });
            }
        }
    } catch (e) {
        console.error('Failed to parse AST fallback output:', e);
    }
}

/**
 *  * tsc（TypeScriptコンパイラ）を使用してJSとTSの構文チェックを行います。
 */
async function lintTypeScriptOrJavaScript(code: string, language: 'javascript' | 'typescript'): Promise<Annotation[]> {
    const extension = language === 'typescript' ? '.ts' : '.js';
    
    // 
    const tscPath = path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');

    const tsArgs = [
        '--noEmit',          // 出力を生成しない
        '--pretty', 'false',   // フォーマットを適用しない
        '--skipLibCheck', 'true', // ライブラリの型チェックをスキップ
        '--target', 'esnext',
        '--module', 'commonjs',
        // '--jsx', 'preserve',
        '--lib', 'es2020,dom' 
    ];

    if (language === 'javascript') {
        tsArgs.push('--checkJs', '--allowJs');
    }

    // `node /path/to/tsc.js [args] [tempfile]` 
    const { stdout, stderr, tempFile } = await runLintProcess(
        tscPath,
        tsArgs,
        code,
        extension,
        true // 一時ファイルを使用する
    );
    await cleanupTempFile(tempFile);

    const output = stdout + stderr;
    if (!output || output.trim() === '') return [];

    // エラーメッセージのチェック
    if (output.includes('Failed to start tsc') || output.includes('command \'node\' not found')) {
         return [{ row: 0, column: 0, text: output.split('\n')[0], type: 'error' }];
    }

    const annotations: Annotation[] = [];
    // tsc
    // エラーメッセージの正規表現
    const regex = /^(.*?)\((\d+),(\d+)\): (error|warning) (TS\d+): (.*)$/gm;
    let match;
    
    while ((match = regex.exec(output)) !== null) {
        // 
        // if (!match[1].endsWith(extension)) continue; 

        annotations.push({
            row: parseInt(match[2], 10) - 1,    // 1-indexed -> 0-indexed
            column: parseInt(match[3], 10) - 1, // 1-indexed -> 0-indexed
            text: `(${match[5]}) ${match[6]}`, // エラーメッセージにコードを含める
            type: match[4] === 'warning' ? 'warning' : 'error',
        });
    }
    
    // エラーメッセージが存在しない場合
    if (annotations.length === 0 && output.trim() !== '') {
        const firstLine = output.split('\n')[0].replace(tempFile, 'Error'); 
        return [{ row: 0, column: 0, text: firstLine, type: 'error' }];
    }
    
    return annotations;
}

async function lintJava(code: string): Promise<Annotation[]> {
    
    const className = getJavaClassName(code);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lint-java-'));
    const tempFile = path.join(tempDir, `${className}.java`);
    
    let stderr = '';
    let spawnError = false; 

    try {
        await fs.writeFile(tempFile, code);
        
        const process = spawn('javac', [
            '-Xlint:none',
            '-encoding', 'UTF-8',
            '-d', tempDir,
            '-proc:none',
            tempFile
        ], { cwd: tempDir });

        process.stderr.on('data', (data) => (stderr += data.toString()));

        await new Promise((resolve) => {
            process.on('error', (err: any) => {
                if (err.code === 'ENOENT') {
                    stderr = `Lint command 'javac' not found. Is the JDK installed in the Docker container?`;
                } else {
                    stderr = `Failed to start javac: ${err.message}`;
                }
                spawnError = true;
                resolve(null);
            });
            process.on('close', (code) => {
                 if (!spawnError && code !== 0 && stderr.trim() === '') {
                     stderr = `javac failed with exit code ${code}.`;
                 }
                resolve(null);
            });
        });

    } catch (error: any) {
        stderr += `Linting process failed: ${error.message}`;
    } finally {
        await cleanupTempFile(tempFile);
        try {
            await fs.rmdir(tempDir);
        } catch (e) { /* 無視 */ }
    }

    if (!stderr) return [];
    
    if (stderr.includes('Lint command') || stderr.includes('javac failed')) {
         return [{ row: 0, column: 0, text: stderr, type: 'error' }];
    }
    
    const annotations: Annotation[] = [];
    
    const regex = /^(.*?):(\d+):(\d+): error: (.*)$/gm;
    const regexSimple = /^(.*?):(\d+): error: (.*)$/gm;
    
    let match;
    while ((match = regex.exec(stderr)) !== null) {
        const column = parseInt(match[3], 10);
        annotations.push({
            row: parseInt(match[2], 10) - 1,
            column: column > 0 ? column - 1 : 0,
            text: match[4],
            type: 'error',
        });
    }
    
    if (annotations.length === 0) {
        while ((match = regexSimple.exec(stderr)) !== null) {
             annotations.push({
                row: parseInt(match[2], 10) - 1,
                column: 0,
                text: match[3],
                type: 'error',
            });
        }
    }
    
    if (annotations.length === 0 && stderr.trim() !== '') {
        const firstLine = stderr.split('\n')[0].replace(tempFile, 'Error');
        return [{ row: 0, column: 0, text: firstLine, type: 'error' }];
    }
    
    return annotations;
}

async function lintCpp(code: string): Promise<Annotation[]> {
    const { stderr, tempFile } = await runLintProcess(
        'g++',
        ['-finput-charset=UTF-8','-fsyntax-only', '-pedantic-errors', '-std=c++11'],
        code,
        '.cpp'
    );
    await cleanupTempFile(tempFile);
    
    if (!stderr) return [];

    const annotations: Annotation[] = [];
    const regex = /^(.*?):(\d+):(\d+): error: (.*)$/gm;
    let match;
    while ((match = regex.exec(stderr)) !== null) {
        annotations.push({
            row: parseInt(match[2], 10) - 1,
            column: parseInt(match[3], 10) - 1,
            text: match[4],
            type: 'error',
        });
    }
    return annotations;
}

async function lintC(code: string): Promise<Annotation[]> {
    const { stderr, tempFile } = await runLintProcess(
        'gcc',
        ['-finput-charset=UTF-8','-fsyntax-only', '-pedantic-errors', '-std=c99'],
        code,
        '.c'
    );
    await cleanupTempFile(tempFile);
    
    if (!stderr) return [];
    const annotations: Annotation[] = [];
    const regex = /^(.*?):(\d+):(\d+): error: (.*)$/gm;
    let match;
    while ((match = regex.exec(stderr)) !== null) {
        annotations.push({
            row: parseInt(match[2], 10) - 1,
            column: parseInt(match[3], 10) - 1,
            text: match[4],
            type: 'error',
        });
    }
    return annotations;
}

async function lintCsharp(code: string): Promise<Annotation[]> {
    
    const wrappedCode = `
        using System;
        using System.Collections.Generic;
        using System.Linq;
        using System.Text;
        
        public class LintCheck
        {
            public static void Main(string[] args)
            {
        ${code} 
            }
        }
        `;
    const lineOffset = 10; 

    const { stdout, stderr, tempFile } = await runLintProcess(
        'csc',
        ['-nologo', `-out:${os.devNull}`],
        wrappedCode,
        '.cs'
    );
    await cleanupTempFile(tempFile);

    const output = stdout + stderr;

    if (!output) return [];
    
    if (output.includes('Lint command') || output.includes('Linter')) {
         return [{ row: 0, column: 0, text: output, type: 'error' }];
    }

    const annotations: Annotation[] = [];
    const regex = /^(.*?)\((\d+),(\d+)\): error (\w+): (.*)$/gm;
    let match;
    while ((match = regex.exec(output)) !== null) {
        const originalLine = parseInt(match[2], 10) - 1;
        
        if (originalLine < lineOffset) continue;
        
        annotations.push({
            row: originalLine - lineOffset,
            column: parseInt(match[3], 10) - 1,
            text: `${match[4]}: ${match[5]}`,
            type: 'error',
        });
    }
    return annotations;
}

async function lintPhp(code: string): Promise<Annotation[]> {
    
    const wrappedCode = code.trim().startsWith('<?php') 
        ? code 
        : `<?php\n${code}\n?>`;

    const { stdout, stderr, tempFile } = await runLintProcess(
        'php',
        ['-l'],
        wrappedCode,
        '.php'
    );
    await cleanupTempFile(tempFile);

    const output = stdout + stderr;

    if (!output || output.includes("No syntax errors detected")) return [];
    
    if (output.includes('Lint command') || output.includes('Linter')) {
         return [{ row: 0, column: 0, text: output, type: 'error' }];
    }

    const regex = /^Parse error: (.*?) in .*? on line (\d+)$/m;
    const match = output.match(regex);
    if (match) {
        const errorLine = parseInt(match[2], 10) - 1;
        
        const adjustedLine = code.trim().startsWith('<?php')
            ? errorLine
            : errorLine - 1;

        return [{
            row: adjustedLine < 0 ? 0 : adjustedLine,
            column: 0,
            text: match[1],
            type: 'error',
        }];
    }
    return [];
}


/**
 * サーバーサイドでコードの構文チェック（リンティング）を実行します
 * @param code ユーザーが入力したコード
 * @param language 'python' | 'javascript' | ...
 * @returns Ace Editor用のアノテーション配列
 */
async function lintCode(code: string, language: string): Promise<Annotation[]> {
    switch (language) {
        case 'python':
            return await lintPython(code);
        
        // 
        case 'javascript':
        case 'typescript':
            return await lintTypeScriptOrJavaScript(code, language);

        case 'java':
            return await lintJava(code);

        case 'cpp':
            return await lintCpp(code);
        
        case 'c':
            return await lintC(code);

        case 'csharp':
            return await lintCsharp(code);
        
        case 'php':
            return await lintPhp(code);

        default:
            return []; // 
    }
}


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, language } = body;

        if (typeof code !== 'string' || typeof language !== 'string') {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // 
        const annotations = await lintCode(code, language);

        return NextResponse.json({ annotations });

    } catch (error) {
        console.error('Lint API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}