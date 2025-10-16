// /app/api/groups/[hashedId]/assignments/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Prismaの型をインポート
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: number | string; email: string; username?: string | null };
}

// 課題一覧を取得 (GET)
export async function GET(req: NextRequest, context: any) {
  const { params } = context;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

    const hashedId = params.hashedId;

    if (!hashedId) {
        return NextResponse.json({ success: false, message: 'Invalid group ID format.' }, { status: 400 });
    }

    try {
      const group = await prisma.groups.findUnique({
        where: { hashedId },
      select: { id: true },
      });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }
      
    const assignments = await prisma.assignment.findMany({
      where: { groupid: group.id },
      orderBy: { created_at: 'desc' },
      // Use `select` to be explicit about the fields, preventing Prisma
      // from trying to access columns that might not exist in the DB.
      select: {
        id: true,
        title: true,
        description: true,
        due_date: true,
        created_at: true,
        updated_at: true,
        programmingProblemId: true,
        selectProblemId: true,
        // Include the related records
        programmingProblem: true,
        selectProblem: true,
        // Add the group relation to the select clause
        group: true,
        Submissions: {
          select: { id: true },
        }
      }
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error('課題取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// 課題を作成 (POST)
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
    const { title, description, dueDate, programmingProblemId, selectProblemId } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ success: false, message: 'タイトルと期日は必須です。' }, { status: 400 });
    }
    if (!programmingProblemId && !selectProblemId) {
      return NextResponse.json({ success: false, message: '課題となる問題が指定されていません。' }, { status: 400 });
    }

    const hashedId = params.hashedId;
    if (typeof hashedId !== 'string') {
      return NextResponse.json({ success: false, message: '無効なグループIDです。' }, { status: 400 });
    }

    const group = await prisma.groups.findUnique({ where: { hashedId: hashedId } });
    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // ユーザーが管理者かどうかのチェック
    const membership = await prisma.groups_User.findFirst({
      where: {
        group_id: group.id,
        user_id: userId,
        admin_flg: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ success: false, message: 'この操作を行う権限がありません' }, { status: 403 });
    }

    const newAssignment = await prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.assignment.create({
        data: {
          title,
          description,
          due_date: new Date(dueDate), // due_dateをDateオブジェクトに変換
          group: { connect: { id: group.id } },
          // IDが存在する場合のみ、それぞれの問題と接続
          ...(programmingProblemId && { programmingProblem: { connect: { id: Number(programmingProblemId) } } }),
          ...(selectProblemId && { selectProblem: { connect: { id: Number(selectProblemId) } } }),
        },
      });

      return createdAssignment;
    });

    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('課題作成APIエラー:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      // 外部キー制約違反
      if (error.meta?.field_name === 'Assignment_programmingProblemId_fkey') {
        return NextResponse.json({ success: false, message: '指定されたプログラミング問題が見つかりません。' }, { status: 404 });
      }
      if (error.meta?.field_name === 'Assignment_selectProblemId_fkey') {
        return NextResponse.json({ success: false, message: '指定された選択問題が見つかりません。' }, { status: 404 });
      }
    }
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}