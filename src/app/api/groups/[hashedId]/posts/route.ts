import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session'; // 修正: 独自に作成したgetSessionを使用

// お知らせ一覧を取得 (GET)
export async function GET(req: NextRequest, { params }: { params: { hashedId: string } }) {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const { hashedId } = params;

    const group = await prisma.groups.findUnique({
      where: { hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    const posts = await prisma.post.findMany({
      where: { groupId: group.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: posts });

  } catch (error) {
    console.error('お知らせ取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// お知らせを投稿 (POST)
export async function POST(req: NextRequest, { params }: { params: { hashedId: string } }) {
  const session = await getSession();
  const userId = session.user?.id;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const { hashedId } = params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ success: false, message: '投稿内容がありません' }, { status: 400 });
    }

    const group = await prisma.groups.findUnique({
      where: { hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // ★ 追加: 投稿者がグループのメンバーかどうかを確認する
    const membership = await prisma.groups_User.findUnique({
      where: {
        group_id_user_id: {
          group_id: group.id,
          user_id: userId,
        },
      },
    });

    if (!membership) {
       return NextResponse.json({ success: false, message: 'このグループに投稿する権限がありません' }, { status: 403 });
    }
    // ここでさらに membership.admin_flg をチェックすれば管理者のみに投稿を制限できます

    const newPost = await prisma.post.create({
      data: {
        content,
        groupId: group.id,
        authorId: userId,
      },
      include: {
        author: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: newPost }, { status: 201 });
  } catch (error) {
    console.error('お知らせ投稿エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}