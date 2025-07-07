// /app/api/groups/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// グループ一覧を取得
export async function GET() {
  try {
    const groups = await prisma.groups.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { Groups_User: true },
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
    const creatorId = 1; // 仮の作成者ID

    const newGroup = await prisma.groups.create({
      data: {
        groupname,
        body: description || '',
        Groups_User: {
          create: {
            user_id: creatorId,
            admin_flg: true,
          },
        },
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('❌ グループ作成エラー:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ message: 'そのグループ名は既に使用されています' }, { status: 409 });
    }
    return NextResponse.json({ message: 'グループの作成に失敗しました' }, { status: 500 });
  }
}
