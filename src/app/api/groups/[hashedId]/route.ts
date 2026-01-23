import { NextRequest, NextResponse } from 'next/server';
import { groupParamsSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

// セッションデータの型定義
interface SessionData {
  user?: { id: string; email: string };
}

/**
 * グループの詳細情報を取得する (GET)
 * 招待コード(invite_code)も一緒に返します。
 */
/**
 * グループ詳細取得API
 * 
 * グループの詳細情報（名前、説明、招待コードなど）を取得します。
 * メンバーシップの確認を行います。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hashedId: string }> } // params is now a Promise in Next.js 15+
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    // 認証されていない場合はエラーを返す
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const { hashedId } = await params;

    const validation = groupParamsSchema.safeParse({ hashedId });
    if (!validation.success) {
      return NextResponse.json({ message: '無効なID形式です' }, { status: 400 });
    }

    const group = await prisma.groups.findUnique({
      where: {
        hashedId: hashedId,
      },
      select: {
        id: true,
        hashedId: true,
        groupname: true,
        body: true,
        invite_code: true, // ★ これが一番重要です
        _count: {
          select: { groups_User: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'グループが見つかりません' },
        { status: 404 }
      );
    }

    // ★ IDOR対策: ユーザーがこのグループのメンバーかどうかを確認
    const isMember = await prisma.groups_User.findUnique({
      where: {
        group_id_user_id: {
          group_id: group.id,
          user_id: session.user!.id,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { message: 'このグループにアクセスする権限がありません' },
        { status: 403 }
      );
    }

    const formattedGroup = {
      id: group.id,
      hashedId: group.hashedId,
      name: group.groupname,
      description: group.body,
      memberCount: group._count?.groups_User || 0,
      invite_code: group.invite_code,
    };

    return NextResponse.json(formattedGroup);

  } catch (error) {
    console.error('❌ グループ詳細取得エラー:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}