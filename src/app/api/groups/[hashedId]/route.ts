// /app/api/groups/[hashedId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { hashedId: string } }
) {
  try {
    const group = await prisma.groups.findUnique({
      where: { 
        hashedId: params.hashedId 
      },
      include: {
        _count: {
          select: { Groups_User: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ message: 'グループが見つかりません' }, { status: 404 });
    }

    // フロントエンドで使いやすいように整形
    const response = {
        id: group.id,
        hashedId: group.hashedId,
        name: group.groupname,
        description: group.body,
        memberCount: group._count?.Groups_User || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ グループ詳細取得エラー:', error);
    return NextResponse.json({ message: 'グループの取得に失敗しました' }, { status: 500 });
  }
}