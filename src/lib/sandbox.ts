import { prisma } from '@/lib/prisma';

interface SandboxResult {
    build_result?: {
        stdout: string;
        stderr: string;
    };
    program_output?: {
        stdout: string;
        stderr: string;
        exit_code: number;
    };
    status: string;
    error?: string;
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
        // 並列実行するとサーバー負荷が高くなる可能性があるため、とりあえず逐次
        const results: TestCaseResult[] = [];
        const sandboxUrl = 'http://sandbox:4000/execute';

        for (const testCase of testCases) {
            let actualOutput = '';
            let status: TestCaseResult['status'] = 'System Error';
            let isCorrect = false;

            try {
                const response = await fetch(sandboxUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language,
                        source_code: sourceCode,
                        input: testCase.input.endsWith('\n') ? testCase.input : testCase.input + '\n',
                    }),
                });

                if (!response.ok) {
                    status = 'System Error';
                    actualOutput = `Sandbox Error: ${response.statusText}`;
                    console.error('Sandbox error response:', response.status, response.statusText);
                } else {
                    const result: SandboxResult = await response.json();
                    console.log(`Sandbox output for test case ${testCase.name || 'unknown'}:`, JSON.stringify(result));

                    if (result.error) {
                        status = 'System Error';
                        actualOutput = result.error;
                    } else if (result.build_result?.stderr) {
                        status = 'Compilation Error';
                        actualOutput = result.build_result.stderr;
                    } else if (result.program_output?.stderr) {
                        status = 'Runtime Error';
                        actualOutput = result.program_output.stderr;
                    } else {
                        actualOutput = (result.program_output?.stdout || '').trim();

                        // 比較 (末尾の改行などはtrimして比較するのが一般的)
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
                console.error('Sandbox execution error:', error);
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
            message: allPassed ? '正解です！おめでとうございます！' : '不正解のテストケースがあります。',
            testCaseResults: results,
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
