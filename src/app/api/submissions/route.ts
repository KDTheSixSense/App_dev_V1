import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

// SessionData型をローカルで定義
interface SessionData {
  user?: { id: number | string; email: string };
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id;

  if (!userId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { assignmentId, status, description, codingId } = body;

    if (!assignmentId) {
      return NextResponse.json({ success: false, message: '課題IDが必要です' }, { status: 400 });
    }

    const submission = await prisma.submissions.create({
      data: {
        assignment_id: Number(assignmentId),
        userid: Number(userId),
        status: status || '提出済み',
        description: description || '',
        codingid: codingId ? Number(codingId) : 0, // codingidがない場合も考慮
        submitted_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: submission }, { status: 201 });

  } catch (error) {
    console.error('提出APIエラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}