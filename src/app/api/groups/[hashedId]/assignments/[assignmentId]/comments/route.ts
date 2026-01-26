// app/api/groups/[hashedId]/assignments/[assignmentId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
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

/**
 * 課題コメント取得API
 * 
 * 指定された課題に対するコメント一覧を取得します。
 * グループメンバーのみアクセス可能です。
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ hashedId: string, assignmentId: string }> }
) {
  const params = await context.params;
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Verify group membership
    const groupMember = await prisma.groups_User.findFirst({
      where: {
        group: { hashedId: params.hashedId },
        user_id: userId
      },
    });

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assignmentId = parseInt(params.assignmentId);
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: {
        id: assignmentId,
      },
      include: {
        group: {
          select: { hashedId: true }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: `Assignment ${assignmentId} not found` }, { status: 404 });
    }

    if (assignment.group?.hashedId !== params.hashedId) {
      return NextResponse.json({ error: `Assignment found but belongs to different group` }, { status: 404 });
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

/**
 * 課題コメント投稿API
 * 
 * 課題に対して新しいコメントを投稿します。
 * グループと課題の整合性チェックを行います。
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ hashedId: string, assignmentId: string }> }
) {
  const params = await context.params;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }
  const authorId = session.user.id;

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

    // Explicitly check assignment existence and group match for POST too
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { group: { select: { hashedId: true } } }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.group?.hashedId !== params.hashedId) {
      return NextResponse.json({ error: 'Assignment group mismatch' }, { status: 404 });
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