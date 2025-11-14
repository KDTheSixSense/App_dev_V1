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
    const { stderr, tempFile } = await runLintProcess(
        'python3',
        ['-m', 'py_compile'],
        '# -*- coding: utf-8 -*-\n' + code,
        '.py'
    );
    await cleanupTempFile(tempFile);

    if (!stderr) return [];

    const lineMatch = stderr.match(/line (\d+)/);
    const messageMatch = stderr.match(/SyntaxError: (.*)/);

    if (lineMatch && messageMatch) {
        const line = parseInt(lineMatch[1], 10);
        const message = messageMatch[1];
        
        return [{
            row: line - 1,
            column: 0,
            text: message,
            type: 'error',
        }];
    }
    return [];
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