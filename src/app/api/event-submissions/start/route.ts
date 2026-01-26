import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';

/**
 * イベント問題の解答開始を記録するAPI
 * ユーザーが問題ページを開いたときに呼び出される
 */
/**
 * イベント課題開始記録API
 * 
 * ユーザーがイベント課題を開始した時刻を記録します。
 * スコア計算（時間ボーナス）に使用されます。
 */
export async function POST(request: Request) {
  try {
    const session = await getAppSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await await request.json();
    const { eventIssueId, language } = body;

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

    if (existingSubmission) {
      // 既に記録がある場合は、言語設定のみ更新する (解答中の言語変更を反映)
      if (language && existingSubmission.language !== language) {
        await prisma.event_Submission.update({
          where: { id: existingSubmission.id },
          data: { language: language },
        });
      }
    } else {
      // 記録がまだない場合、新しいレコードを作成
      await prisma.event_Submission.create({
        data: {
          userId: userId,
          eventIssueId: eventIssueId,
          status: null, // null = 挑戦中/未判定
          score: 0,
          language: language || 'python', // 指定がなければデフォルト
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
