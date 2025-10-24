import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

interface SessionData {
  user?: { id: number | string; email: string };
}

export async function POST(req: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    try {
        // セッションからユーザー情報を取得
        const user = session.user;

        // ログインしていない場合はエラーを返す
        if (!user || !user.id) {
            return NextResponse.json({ success: false, message: '認証されていません。' }, { status: 401 });
        }
        const userId = Number(user.id);

        const body = await req.json();
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
    console.warn('DEPRECATED: /api/select-problems is deprecated. Use /api/selects_problems instead.');
    
    // Redirect to the correct endpoint
    const url = new URL(request.url);
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/selects_problems${url.search}`, {
        method: 'GET',
        headers: {
            // Forward any authentication headers
            ...Object.fromEntries(
                Array.from(request.headers.entries()).filter(([key]) => 
                    key.toLowerCase().includes('auth') || key.toLowerCase().includes('cookie')
                )
            )
        }
    });
    
    return response;
}