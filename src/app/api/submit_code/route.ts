import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { JUDGE0_API_URL } from '@/lib/constants';

const submitCodeSchema = z.object({
    language: z.string(),
    source_code: z.string(),
    problemId: z.string(),
});

async function executeCode(source_code: string, language: string, stdin: string) {
    const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            source_code,
            language_id: language, // Judge0 v1.13.0 uses language_id as string
            stdin,
        }),
    });
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Judge0 API error: ${response.status} ${errorData}`);
    }
    return response.json();
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { language, source_code, problemId } = submitCodeSchema.parse(body);

        const testCases = await prisma.testCase.findMany({
            where: { problemId: parseInt(problemId) },
            orderBy: { order: 'asc' },
        });

        if (testCases.length === 0) {
            return NextResponse.json({ success: false, message: 'この問題にはテストケースが設定されていません。' }, { status: 400 });
        }

        for (const testCase of testCases) {
            const result = await executeCode(source_code, language, testCase.input);
            
            // ユーザーの出力を正規化（末尾の改行が1つだけなら削除）
            let output = result.stdout || '';
            if (output.endsWith('\n')) {
                output = output.slice(0, -1);
            }

            const expectedOutput = testCase.expectedOutput;

            if (result.stderr) {
                return NextResponse.json({
                    success: false,
                    message: `テストケース「${testCase.name}」で実行時エラーが発生しました。`,
                    yourOutput: result.stderr,
                    expected: expectedOutput,
                });
            }

            if (output !== expectedOutput) {
                return NextResponse.json({
                    success: false,
                    message: `テストケース「${testCase.name}」で不正解でした。`,
                    yourOutput: output,
                    expected: expectedOutput,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: '全てのテストケースに正解しました！おめでとうございます！',
        });

    } catch (error) {
        console.error('Error submitting code:', error);
        return NextResponse.json({ error: 'コードの提出処理中にエラーが発生しました。' }, { status: 500 });
    }
}