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
    const { stderr, tempFile } = await runLintProcess(
        'javac',
        ['-Xlint:none', '-d', os.devNull, '-proc:none'], //構文エラーのみ報告
        code,
        '.java'
    );
    await cleanupTempFile(tempFile);

    if (!stderr) return [];
    
    const annotations: Annotation[] = [];
    // Regex: /path/to/File.java:5: error: ';' expected
    const regex = /^(.*?):(\d+): error: (.*)$/gm;
    let match;
    while ((match = regex.exec(stderr)) !== null) {
        // tempFileの名前（例: /tmp/lint_...java）を "Error" に置換
        const message = match[3].replace(tempFile, 'Error');
        annotations.push({
            row: parseInt(match[2], 10) - 1, // 1-indexed -> 0-indexed
            column: 0, // javac は正確な列番号を出さない
            text: message,
            type: 'error',
        });
    }
    return annotations;
}

async function lintCpp(code: string): Promise<Annotation[]> {
    const { stderr, tempFile } = await runLintProcess(
        'g++',
        ['-fsyntax-only', '-pedantic-errors', '-std=c++11'], // 構文チェックのみ
        code,
        '.cpp'
    );
    await cleanupTempFile(tempFile);
    
    if (!stderr) return [];

    const annotations: Annotation[] = [];
    // Regex: /tmp/lint_...cpp:4:5: error: expected ';' before '}' token
    const regex = /^(.*?):(\d+):(\d+): error: (.*)$/gm;
    let match;
    while ((match = regex.exec(stderr)) !== null) {
        annotations.push({
            row: parseInt(match[2], 10) - 1, // 1-indexed
            column: parseInt(match[3], 10) - 1, // 1-indexed
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
    // C# (csc) は stdout にエラーを出力する
    const { stdout, tempFile } = await runLintProcess(
        'csc',
        ['-nologo', `-out:${os.devNull}`],
        code,
        '.cs'
    );
    await cleanupTempFile(tempFile);

    if (!stdout) return [];

    const annotations: Annotation[] = [];
    // Regex: /tmp/lint_....cs(5,2): error CS1525: Invalid expression term ')'
    const regex = /^(.*?)\((\d+),(\d+)\): error (\w+): (.*)$/gm;
    let match;
    while ((match = regex.exec(stdout)) !== null) {
        annotations.push({
            row: parseInt(match[2], 10) - 1, // 1-indexed
            column: parseInt(match[3], 10) - 1, // 1-indexed
            text: `${match[4]}: ${match[5]}`,
            type: 'error',
        });
    }
    return annotations;
}

async function lintPhp(code: string): Promise<Annotation[]> {
    // PHP (php -l) は stdout にエラーを出力する
    const { stdout, tempFile } = await runLintProcess(
        'php',
        ['-l'], // Lint (構文チェック)
        code,
        '.php'
    );
    await cleanupTempFile(tempFile);

    // "No syntax errors detected" が成功
    if (!stdout || stdout.startsWith("No syntax errors detected")) return [];

    // Example: Parse error: syntax error, unexpected '}' in /tmp/lint_....php on line 5
    const regex = /^Parse error: (.*?) in .*? on line (\d+)$/m;
    const match = stdout.match(regex);
    if (match) {
        return [{
            row: parseInt(match[2], 10) - 1, // 1-indexed
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