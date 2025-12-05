import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET: IDに基づいて単一の選択問題を取得
export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }

    const problemId = parseInt(params.id, 10);
    if (isNaN(problemId)) {
      return NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
    }

    const problem = await prisma.selectProblem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return NextResponse.json({ message: '問題が見つかりません' }, { status: 404 });
    }

    // セキュリティ: ログインユーザーが作成者か確認
    if (problem.createdBy !== session.user.id) {
      return NextResponse.json({ message: '権限がありません' }, { status: 403 });
    }

    return NextResponse.json(problem);
  } catch (error) {
    console.error("Error fetching select problem:", error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// PUT: IDに基づいて選択問題を更新
export async function PUT(
  request: Request,
  { params }: any
) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }

    const problemId = parseInt(params.id, 10);
    if (isNaN(problemId)) {
      return NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
    }

    // セキュリティ: ログインユーザーが作成者か確認
    const existingProblem = await prisma.selectProblem.findUnique({ where: { id: problemId } });
    if (!existingProblem || existingProblem.createdBy !== session.user.id) {
      return NextResponse.json({ message: '権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, explanation, answerOptions, correctAnswer, difficultyId } = body;

    const updatedProblem = await prisma.selectProblem.update({
      where: { id: problemId },
      data: {
        title,
        description,
        explanation,
        answerOptions,
        correctAnswer,
        difficultyId,
      },
    });

    return NextResponse.json({ success: true, problem: updatedProblem });
  } catch (error) {
    console.error("Error updating select problem:", error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}