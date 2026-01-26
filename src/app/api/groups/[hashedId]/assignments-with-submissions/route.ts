import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: string; email: string };
}

// 課題と提出状況一覧を取得 (GET)
/**
 * 課題提出状況一覧取得API
 * 
 * 課題とその提出状況を取得します。
 * 管理者は全員分、一般メンバーは自身の提出状況のみ閲覧可能です。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hashedId: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }
  const userId = session.user.id;

  const { hashedId } = await params;

  try {
    const group = await prisma.groups.findUnique({
      where: { hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // Check membership and admin status
    const membership = await prisma.groups_User.findFirst({
      where: { group_id: group.id, user_id: userId },
    });

    if (!membership) {
      return NextResponse.json({ success: false, message: 'グループのメンバーではありません' }, { status: 403 });
    }

    const isAdmin = membership.admin_flg;

    // 課題そのものは全員見れるが、提出物(Submissions)の閲覧権限を制御
    const assignmentsWithSubmissions = await prisma.assignment.findMany({
      where: { groupid: group.id },
      orderBy: { created_at: 'desc' },
      include: {
        Submissions: {
          // Adminなら全員分、Studentなら自分自身の提出のみを取得
          where: isAdmin ? undefined : { userid: userId },
          select: {
            id: true,
            status: true,
            submitted_at: true,
            file_path: true,
            user: {
              select: {
                id: true,
                username: true,
                icon: true,
              },
            },
          },
          orderBy: { submitted_at: 'desc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: assignmentsWithSubmissions });
  } catch (error) {
    console.error('課題状況の取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}