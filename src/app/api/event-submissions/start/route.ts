import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';

/**
 * イベント問題の解答開始を記録するAPI
 * ユーザーが問題ページを開いたときに呼び出される
 */
export async function POST(request: Request) {
  try {
    const session = await getAppSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    const userId = Number(session.user.id);

    const body = await await request.json();
    const { eventIssueId } = body;

    if (!eventIssueId) {
      return NextResponse.json({ error: '問題IDが必要です' }, { status: 400 });
    }

    // 既にこの問題に対する提出/解答開始記録があるか確認
    const existingSubmission = await prisma.event_Submission.findFirst({
      where: {
        userId: userId,
        eventIssueId: eventIssueId,
      },
    });

    // 記録がまだない場合のみ、新しいレコードを作成
    if (!existingSubmission) {
      await prisma.event_Submission.create({
        data: {
          userId: userId,
          eventIssueId: eventIssueId,
          status: false, // status: 'started' のような状態がないため、不正解として記録
          score: 0,
          codeLog: '// 解答開始',
          startedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ message: '解答開始を記録しました' }, { status: 200 });
  } catch (error) {
    console.error('解答開始時刻の記録エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
