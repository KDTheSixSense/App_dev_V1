// /app/api/groups/[hashedId]/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client'; // Prismaの型をインポート

interface SessionData {
  user?: { id: number; email: string };
}

// 課題一覧を取得 (GET)
export async function GET(req: NextRequest, { params }: { params: { hashedId: string } }) {
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
        select: {
          id: true,
          hashedId: true,
          groupname: true,
          body: true,
          invite_code: true, // ★ 招待コードをデータベースから取得
          _count: {
              select: { groups_User: true }
          }
        }
      });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    const formattedGroup = {
      id: group.id,
      hashedId: group.hashedId,
      name: group.groupname,
      description: group.body,
      memberCount: group._count.groups_User,
      invite_code: group.invite_code, // ★ 招待コードをレスポンスに含める
    };
      
    const assignments = await prisma.assignment.findMany({
      where: { groupid: group.id },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error('課題取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// 課題を作成 (POST)
export async function POST(req: NextRequest, { params }: { params: { hashedId: string } }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }
  
  const userId = Number(sessionUserId);

  try {
    const body = await req.json();
    const { title, description, dueDate, programmingProblemId } = body;

    if (!title || !description || !dueDate) {
      return NextResponse.json({ success: false, message: '必須項目が不足しています' }, { status: 400 });
    }

    const group = await prisma.groups.findUnique({
      where: { hashedId: params.hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    const membership = await prisma.groups_User.findUnique({
      where: {
        group_id_user_id: { group_id: group.id, user_id: userId },
      },
    });

    if (!membership?.admin_flg) {
      return NextResponse.json({ success: false, message: '権限がありません' }, { status: 403 });
    }
    
    // Prismaに渡すデータオブジェクトを構築
    const dataToCreate: Prisma.AssignmentCreateInput = {
        title,
        description,
        due_date: new Date(dueDate),
        group: {
            connect: { id: group.id }
        },
    };

    // もし programmingProblemId がリクエストに含まれていれば、リレーションを接続
    if (programmingProblemId) {
        dataToCreate.programmingProblem = {
            connect: { id: Number(programmingProblemId) }
        };
    }

    const newAssignment = await prisma.assignment.create({
      data: dataToCreate,
    });

    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('課題作成エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}