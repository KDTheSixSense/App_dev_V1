// /app/api/groups/[hashedId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GETハンドラの第二引数に正しい型を定義
export async function GET(
  request: NextRequest,
) {
  try {
    // contextオブジェクトから安全にhashedIdを取得
    const hashedId = request.nextUrl.pathname.split('/').pop();

    // パラメータの存在をチェック
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
      include: {
        _count: {
          select: { groups_User: true },
        },
        groups_User:{
          include: {
            user: {
              select: {
                id:true,
                username:true,
                icon : true,
              },
            },
          },
        }
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'グループが見つかりません' },
        { status: 404 }
      );
    }

    // フロントエンドで使いやすいように整形
    const response = {
      id: group.id,
      hashedId: group.hashedId,
      name: group.groupname,
      description: group.body,
      memberCount: group._count?.groups_User || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ グループ詳細取得エラー:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}