import { NextResponse, NextRequest } from 'next/server';
import { IronSession, IronSessionData } from 'iron-session';
import { withApiSession } from '@/lib/session-api';
import { prisma } from '@/lib/prisma';

async function postHandler(req: NextRequest, session: IronSession<IronSessionData>) {
  try {
    if (!session.user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }
    const userId = parseInt(String(session.user.id), 10);
    if (isNaN(userId)) {
      return NextResponse.json({ message: '無効なユーザーIDです' }, { status: 400 });
    }

    const body = await req.json();
    const {
      title, description, explanation, answerOptions, 
      correctAnswer, subjectId, difficultyId,
    } = body;

    if (!title || !description || !answerOptions || !correctAnswer || !subjectId || !difficultyId) {
      return NextResponse.json({ message: '必須フィールドが不足しています' }, { status: 400 });
    }

    const newProblem = await prisma.selectProblem.create({
      data: {
        title, description, explanation, answerOptions, 
        correctAnswer, difficultyId, subjectId, createdBy: userId,
      },
    });

    return NextResponse.json(newProblem, { status: 201 });
  } catch (error) {
    console.error('Error creating select problem:', error);
    return NextResponse.json({ message: '問題の作成中にエラーが発生しました' }, { status: 500 });
  }
}

export const POST = withApiSession(postHandler);