import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getSession } from '@/lib/session';
import { executeAgainstTestCases } from '@/lib/sandbox';

const prisma = new PrismaClient();

async function calculateScore(eventIssueId: number, startedAt: Date, submittedAt: Date): Promise<number> {
  // // console.log(`[calculateScore] Calculating for eventIssueId: ${eventIssueId}`);
  // ... logs removed for security/performance

  const eventIssue = await prisma.event_Issue_List.findUnique({
    where: { id: eventIssueId },
    include: {
      problem: {
        include: {
          eventDifficulty: true,
        },
      },
    },
  });

  if (!eventIssue?.problem?.eventDifficulty) {
    console.error("[calculateScore] Event difficulty not found for this problem.");
    return 0;
  }
  // console.log("[calculateScore] Found event difficulty:", eventIssue.problem.eventDifficulty);

  const difficulty = eventIssue.problem.eventDifficulty;
  const timeDiffMinutes = (submittedAt.getTime() - startedAt.getTime()) / (1000 * 60);
  // console.log(`[calculateScore] Time difference: ${timeDiffMinutes} minutes`);

  if (timeDiffMinutes < 1) {
    const score = difficulty.basePoints + difficulty.maxBonusPoints;
    // console.log(`[calculateScore] Under 1 min, score: ${score}`);
    return score;
  }

  if (timeDiffMinutes >= difficulty.expectedTimeMinutes) {
    // console.log(`[calculateScore] Over expected time, score: ${difficulty.basePoints}`);
    return difficulty.basePoints;
  }

  const bonusPoints = Math.max(
    0,
    difficulty.maxBonusPoints - Math.floor(timeDiffMinutes - 1) * difficulty.bonusPointsPerMinute
  );
  const finalScore = difficulty.basePoints + bonusPoints;
  // console.log(`[calculateScore] Calculated bonus: ${bonusPoints}, Final score: ${finalScore}`);

  return finalScore;
}

async function updateTotalScore(userId: string, eventId: number) {
  // console.log(`[updateTotalScore] Updating total score for userId: ${userId}, eventId: ${eventId}`);
  const submissions = await prisma.event_Submission.findMany({
    where: {
      userId: userId,
      eventIssue: {
        eventId: eventId,
      },
    },
    select: {
      score: true,
    },
  });
  // console.log(`[updateTotalScore] Found ${submissions.length} submissions.`);

  const totalScore = submissions.reduce((acc, submission) => acc + submission.score, 0);
  // console.log(`[updateTotalScore] New total score: ${totalScore}`);

  await prisma.event_Participants.update({
    where: {
      eventId_userId_unique: {
        eventId: eventId,
        userId: userId,
      },
    },
    data: {
      event_getpoint: totalScore,
    },
  });
  // console.log(`[updateTotalScore] Successfully updated event_getpoint.`);
}

/**
 * イベント課題提出API
 * 
 * イベント内の課題に対する解答コードを受け取ります。
 * サンドボックス環境でコードを実行・テストし、正誤判定とスコア計算を行います。
 * 合計スコアの更新も行います。
 */
export async function POST(req: NextRequest) {
  // console.log('\n--- [API] Event Submission POST request received ---');
  const session = await getSession();
  if (!session?.user?.id) {
    console.error('[API] Unauthorized access attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { eventIssueId, codeLog, startedAt, language } = body;
    // statusはクライアントから受け取らず、サーバー側で判定する
    // console.log('[API] Request Body:', { eventIssueId, startedAt, language, codeLog: codeLog.substring(0, 100) + '...' });

    const userId = session.user.id;
    const submittedAt = new Date();

    if (!userId) {
      console.error('[API] Invalid user ID in session.');
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // 1. 問題IDを取得
    const eventIssue = await prisma.event_Issue_List.findUnique({
      where: { id: eventIssueId },
    });

    if (!eventIssue) {
      return NextResponse.json({ error: 'Event Issue not found' }, { status: 404 });
    }

    // 2. サーバーサイドでコードを実行・検証
    const executionResult = await executeAgainstTestCases(
      language || 'python',
      codeLog,
      eventIssue.problemId
    );

    const isSuccess = executionResult.success ?? false;

    // 3. 既存の提出状況を確認 (開始時刻の取得のため)
    const existingSubmission = await prisma.event_Submission.findUnique({
      where: {
        userId_eventIssueId: {
          userId,
          eventIssueId,
        },
      },
      include: {
        eventIssue: true,
      },
    });

    // startedAt のバリデーション (DBに保存された開始時刻を優先)
    let validStartedAt: Date;
    if (existingSubmission?.startedAt) {
      validStartedAt = existingSubmission.startedAt;
      // console.log(`[API] Using server-side startedAt: ${validStartedAt}`);
    } else {
      // フォールバック: DBにない場合はリクエスト値または現在時刻
      const startDate = new Date(startedAt);
      validStartedAt = isNaN(startDate.getTime()) ? new Date() : startDate;
      // console.log(`[API] Using client-side/fallback startedAt: ${validStartedAt}`);
    }

    let calcedScore = 0;
    if (isSuccess) {
      const rawScore = await calculateScore(eventIssueId, validStartedAt, submittedAt);
      calcedScore = isNaN(rawScore) ? 0 : Math.floor(rawScore || 0);
    }
    const score = calcedScore;

    // console.log(`[API] Execution Result: Success=${isSuccess}, Score=${score}`);

    if (existingSubmission && existingSubmission.status === true) {
      return NextResponse.json({
        ...existingSubmission,
        message: 'すでに正解済みです。',
        testCaseResults: executionResult.testCaseResults,
        success: isSuccess
      });
    }

    // Use implicit typing to avoid mismatches
    const submission = existingSubmission
      ? await prisma.event_Submission.update({
        where: {
          id: existingSubmission.id,
        },
        data: {
          codeLog,
          status: isSuccess,
          score: score,
          submittedAt,
          language: language || 'python',
          // Cast data to any to bypass stale Prisma types missing testCaseResults
          testCaseResults: executionResult.testCaseResults,
        } as any,
        include: {
          eventIssue: true,
        }
      })
      : await prisma.event_Submission.create({
        data: {
          userId,
          eventIssueId,
          codeLog,
          status: isSuccess,
          score: score,
          submittedAt,
          language: language || 'python',
          // Cast data to any to bypass stale Prisma types missing testCaseResults
          testCaseResults: executionResult.testCaseResults,
        } as any,
        include: {
          eventIssue: true,
        }
      });

    if (submission && isSuccess) {
      await updateTotalScore(userId, submission.eventIssue.eventId);
    }

    return NextResponse.json({
      ...submission,
      testCaseResults: executionResult.testCaseResults,
      success: isSuccess,
      message: executionResult.message
    });

  } catch (error) {
    console.error('--- [API] Error in Event Submission POST request ---', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
