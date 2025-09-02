import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 4択問題を作成するためのPOSTリクエストを処理する関数
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            title,
            description,
            explanation,
            answerOptions, // フロントエンドからはこの名前で配列が送られてくる
            correctAnswer,
            subjectId,
            difficultyId,
        } = body;

        if (
            !title || 
            !description || 
            !Array.isArray(answerOptions) || 
            answerOptions.length !== 4 || 
            !correctAnswer || 
            !subjectId || 
            !difficultyId
        ) {
            return NextResponse.json({ success: false, message: '必須項目が不足しています。' }, { status: 400 });
        }

        const newProblem = await prisma.selectProblem.create({
            data: {
                title,
                description,
                explanation,
                
                // ★★★ 修正箇所: スキーマ定義に合わせて 'answerOptions' に修正 ★★★
                answerOptions: answerOptions,
                
                correctAnswer,
                subjectId,
                difficultyId,
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