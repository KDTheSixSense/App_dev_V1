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
    const sandboxUrl = process.env.SANDBOX_URL || 'http://sandbox:4000/execute';

    // INPUT INJECTION HACK:
    // Sandbox service seems to fail piping stdin correctly for Python, causing EOFError.
    // We inject sys.stdin mock directly into the code here.
    let codeToRun = sourceCode;
    if ((language === 'python' || language === 'python3') && input) {
        const escapedInput = JSON.stringify(input);
        // Prepend stdin mocking if not already present (simple check)
        if (!codeToRun.includes('sys.stdin = io.StringIO')) {
            codeToRun = `import sys\nimport io\nsys.stdin = io.StringIO(${escapedInput})\n\n` + sourceCode;
        }
    }

    try {
        const response = await fetch(sandboxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language,
                source_code: codeToRun,
                input: input,
            }),
        });

        if (!response.ok) {
            return {
                error: `Sandbox Error: ${response.statusText}`,
                stderr: `Sandbox Error: ${response.statusText}`, // fallback
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

        // console.log(`[DEBUG] Executing against ${testCases.length} test cases.`);
        // testCases.forEach((tc, i) => console.log(`[DEBUG] Case #${i + 1}: input='${tc.input.replace(/\n/g, "\\n")}', expected='${tc.expectedOutput.replace(/\n/g, "\\n")}'`));

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
