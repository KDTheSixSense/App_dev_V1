import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeAgainstTestCases } from '@/lib/sandbox';

import { getAppSession } from '@/lib/auth';

// 入力データの検証スキーマ
const submitCodeSchema = z.object({
  language: z.string(),
  source_code: z.string(),
  problemId: z.string().or(z.number()),
});

export async function POST(req: Request) {
  try {
    const session = await getAppSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { language, source_code, problemId } = submitCodeSchema.parse(body);
    const pId = Number(problemId);

    // executeAgainstTestCases (using Sandbox) handles test case retrieval and execution
    const executionResult = await executeAgainstTestCases(
      language,
      source_code,
      pId
    );

    return NextResponse.json({
      success: executionResult.success,
      message: executionResult.message,
      testCaseResults: executionResult.testCaseResults,
    });

  } catch (error) {
    console.error('Execution Error:', error);
    return NextResponse.json({
      success: false,
      message: '実行中にサーバーエラーが発生しました。'
    }, { status: 500 });
  }
}