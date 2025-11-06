import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

async function calculateScore(eventIssueId: number, startedAt: Date, submittedAt: Date): Promise<number> {
  console.log(`[calculateScore] Calculating for eventIssueId: ${eventIssueId}`);
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
  console.log("[calculateScore] Found event difficulty:", eventIssue.problem.eventDifficulty);

  const difficulty = eventIssue.problem.eventDifficulty;
  const timeDiffMinutes = (submittedAt.getTime() - startedAt.getTime()) / (1000 * 60);
  console.log(`[calculateScore] Time difference: ${timeDiffMinutes} minutes`);

  if (timeDiffMinutes < 1) {
    const score = difficulty.basePoints + difficulty.maxBonusPoints;
    console.log(`[calculateScore] Under 1 min, score: ${score}`);
    return score;
  }

  if (timeDiffMinutes >= difficulty.expectedTimeMinutes) {
    console.log(`[calculateScore] Over expected time, score: ${difficulty.basePoints}`);
    return difficulty.basePoints;
  }

  const bonusPoints = Math.max(
    0,
    difficulty.maxBonusPoints - Math.floor(timeDiffMinutes - 1) * difficulty.bonusPointsPerMinute
  );
  const finalScore = difficulty.basePoints + bonusPoints;
  console.log(`[calculateScore] Calculated bonus: ${bonusPoints}, Final score: ${finalScore}`);

  return finalScore;
}

async function updateTotalScore(userId: number, eventId: number) {
    console.log(`[updateTotalScore] Updating total score for userId: ${userId}, eventId: ${eventId}`);
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
    console.log(`[updateTotalScore] Found ${submissions.length} submissions.`);
  
    const totalScore = submissions.reduce((acc, submission) => acc + submission.score, 0);
    console.log(`[updateTotalScore] New total score: ${totalScore}`);
  
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
    console.log(`[updateTotalScore] Successfully updated event_getpoint.`);
  }

export async function POST(req: NextRequest) {
  console.log('\n--- [API] Event Submission POST request received ---');
  const session = await getSession();
  if (!session?.user?.id) {
    console.error('[API] Unauthorized access attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { eventIssueId, codeLog, status, startedAt } = body;
    console.log('[API] Request Body:', { eventIssueId, status, startedAt, codeLog: codeLog.substring(0, 100) + '...' });

    const userId = session.user.id;
    const submittedAt = new Date();

    if (isNaN(userId)) {
      console.error('[API] Invalid user ID in session.');
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    console.log(`[API] Processing for userId: ${userId}`);

    const score = await calculateScore(eventIssueId, new Date(startedAt), submittedAt);
    console.log(`[API] Score calculated: ${score}`);

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
    console.log(`[API] Existing submission found:`, existingSubmission ? `id: ${existingSubmission.id}`: 'null');

    if (existingSubmission && existingSubmission.status === true) {
      console.log('[API] User has already correctly answered this problem. Preventing score update.');
      return NextResponse.json({ 
        ...existingSubmission,
        message: 'すでに正解済みです。' 
      });
    }

    let submission;
    if (existingSubmission) {
      console.log('[API] Updating existing submission...');
      submission = await prisma.event_Submission.update({
        where: {
          id: existingSubmission.id,
        },
        data: {
          codeLog,
          status,
          score,
          submittedAt,
        },
        include: {
            eventIssue: true,
        }
      });
    } else {
      console.log('[API] Creating new submission...');
      submission = await prisma.event_Submission.create({
        data: {
          userId,
          eventIssueId,
          codeLog,
          status,
          score,
          startedAt: new Date(startedAt),
          submittedAt,
        },
        include: {
            eventIssue: true,
        }
      });
    }
    console.log('[API] Submission saved successfully:', submission);

    if (submission) {
        await updateTotalScore(userId, submission.eventIssue.eventId);
    }

    console.log('--- [API] Event Submission POST request finished ---');
    return NextResponse.json(submission);

  } catch (error) {
    console.error('--- [API] Error in Event Submission POST request ---', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}