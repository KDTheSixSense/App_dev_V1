import { prisma } from '@/lib/prisma';

// Updated interface to match the actual flat response structure from the sandbox service
export interface SandboxResult {
    build_result?: {
        stdout: string;
        stderr: string;
    };
    // The service returns these at the root level, but we support both just in case
    stdout?: string;
    stderr?: string;
    exit_code?: number;
    error?: string;

    // Legacy support if it ever returns nested
    program_output?: {
        stdout: string;
        stderr: string;
        exit_code: number;
    };
}

export interface TestCaseResult {
    name: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    isCorrect: boolean;
    status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Compilation Error' | 'System Error';
}

export interface ExecutionResult {
    success: boolean;
    message: string;
    testCaseResults: TestCaseResult[];
    score?: number;
    passedCount?: number;
    totalCount?: number;
}

// Shared execution logic
export async function executeCode(
    language: string,
    sourceCode: string,
    input: string
): Promise<SandboxResult> {
    const sandboxUrl = `${process.env.SANDBOX_URL}/execute`;

    // The incoming source code can be either raw or Base64.
    // We must first decode it to its raw form before making any modifications.
    const isSourceEncoded = (() => {
        if (!sourceCode || sourceCode.trim() === '') return false;
        try {
            // Check if the string is valid Base64 by attempting to decode and re-encode it.
            return Buffer.from(sourceCode, 'base64').toString('base64') === sourceCode;
        } catch (e) {
            return false;
        }
    })();

    let codeToRun = isSourceEncoded
        ? Buffer.from(sourceCode, 'base64').toString('utf-8')
        : sourceCode;

    // INPUT INJECTION HACK:
    // With the raw code, we can now safely inject the stdin mock for Python execution if needed.
    if ((language === 'python' || language === 'python3') && input) {
        const escapedInput = JSON.stringify(input);
        // Prepend stdin mocking only if it's not already present.
        if (!codeToRun.includes('sys.stdin = io.StringIO')) {
            // Note: We prepend to the already decoded code.
            codeToRun = `import sys\nimport io\nsys.stdin = io.StringIO(${JSON.stringify(input)})\n\n` + codeToRun;
        }
    }
    
    // Finally, after all modifications, we encode the final code payload into Base64 for the sandbox.
    const encodedCode = Buffer.from(codeToRun).toString('base64');

    try {
        const response = await fetch(sandboxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language,
                source_code: encodedCode, // Send the encoded code
                input: input,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Sandbox service error:", errorText);
            return {
                error: `Sandbox Error: ${response.statusText}`,
                stderr: `Sandbox Error: ${response.statusText} - ${errorText}`, // fallback
            };
        }

        const result: SandboxResult = await response.json();
        return result;
    } catch (error: any) {
        console.error('Sandbox connection error:', error);
        return {
            error: error.message || 'Failed to connect to sandbox',
            stderr: error.message || 'Failed to connect to sandbox',
        };
    }
}

/**
 * コードを指定されたテストケース（または問題IDから取得したテストケース）に対して実行し、結果を返します。
 * Sandboxサービスを使用します。
 */
export async function executeAgainstTestCases(
    language: string,
    sourceCode: string,
    problemId: number,
    providedTestCases?: { input: string; expectedOutput: string; name?: string }[]
): Promise<ExecutionResult> {
    try {
        // 1. テストケースの取得
        let testCases = providedTestCases;

        if (!testCases || testCases.length === 0) {
            // DBからテストケースを取得
            const dbTestCases = await prisma.testCase.findMany({
                where: { problemId: problemId },
                orderBy: { order: 'asc' },
            });

            if (dbTestCases.length > 0) {
                testCases = dbTestCases.map((tc) => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    name: tc.name || `Test Case ${tc.order}`,
                }));
            } else {
                // テストケースがない場合はサンプルケースをフォールバックとして使用
                const dbSampleCases = await prisma.sampleCase.findMany({
                    where: { problemId: problemId },
                    orderBy: { order: 'asc' },
                });

                if (dbSampleCases.length > 0) {
                    testCases = dbSampleCases.map((sc) => ({
                        input: sc.input,
                        expectedOutput: sc.expectedOutput,
                        name: `Sample Case ${sc.order}`
                    }));
                } else {
                    return {
                        success: false,
                        message: 'テストケースが見つかりませんでした。',
                        testCaseResults: []
                    }
                }
            }
        }

        // 2. Sandboxサービスでの実行 (逐次実行)
        const results: TestCaseResult[] = [];

        for (const testCase of testCases) {
            let actualOutput = '';
            let status: TestCaseResult['status'] = 'System Error';
            let isCorrect = false;

            try {
                // Use the shared executeCode function
                const result = await executeCode(language, sourceCode, testCase.input);

                if (result.error) {
                    status = 'System Error';
                    actualOutput = result.error;
                } else if (result.build_result?.stderr) {
                    status = 'Compilation Error';
                    actualOutput = result.build_result.stderr;
                } else {
                    // Handle both flat and nested structure (prioritize flat)
                    const runtimeStderr = result.stderr || result.program_output?.stderr;
                    const runtimeStdout = result.stdout || result.program_output?.stdout || '';

                    if (runtimeStderr) {
                        status = 'Runtime Error';
                        actualOutput = runtimeStderr;
                    } else {
                        actualOutput = runtimeStdout.trim();

                        // 比較
                        const expected = testCase.expectedOutput.trim();
                        if (actualOutput === expected) {
                            status = 'Accepted';
                            isCorrect = true;
                        } else {
                            status = 'Wrong Answer';
                            isCorrect = false;
                        }
                    }
                }

            } catch (error: any) {
                console.error('Sandbox execution error in loop:', error);
                status = 'System Error';
                actualOutput = error.message || 'Unknown error';
            }

            results.push({
                name: testCase.name || 'Test Case',
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                actualOutput,
                isCorrect,
                status,
            });
        }

        const allPassed = results.every((r) => r.isCorrect);

        return {
            success: allPassed,
            message: allPassed ? '正解です！おめでとうございます！' : `不正解のテストケースがあります。(${results.filter(r => r.isCorrect).length}/${results.length} ケース正解)`,
            testCaseResults: results,
            passedCount: results.filter(r => r.isCorrect).length,
            totalCount: results.length,
        };

    } catch (error: any) {
        console.error('executeAgainstTestCases error:', error);
        return {
            success: false,
            message: '実行中にサーバーエラーが発生しました。',
            testCaseResults: [],
        };
    }
}
