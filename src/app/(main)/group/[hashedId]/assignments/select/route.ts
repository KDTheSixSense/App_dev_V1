// /app/(main)/group/[hashedId]/assignments/select/route.ts (新規作成)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: number | string; email: string };
}

export async function POST(req: NextRequest, context: any) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;
  const { params } = context;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const body = await req.json();
    // フロントエンドから送られてくるデータ構造を想定
    const { assignmentTitle, assignmentDescription, dueDate, problemData } = body;

    const hashedId = params.hashedId;
    if (typeof hashedId !== 'string') {
      return NextResponse.json({ success: false, message: '無効なグループIDです。' }, { status: 400 });
    }

    const newAssignment = await prisma.$transaction(async (tx) => {
      // グループの存在と管理者の権限をチェック
      const group = await tx.groups.findUnique({
        where: { hashedId: hashedId },
      });
      if (!group) {
        throw new Error('グループが見つかりません');
      }

      const userId = Number(sessionUserId);
      const membership = await tx.groups_User.findFirst({
        where: {
          group_id: group.id,
          user_id: userId,
          admin_flg: true,
        },
      });

      if (!membership) {
        throw new Error('この操作を行う権限がありません');
      }

      // 1. 4択問題 (SelectProblem) を作成
      const newProblem = await tx.selectProblem.create({
        data: {
          title: problemData.title,
          description: problemData.description,
          explanation: problemData.explanation,
          answerOptions: problemData.answerOptions || {}, // JSON形式
          correctAnswer: problemData.correctAnswer,
          difficulty: { connect: { id: Number(problemData.difficultyId) } },
          subject: { connect: { id: Number(problemData.subjectId) } },
          creator: { connect: { id: userId } },
        },
      });

      // 2. 課題 (Assignment) を作成し、作成した4択問題と紐付ける
      const createdAssignment = await tx.assignment.create({
        data: {
          title: assignmentTitle,
          description: assignmentDescription,
          due_date: new Date(dueDate),
          group: { connect: { id: group.id } },
          // ★★★ ここで `selectProblem` に接続します ★★★
          selectProblem: { connect: { id: newProblem.id } },
        },
        // レスポンスにselectProblemを含める
        include: {
          selectProblem: true,
        },
      });

      return createdAssignment;
    });

    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('4択問題課題作成APIエラー:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
        if (error.message === 'グループが見つかりません') {
            return NextResponse.json({ success: false, message: error.message }, { status: 404 });
        }
        if (error.message === 'この操作を行う権限がありません') {
            return NextResponse.json({ success: false, message: error.message }, { status: 403 });
        }
    }
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}