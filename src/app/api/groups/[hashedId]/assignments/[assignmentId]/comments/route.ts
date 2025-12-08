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

    // Verify assignment belongs to group (Optional but good for strictness)
    // The previous code trusted that if you have assignmentId, you can see comments. 
    // But now we ensured you are in the group "hashedId". 
    // Ideally we should also check if assignmentId belongs to hashedId's group, but 
    // Prisma query `where: { assignmentId }` will verify existence. 
    // If someone calls with assignmentId that is NOT in the group, they will just see comments 
    // for that assignment if they are a member of *that assignment's group*? 
    // Actually, `params.hashedId` is used to check membership. 
    // If I put assignmentId=999 (from Group B) but use hashedId=GroupA (where I am member), 
    // I would pass the membership check.
    // So we MUST check if the assignment belongs to the group.

    const assignmentId = parseInt(params.assignmentId);
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        group: { hashedId: params.hashedId }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or not in this group' }, { status: 404 });
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