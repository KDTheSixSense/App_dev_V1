// /app/api/groups/[hashedId]/posts/route.ts (新規作成)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: number; email: string };
}

// お知らせ一覧を取得 (GET)
export async function GET(req: NextRequest, { params }: { params: { hashedId: string } }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const { hashedId } = params;
    // hashedIdからグループのIDを取得
    const group = await prisma.groups.findUnique({
      where: { hashedId: hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // グループIDに紐づく投稿を、投稿者情報を含めて取得
    const posts = await prisma.post.findMany({
      where: { groupId: group.id },
      include: {
        author: { // 投稿者の情報（Userモデル）を連結
          select: {
            username: true, // ユーザー名だけ取得
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // 新しい順に並び替え
      },
    });

    return NextResponse.json({ success: true, data: posts });

  } catch (error) {
    console.error('お知らせ取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// ✨【ここから追加】お知らせを投稿 (POST)
export async function POST(req: NextRequest, { params }: { params: { hashedId: string } }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;
  
  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }
  const userId = Number(sessionUserId);

  try {
    const { hashedId } = params;
    const body = await req.json();
    const { content } = body;

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

    // (オプション) 管理者のみ投稿可能にする場合は、ここで権限チェックを追加
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