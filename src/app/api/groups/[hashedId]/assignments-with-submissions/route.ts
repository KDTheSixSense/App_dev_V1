import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getIronSession } from 'iron-session';
// import { sessionOptions } from '@/lib/session';
// import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: number; email: string };
}

// 課題と提出状況一覧を取得 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hashedId: string }> }
) {
  // const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  // if (!session.user?.id) {
  //   return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  // }

  const { hashedId } = await params;

  try {
    const group = await prisma.groups.findUnique({
      where: { hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // 課題とその課題に対する提出状況を全て取得
    const assignmentsWithSubmissions = await prisma.assignment.findMany({
      where: { groupid: group.id },
      orderBy: { due_date: 'asc' },
      include: {
        // 各課題に紐づく提出状況を全て取得
        Submissions: {
          orderBy: { submitted_at: 'desc' },
          include: {
            // 提出したユーザーの情報も一緒に取得
            user: {
              select: {
                id: true,
                username: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: assignmentsWithSubmissions });
  } catch (error) {
    console.error('課題状況の取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}