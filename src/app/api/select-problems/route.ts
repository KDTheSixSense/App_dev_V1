import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// 4択問題を作成するためのPOSTリクエストを処理する関数
export async function POST(request: Request) {
    try {
        // セッションからユーザー情報を取得
        const session = await getSession();
        const user = session.user;

        // ログインしていない場合はエラーを返す
        if (!user || !user.id) {
            return NextResponse.json({ success: false, message: '認証されていません。' }, { status: 401 });
        }
        const userId = Number(user.id);

        const body = await request.json();
        const {
            title,
            description,
            explanation,
            answerOptions,
            correctAnswer,
            subjectId,
            difficultyId,
        } = body;

        if (!title || !description || !Array.isArray(answerOptions) || answerOptions.length === 0 || !correctAnswer || !subjectId || !difficultyId) {
            return NextResponse.json({ success: false, message: '必須項目が不足しています。' }, { status: 400 });
        }

        const newProblem = await prisma.selectProblem.create({
            data: {
                title,
                description,
                explanation,
                answerOptions: answerOptions,
                correctAnswer,
                subjectId,
                difficultyId,
                createdBy: userId,
            },
        });

        return NextResponse.json({ success: true, problem: newProblem }, { status: 201 });

    } catch (error) {
        console.error('Error creating select problem:', error);
        if (error instanceof Error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, message: 'An unknown error occurred' }, { status: 500 });
    }
}

// 選択問題の一覧を取得するGETハンドラ (こちらも念のため記載)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const problems = await prisma.selectProblem.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    const formattedProblems = problems.map(p => ({
        ...p,
        difficulty: p.difficultyId
    }));

    return NextResponse.json({ success: true, problems: formattedProblems });
  } catch (error) {
    console.error('Error fetching select problems:', error);
    if (error instanceof Error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: 'An unknown error occurred' }, { status: 500 });
  }
}