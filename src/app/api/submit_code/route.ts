import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeAgainstTestCases } from '@/lib/sandbox';

// 入力データの検証スキーマ
const submitCodeSchema = z.object({
  language: z.string(),
  source_code: z.string(),
  problemId: z.string().or(z.number()),
});

<<<<<<< HEAD
export async function POST(req: Request) {
  try {
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
}=======
>>>>>>> main
export async function POST(req: Request) {
  try {
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