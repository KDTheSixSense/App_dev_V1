import { NextResponse, NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

interface SessionData {
  user?: { id: number | string; email: string };
}

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  try {
    if (!session.user?.id) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }

    // Fetch all selection problems
    const selectionProblemsRaw = await prisma.selectProblem.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        subject: true,
        difficulty: true,
        creator: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Flatten the data structure for easier consumption by the frontend
    const selectionProblems = selectionProblemsRaw.map(problem => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      explanation: problem.explanation,
      answerOptions: problem.answerOptions,
      correctAnswer: problem.correctAnswer,
      difficulty: problem.difficulty?.id || problem.difficultyId,
      difficultyId: problem.difficulty?.id || problem.difficultyId,
      subjectId: problem.subjectId,
      createdBy: problem.createdBy,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      subject: problem.subject,
      creator: problem.creator
    }));

    return NextResponse.json(selectionProblems, { status: 200 });
  } catch (error) {
    console.error('Error fetching selection problems:', error);
    return NextResponse.json({ message: '選択問題の取得中にエラーが発生しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  try {
    // ログインしていない場合はエラーを返す
    if (!session.user || !session.user.id) {
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

    return NextResponse.json({ success: true, problem: newProblem, id: newProblem.id, title: newProblem.title }, { status: 201 });
  } catch (error) {
    console.error('Error creating select problem:', error);
    return NextResponse.json({ message: '問題の作成中にエラーが発生しました' }, { status: 500 });
  }
}