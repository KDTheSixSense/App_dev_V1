import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * お知らせ一覧を取得 (GET) - ページネーション対応
 * @param req NextRequest - クエリパラメータ (page, limit) を含む
 * @param context - ルートパラメータ (hashedId)
 */
export async function GET(req: NextRequest, context: any) {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    // 【重要】context.params は Promise のため await する
    const { hashedId } = await context.params;

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const group = await prisma.groups.findUnique({
      where: { hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    const totalPosts = await prisma.post.count({
      where: { groupId: group.id },
    });

    const posts = await prisma.post.findMany({
      where: { groupId: group.id },
      skip: skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            icon: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: posts,
      meta: {
        total: totalPosts,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });

  } catch (error) {
    console.error('お知らせ取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}