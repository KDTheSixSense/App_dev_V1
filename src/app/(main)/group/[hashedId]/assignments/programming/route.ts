// /app/api/groups/[hashedId]/assignments/programming/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: number | string; email: string };
}

export async function POST(req: NextRequest, context: any) {
  const { params } = context;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }
  const userId = Number(sessionUserId);

    try {
        const body = await req.json();
        // フロントエンドから送られてくるデータ構造に合わせて修正
        const { assignmentTitle, assignmentDescription, dueDate, problemData } = body;

    const group = await prisma.groups.findUnique({ where: { hashedId: params.hashedId } });
    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // 1. プログラミング問題を作成
    const newProblem = await prisma.programmingProblem.create({
      data: {
        title: problemData.title,
        description: problemData.description,
        difficulty: problemData.difficulty,
        timeLimit: problemData.timeLimit,
        tags: problemData.tags, // JSON文字列になっていることを確認
        createdBy: userId,
        isPublic: false, // グループ課題なので非公開に設定
        sampleCases: {
          create: problemData.sampleCases.map((c: any) => ({
            input: c.input,
            expectedOutput: c.expectedOutput,
            description: c.description,
          })),
        },
        testCases: {
          create: problemData.testCases.map((c: any) => ({
            name: c.name,
            input: c.input,
            expectedOutput: c.expectedOutput,
            description: c.description,
          })),
        },
      },
    });

    // 2. 課題を作成し、プログラミング問題と紐付ける
    const newAssignment = await prisma.assignment.create({
      data: {
        title: assignmentTitle,
        description: assignmentDescription,
        due_date: new Date(dueDate),
        group: { connect: { id: group.id } },
        programmingProblem: { connect: { id: newProblem.id } }, // 作成した問題に接続
      },
    });

    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('プログラミング課題作成APIエラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}