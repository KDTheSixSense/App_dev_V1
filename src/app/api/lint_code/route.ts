import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { parse } from 'acorn';

// Ace Editorが要求するアノテーションの型
type Annotation = {
    row: number;    // 0-indexed
    column: number; // 0-indexed
    text: string;   // エラーメッセージ
    type: 'error' | 'warning' | 'info';
};

// --- ヘルパー関数: プロセスの実行 ---
/**
 * 外部コマンドを実行し、標準出力と標準エラーを取得します。
 * @param command 実行するコマンド (例: 'python3')
 * @param args コマンドの引数配列
 * @param codeContent ファイルに書き込むコード内容
 * @param extension ファイルの拡張子 (例: '.py')
 * @returns { stdout: string, stderr: string }
 */
async function runLintProcess(
    command: string,
    args: string[],
    codeContent: string,
    extension: string
): Promise<{ stdout: string; stderr: string; tempFile: string }> {
    // 1. 一時ファイルを作成
    const tempFile = path.join(os.tmpdir(), `lint_${Date.now()}${extension}`);
    let stderr = '';
    let stdout = '';

    try {
        await fs.writeFile(tempFile, codeContent);
        
        // 2. コマンドを実行
        const process = spawn(command, [...args, tempFile]);

        process.stdout.on('data', (data) => (stdout += data.toString()));
        process.stderr.on('data', (data) => (stderr += data.toString()));

        // 3. 完了を待つ
        await new Promise((resolve, reject) => {
            process.on('close', resolve);
            process.on('error', (err) => {
                console.error(`Failed to start ${command}: ${err.message}`);
                stderr += `Failed to start ${command}: ${err.message}`;
                // プロセス開始失敗でも、エラーを返さず完了させる
                resolve(null); 
            });
        });

    } catch (error: any) {
        console.error(`Error during lint process (${command}):`, error);
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
    // クラス名が見つかればそれを、見つからなければ 'Main' をデフォルトとして使用
    return match ? match[1] : 'Main';
}

async function lintPython(code: string): Promise<Annotation[]> {
    const { stderr, tempFile } = await runLintProcess(
        'python3',
        ['-m', 'py_compile'],
        code,
        '.py'
    );
    await cleanupTempFile(tempFile);

    if (!stderr) return [];

    // エラーから行番号とメッセージを抽出
    const lineMatch = stderr.match(/line (\d+)/);
    const messageMatch = stderr.match(/SyntaxError: (.*)/);

    if (lineMatch && messageMatch) {
        const line = parseInt(lineMatch[1], 10);
        const message = messageMatch[1];
        
        return [{
            row: line - 1, // 1-indexed -> 0-indexed
            column: 0,     // py_compile は列番号を正確に出さない
            text: message,
            type: 'error',
        }];
    }
    return [];
}

async function lintJavaScriptOrTypeScript(code: string): Promise<Annotation[]> {
    try {
        // `acorn` を使ってパース
        // (TypeScriptの場合、型エラーは検出できないが、括弧やセミコロン抜けは検出可能)
        parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
        return []; // パース成功
    } catch (error: any) {
        // パース失敗
        if (error.loc) {
            const { line, column } = error.loc;
            return [{
                row: line - 1, // 1-indexed -> 0-indexed
                column: column,
                text: error.message.replace(/ \(\d+:\d+\)$/, ''), // "(1:2)" を削除
                type: 'error',
            }];
        }
    }
    return [];
}

async function lintJava(code: string): Promise<Annotation[]> {
    
    // 1. コードから public class 名 (例: Main) を取得
    const className = getJavaClassName(code);
    
    // 2. クラス名に基づいた一時ファイルパス (例: /tmp/lint-java-123/Main.java) を作成
    //    コンパイルにはディレクトリが必要な場合があるため、ディレクトリごと作成
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lint-java-'));
    const tempFile = path.join(tempDir, `${className}.java`);
    
    let stderr = '';
    let spawnError = false; // spawn自体のエラーを追跡

    try {
        await fs.writeFile(tempFile, code);
        
        // 3. javac を実行
        const process = spawn('javac', [
            '-Xlint:none',   // 警告を抑制（構文エラーのみほしい）
            '-d', tempDir, // コンパイル結果(.class)を破棄
            '-proc:none',    // アノテーション処理を無効化
            tempFile         // 正しいファイル名 (例: Main.java) でコンパイル
        ], { cwd: tempDir }); // 一時ディレクトリ内で実行

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
        // 4. 一時ファイルとディレクトリを削除
        await cleanupTempFile(tempFile);
        try {
            await fs.rmdir(tempDir);
        } catch (e) { /* 無視 */ }
    }

    if (!stderr) return [];
    
    // ▼ コマンドが見つからない場合やプロセス失敗の汎用エラーをキャッチ
    if (stderr.includes('Lint command') || stderr.includes('javac failed')) {
         return [{ row: 0, column: 0, text: stderr, type: 'error' }];
    }
    
    const annotations: Annotation[] = [];
    
    // 5. 【UPDATED】列番号(column)もキャプチャする正規表現
    // 例: /tmp/lint-java-123/Main.java:3:25: error: ';' expected
    //    Main.java:3: error: ';' expected
    //    ^ (ファイルパスが省略される場合にも対応)
    const regex = /^(.*?):(\d+):(\d+): error: (.*)$/gm;
    const regexSimple = /^(.*?):(\d+): error: (.*)$/gm;
    
    let match;
    while ((match = regex.exec(stderr)) !== null) {
        const column = parseInt(match[3], 10);
        annotations.push({
            row: parseInt(match[2], 10) - 1,   // 1-indexed -> 0-indexed
            column: column > 0 ? column - 1 : 0, // 1-indexed -> 0-indexed (列番号は1始まり)
            text: match[4],
            type: 'error',
        });
    }
    
    // 列番号なしのエラーフォーマットもフォールバックで確認
    if (annotations.length === 0) {
        while ((match = regexSimple.exec(stderr)) !== null) {
             annotations.push({
                row: parseInt(match[2], 10) - 1,
                column: 0, // 列番号が取れなかったので0
                text: match[3],
                type: 'error',
            });
        }
    }
    
    // エラーが検出されたが、正規表現にマッチしなかった場合（ファイル名不一致など）
    if (annotations.length === 0 && stderr.trim() !== '') {
        const firstLine = stderr.split('\n')[0].replace(tempFile, 'Error'); // パスを隠す
        return [{ row: 0, column: 0, text: firstLine, type: 'error' }];
    }
    
    return annotations;
}

async function lintCpp(code: string): Promise<Annotation[]> {
    const { stderr, tempFile } = await runLintProcess(
        'g++',
        ['-fsyntax-only', '-pedantic-errors', '-std=c++11'],
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
        ['-fsyntax-only', '-pedantic-errors', '-std=c99'], // 構文チェックのみ
        code,
        '.c'
    );
    await cleanupTempFile(tempFile);
    
    if (!stderr) return [];
    const annotations: Annotation[] = [];
    // g++ と同じエラー形式を想定
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
    
    // C#はMainクラス/メソッドでラップする必要がある
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
    // エラーの行番号を調整するためのオフセット
    const lineOffset = 10; // 上記テンプレートの ` ${code} ` が始まる行番号 - 1 (11 - 1)

    // C# (csc) は stdout にエラーを出力する場合がある
    const { stdout, stderr, tempFile } = await runLintProcess(
        'csc', // `csc` (mono) または `dotnet build` など
        ['-nologo', `-out:${os.devNull}`],
        wrappedCode, // ラップしたコード
        '.cs'
    );
    await cleanupTempFile(tempFile);

    const output = stdout + stderr; // stdoutとstderrを結合して解析

    if (!output) return [];
    
    if (output.includes('Lint command') || output.includes('Linter')) {
         return [{ row: 0, column: 0, text: output, type: 'error' }];
    }

    const annotations: Annotation[] = [];
    // Regex: /tmp/lint_....cs(5,2): error CS1525: Invalid expression term ')'
    // Regex: /tmp/lint_....cs(11,29): error CS1002: ; expected
    const regex = /^(.*?)\((\d+),(\d+)\): error (\w+): (.*)$/gm;
    let match;
    while ((match = regex.exec(output)) !== null) {
        const originalLine = parseInt(match[2], 10) - 1; // 0-indexed
        
        // テンプレート部分のエラーは無視
        if (originalLine < lineOffset) continue;
        
        annotations.push({
            row: originalLine - lineOffset, // ユーザーのコード行番号にマッピング
            column: parseInt(match[3], 10) - 1,
            text: `${match[4]}: ${match[5]}`,
            type: 'error',
        });
    }
    return annotations;
}

async function lintPhp(code: string): Promise<Annotation[]> {
    
    // コードが `<?php` で始まっていない場合、自動でラップする
    const wrappedCode = code.trim().startsWith('<?php') 
        ? code 
        : `<?php\n${code}\n?>`;

    // PHP (php -l) は stdout にエラーを出力する
    const { stdout, stderr, tempFile } = await runLintProcess(
        'php',
        ['-l'], // Lint (構文チェック)
        wrappedCode, // ラップしたコード
        '.php'
    );
    await cleanupTempFile(tempFile);

    const output = stdout + stderr; // stdoutとstderrを結合して解析

    // "No syntax errors detected" が成功
    if (!output || output.includes("No syntax errors detected")) return [];
    
    if (output.includes('Lint command') || output.includes('Linter')) {
         return [{ row: 0, column: 0, text: output, type: 'error' }];
    }

    // Example: Parse error: syntax error, unexpected '}' in /tmp/lint_....php on line 5
    const regex = /^Parse error: (.*?) in .*? on line (\d+)$/m;
    const match = output.match(regex);
    if (match) {
        const errorLine = parseInt(match[2], 10) - 1; // 0-indexed
        
        // コードをラップした場合、行番号を調整
        const adjustedLine = code.trim().startsWith('<?php')
            ? errorLine
            : errorLine - 1; // `<?php` の1行分を引く

        return [{
            row: adjustedLine < 0 ? 0 : adjustedLine,
            column: 0, // PHP lint は列番号を出さない
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
        
        case 'javascript':
        case 'typescript': // TypeScriptはAcornで基本的な構文エラーのみチェック
            return await lintJavaScriptOrTypeScript(code);

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
            return []; // サポート外の言語
    }
}


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, language } = body;

        if (typeof code !== 'string' || typeof language !== 'string') {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // リンティングを実行
        const annotations = await lintCode(code, language);

        return NextResponse.json({ annotations });

    } catch (error) {
        console.error('Lint API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}