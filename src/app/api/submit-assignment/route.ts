import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { submitAssignment } from '@/lib/actions/assignmentActions';

interface CustomSession {
  user?: { id?: number | string; email: string };
}

export async function POST(request: NextRequest) {
  const session = await getIronSession<CustomSession>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = Number(session.user.id);
    const assignmentId = request.nextUrl.searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ message: 'assignmentId is required' }, { status: 400 });
    }
    
    const formData = await request.formData();

    const result = await submitAssignment(userId, assignmentId, formData);

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
  } catch (error) {
    console.error('課題提出APIエラー:', error);
    // This top-level catch is for unexpected errors during session handling or form parsing.
    return NextResponse.json({ message: 'リクエスト処理中に予期せぬエラーが発生しました。' }, { status: 500 });
  }
}
