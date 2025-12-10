export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

const prisma = new PrismaClient();

// セッションデータの型定義
interface SessionData {
  user?: { id: string; email: string };
}

export async function GET() {
  try {
    // 1. セッションを取得 (iron-session)
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 2. Prismaで未提出の課題を検索
    const unsubmittedAssignments = await prisma.assignment.findMany({
      where: {
        // ユーザーが所属しているグループの課題に絞り込む
        group: {
          groups_User: {
            some: {
              user_id: userId,
            },
          },
        },
        // かつ、そのユーザーからの提出記録(Submissions)が存在しない課題に絞り込む
        Submissions: {
          none: {
            userid: userId,
          },
        },
      },
      // レスポンスに含めたい情報を指定
      select: {
        id: true,
        title: true,
        description: true,
        due_date: true,
        group: { // 課題が属するグループの情報も取得
          select: {
            groupname: true,
            hashedId: true,
          },
        },
      },
      orderBy: {
        due_date: 'asc', // 期限が近い順に並び替え
      },
    });

    // 3. フロントエンドが使いやすいようにデータを整形
    const formattedData = unsubmittedAssignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.due_date,
      groupName: assignment.group.groupname,
      groupHashedId: assignment.group.hashedId,
    }));

    return NextResponse.json({ assignments: formattedData }, { status: 200 });

  } catch (error) {
    console.error('未提出課題の取得に失敗しました:', error);
    // JWTの期限切れなどのエラーをハンドリング
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: '認証トークンが無効です' }, { status: 401 });
    }
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}