import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session.server';
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

    // startedAt のバリデーション
    const startDate = new Date(startedAt);
    const validStartedAt = isNaN(startDate.getTime()) ? new Date() : startDate;

    let calcedScore = 0;
    if (isSuccess) {
      const rawScore = await calculateScore(eventIssueId, validStartedAt, submittedAt);
      calcedScore = isNaN(rawScore) ? 0 : Math.floor(rawScore || 0);
    }
    const score = calcedScore;

    // console.log(`[API] Execution Result: Success=${isSuccess}, Score=${score}`);

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

    if (existingSubmission && existingSubmission.status === true) {
      return NextResponse.json({
        ...existingSubmission,
        message: 'すでに正解済みです。',
        testCaseResults: executionResult.testCaseResults,
        success: isSuccess
      });
    }

    let submission;
    if (existingSubmission) {
      submission = await prisma.event_Submission.update({
        where: {
          id: existingSubmission.id,
        },
        data: {
          codeLog,
          status: isSuccess,
          score: score, // Explicitly assign validated score
          submittedAt,
        },
        include: {
          eventIssue: true,
        }
      });
    } else {
      submission = await prisma.event_Submission.create({
        data: {
          userId,
          eventIssueId,
          codeLog,
          status: isSuccess,
          score: score,
          startedAt: validStartedAt,
          submittedAt,
        },
        include: {
          eventIssue: true,
        }
      });
    }

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
