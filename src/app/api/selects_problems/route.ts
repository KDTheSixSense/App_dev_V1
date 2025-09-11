import { NextResponse, NextRequest } from 'next/server';
import { IronSession, IronSessionData } from 'iron-session';
import { withApiSession } from '@/lib/session-api';
import { prisma } from '@/lib/prisma';

async function getHandler(req: NextRequest, session: IronSession<IronSessionData>) {
  try {
    if (!session.user) {
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

    return NextResponse.json({ success: true, problem: newProblem, id: newProblem.id, title: newProblem.title }, { status: 201 });
  } catch (error) {
    console.error('Error creating select problem:', error);
    return NextResponse.json({ message: '問題の作成中にエラーが発生しました' }, { status: 500 });
  }
}

export const GET = withApiSession(getHandler);
export const POST = withApiSession(postHandler);
