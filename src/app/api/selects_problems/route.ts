import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: string; email: string };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }

    // Fetch all selection problems
    const selectionProblemsRaw = await prisma.selectProblem.findMany({
      where: {
        OR: [
          { isPublic: true }, // 公開問題
          { createdBy: session.user.id }, // 自分が作成した問題
          { createdBy: null } // システム作成問題 (シードデータなど)
        ]
      },
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
      // explanation: problem.explanation, // セキュリティ対策: クライアントには答えや解説を返さない
      answerOptions: problem.answerOptions,
      // correctAnswer: problem.correctAnswer, // セキュリティ対策: 正解データは隠す
      difficulty: problem.difficulty?.id || problem.difficultyId,
      difficultyId: problem.difficulty?.id || problem.difficultyId,
      subjectId: problem.subjectId,
      createdBy: problem.createdBy,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      subject: problem.subject,
      creator: problem.creator,
      isPublic: problem.isPublic
    }));

    return NextResponse.json(selectionProblems, { status: 200 });
  } catch (error) {
    console.error('Error fetching selection problems:', error);
    return NextResponse.json({ message: '選択問題の取得中にエラーが発生しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    // ログインしていない場合はエラーを返す
    if (!session.user || !session.user.id) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const {
      title, description, explanation, answerOptions,
      correctAnswer, subjectId, difficultyId, isPublic
    } = body;

    if (!title || !description || !answerOptions || !correctAnswer || !subjectId || !difficultyId) {
      return NextResponse.json({ message: '必須フィールドが不足しています' }, { status: 400 });
    }

    const newProblem = await prisma.selectProblem.create({
      data: {
        title, description, explanation, answerOptions,
        correctAnswer, difficultyId, subjectId, createdBy: userId,
        isPublic: isPublic || false,
      },
    });

    return NextResponse.json({ success: true, problem: newProblem, id: newProblem.id, title: newProblem.title }, { status: 201 });
  } catch (error) {
    console.error('Error creating select problem:', error);
    return NextResponse.json({ message: '問題の作成中にエラーが発生しました' }, { status: 500 });
  }
}
