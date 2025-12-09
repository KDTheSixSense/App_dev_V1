import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: string; email: string };
}

// お知らせ一覧を取得 (GET)
export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const urlParts = req.url.split('/');
    // URLの構造によってはインデックスが異なる場合がありますが、
    // 通常は .../groups/[hashedId]/posts なので後ろから2番目です
    const hashedId = urlParts[urlParts.length - 2];

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(rawLimit, 50); // Hard cap at 50 to prevent DoS
    const skip = (page - 1) * limit;

    const group = await prisma.groups.findUnique({
      where: { hashedId: hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // Verify membership
    const membership = await prisma.groups_User.findFirst({
      where: { group_id: group.id, user_id: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ success: false, message: 'グループのメンバーではありません' }, { status: 403 });
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { groupId: group.id },
        include: {
          author: {
            select: {
              username: true,
              icon: true, // ★ ここが重要です！アイコンを取得するために追加
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      prisma.post.count({
        where: { groupId: group.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('お知らせ取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// お知らせを投稿 (POST)
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }
  const userId = sessionUserId;

  try {
    const urlParts = req.url.split('/');
    const hashedId = urlParts[urlParts.length - 2];
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

    // Verify membership for POST
    const membership = await prisma.groups_User.findFirst({
      where: { group_id: group.id, user_id: userId as any },
    });

    if (!membership) {
      return NextResponse.json({ success: false, message: 'グループのメンバーではありません。投稿できません。' }, { status: 403 });
    }

    const newPost = await prisma.post.create({
      data: {
        content,
        groupId: group.id,
        authorId: userId as any,
      },
      include: {
        author: {
          select: {
            username: true,
            icon: true // ★ ここも追加しておくと、投稿直後にアイコンが表示されます
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: newPost }, { status: 201 });
  } catch (error) {
    console.error('お知らせ投稿エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}