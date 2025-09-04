import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

// --- ▼▼▼ セッションの型定義を追加します ▼▼▼ ---
interface SessionData {
  user?: { id: number; email: string };
}

/**
 * グループの詳細情報を取得する (GET)
 * 招待コード(invite_code)も一緒に返します。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hashedId: string } } // Next.js 13+ の標準的な引数の書き方
) {
  // --- ▼▼▼ 認証チェックを追加します ▼▼▼ ---
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    // 認証されていない場合はエラーを返す
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const { hashedId } = params; // Next.js 13+ では context の代わりに params から取得します

    if (!hashedId) {
      return NextResponse.json(
        { message: 'IDが指定されていません' },
        { status: 400 }
      );
    }

    const group = await prisma.groups.findUnique({
      where: {
        hashedId: hashedId,
      },
      // --- ▼▼▼ include から select に変更し、取得するデータを明示します ▼▼▼ ---
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

    // --- ▼▼▼ フロントエンドで使いやすいように整形し、invite_code を含めます ▼▼▼ ---
    const formattedGroup = {
      id: group.id,
      hashedId: group.hashedId,
      name: group.groupname,
      description: group.body,
      memberCount: group._count?.groups_User || 0,
      invite_code: group.invite_code, // ★ これが一番重要です
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
