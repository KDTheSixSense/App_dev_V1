// /app/api/posts/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // シングルトンインスタンスをインポート
import { Prisma } from '@prisma/client';
import { getAppSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, groupId } = body;

    // --- バリデーション ---
    if (!content || !groupId) {
      return NextResponse.json({ message: '投稿内容とグループIDは必須です' }, { status: 400 });
    }

    // 認証チェック
    const session = await getAppSession();
    if (!session?.user?.id) {
      return NextResponse.json({ message: '認証されていません' }, { status: 401 });
    }
    const authorId = session.user.id;

    const newPost = await prisma.post.create({
      data: {
        content,
        groupId: Number(groupId),
        authorId: authorId,
      },
    });

    return NextResponse.json({ message: '投稿に成功しました', post: newPost }, { status: 201 });

  } catch (error) {
    console.error('❌ 投稿APIエラー:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ message: 'データベースエラー', error: error.code }, { status: 500 });
    }
    return NextResponse.json({ message: 'サーバー内部エラー' }, { status: 500 });
  }
}
