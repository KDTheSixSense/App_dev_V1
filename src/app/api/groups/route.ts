// /app/api/groups/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';

// グループ一覧を取得
/**
 * グループ一覧取得API
 * 
 * システム内の全グループを取得します（おそらく管理者用またはデバッグ用?）。
 * 通常はユーザーが所属するグループのみを取得するAPIが別途必要かもしれません。
 */
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
/**
 * グループ作成API
 * 
 * 新しいグループを作成し、作成者を管理として登録します。
 * 招待コードも自動生成されます。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupname, body: description } = body;

    if (!groupname) {
      return NextResponse.json({ message: 'グループ名は必須です' }, { status: 400 });
    }

    const session = await getAppSession();
    if (!session?.user?.id) {
      return NextResponse.json({ message: '認証されていません' }, { status: 401 });
    }
    const creatorId = session.user.id;

    // 招待コードの生成 (ユニークな8桁の英数字)
    const { nanoid } = await import('nanoid');
    const invite_code = nanoid(8);

    const newGroup = await prisma.groups.create({
      data: {
        groupname,
        body: description || '',
        groups_User: {
          create: {
            user_id: creatorId,
            admin_flg: true,
          },
        },
        invite_code: invite_code,
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('❌ グループ作成エラー:', error);
    return NextResponse.json({ message: 'グループの作成に失敗しました' }, { status: 500 });
  }
}
