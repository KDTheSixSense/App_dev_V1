// app/api/groups/[hashedId]/assignments/[assignmentId]/comments/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { z } from 'zod';

interface SessionData {
  user?: {
    id: string;
  };
}

export async function GET(
  request: Request,
  { params }: { params: { hashedId: string, assignmentId: string } }
) {
  try {
    const assignmentId = parseInt(params.assignmentId);
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }

    const comments = await prisma.assignmentComment.findMany({
      where: { assignmentId },
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
        createdAt: 'asc',
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { hashedId: string, assignmentId: string } }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }
  const authorId = Number(session.user.id);

  try {
    const assignmentId = parseInt(params.assignmentId);
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }
    
    // ユーザーがグループのメンバーであるかを確認
    const groupMember = await prisma.groups_User.findFirst({
      where: { group: { hashedId: params.hashedId }, user_id: authorId },
    });

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newComment = await prisma.assignmentComment.create({
      data: {
        content: content.trim(),
        assignmentId: assignmentId,
        authorId: authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            icon: true,
          },
        },
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}