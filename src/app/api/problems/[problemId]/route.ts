// /app/api/problems/[problemId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- GET関数 (問題データを取得するため) ---
export async function GET(request: Request, { params }: any) {
  const problemId = parseInt(params.problemId);

  if (isNaN(problemId)) {
    return NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
  }

  try {
    // ★ 修正: prisma.problem -> prisma.programmingProblem
    const problem = await prisma.programmingProblem.findUnique({
      where: { id: problemId },
      include: {
        sampleCases: true,
        testCases: true,
        files: true,
      },
    });

    if (!problem) {
      return NextResponse.json({ message: '問題が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(problem, { status: 200 });
  } catch (error: any) {
    console.error('問題の取得中にエラーが発生しました:', error);
    return NextResponse.json({ message: '問題の取得に失敗しました', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// --- PUT関数 (問題データを更新するため) ---
export async function PUT(request: Request, { params }: any) {
  const problemId = parseInt(params.problemId);

  if (isNaN(problemId)) {
    return NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // ★ 修正: prisma.problem -> prisma.programmingProblem
    const updatedProblem = await prisma.programmingProblem.update({
      where: { id: problemId },
      data: {
        // フロントエンドから送られてくるキー名に合わせる
        title: body.title,
        problemType: body.problemType,
        difficulty: body.difficulty,
        timeLimit: body.timeLimit,
        category: body.category,
        topic: body.topic,
        tags: body.tags,
        description: body.description,
        codeTemplate: body.codeTemplate,
        isPublic: body.isPublic,
        allowTestCaseView: body.allowTestCaseView,
      },
    });

    // ここで sampleCases や testCases の更新処理も必要に応じて追加

    return NextResponse.json({ message: '問題が正常に更新されました！', problem: updatedProblem }, { status: 200 });
  } catch (error: any) {
    console.error('問題の更新中にエラーが発生しました:', error);
    return NextResponse.json({ message: '問題の更新に失敗しました', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
