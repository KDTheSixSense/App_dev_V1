// /app/api/groups/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// グループ一覧を取得
export async function GET() {
  try {
    const groups = await prisma.groups.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { groups_User: true },
        },
      },
    });
    return NextResponse.json(groups);
  } catch (error) {
    console.error('❌ グループ取得エラー:', error);
    return NextResponse.json({ message: 'グループの取得に失敗しました' }, { status: 500 });
  }
}

// 新しいグループを作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupname, body: description } = body;

    if (!groupname) {
      return NextResponse.json({ message: 'グループ名は必須です' }, { status: 400 });
    }

    // TODO: 実際の認証情報からユーザーIDを取得する
    const creatorId = "1"; // 仮の作成者ID

    const newGroup = await prisma.groups.create({
      data: {
        groupname,
        body: description || '',
        groups_User: {
          create: {
            user_id: creatorId as any,
            admin_flg: true,
          },
        },
        invite_code: '', // 招待コードは後で生成するか、別の方法で設定する
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('❌ グループ作成エラー:', error);
    return NextResponse.json({ message: 'グループの作成に失敗しました' }, { status: 500 });
  }
}
