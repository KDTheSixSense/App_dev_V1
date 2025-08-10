// /app/api/groups/[hashedId]/assignments/route.ts (新規作成)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: number; email: string };
}

// 課題一覧を取得 (GET)
export async function GET(req: NextRequest, { params }: { params: { hashedId: string } }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const group = await prisma.groups.findUnique({
      where: { hashedId: params.hashedId },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

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
  // session.user.id は string の可能性があるため、ここで直接使わない
  const sessionUserId = session.user?.id;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }
  
  // ✨【修正】IDを数値に変換する
  const userId = Number(sessionUserId);

  try {
    const body = await req.json();
    const { title, description, dueDate } = body;

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

    // ユーザーが管理者がどうかをチェック (数値に変換したuserIdを使用)
    const membership = await prisma.groups_User.findUnique({
      where: {
        group_id_user_id: { group_id: group.id, user_id: userId }, // 👈 ここで数値のIDを使う
      },
    });

    if (!membership?.admin_flg) {
      return NextResponse.json({ success: false, message: '権限がありません' }, { status: 403 });
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        title,
        description,
        due_date: new Date(dueDate),
        groupid: group.id,
      },
    });

    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('課題作成エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}