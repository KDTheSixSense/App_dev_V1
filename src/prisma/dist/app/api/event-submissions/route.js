"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const session_1 = require("@/lib/session");
const prisma = new client_1.PrismaClient();
async function calculateScore(eventIssueId, startedAt, submittedAt) {
    var _a;
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
    if (!((_a = eventIssue === null || eventIssue === void 0 ? void 0 : eventIssue.problem) === null || _a === void 0 ? void 0 : _a.eventDifficulty)) {
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
    const bonusPoints = Math.max(0, difficulty.maxBonusPoints - Math.floor(timeDiffMinutes - 1) * difficulty.bonusPointsPerMinute);
    const finalScore = difficulty.basePoints + bonusPoints;
    console.log(`[calculateScore] Calculated bonus: ${bonusPoints}, Final score: ${finalScore}`);
    return finalScore;
}
async function updateTotalScore(userId, eventId) {
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
async function POST(req) {
    var _a;
    console.log('\n--- [API] Event Submission POST request received ---');
    const session = await (0, session_1.getSession)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        console.error('[API] Unauthorized access attempt.');
        return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await req.json();
        const { eventIssueId, codeLog, status, startedAt } = body;
        console.log('[API] Request Body:', { eventIssueId, status, startedAt, codeLog: codeLog.substring(0, 100) + '...' });
        const userId = session.user.id;
        const submittedAt = new Date();
        if (isNaN(userId)) {
            console.error('[API] Invalid user ID in session.');
            return server_1.NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
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
        console.log(`[API] Existing submission found:`, existingSubmission ? `id: ${existingSubmission.id}` : 'null');
        if (existingSubmission && existingSubmission.status === true) {
            console.log('[API] User has already correctly answered this problem. Preventing score update.');
            return server_1.NextResponse.json(Object.assign(Object.assign({}, existingSubmission), { message: 'すでに正解済みです。' }));
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
        }
        else {
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
        return server_1.NextResponse.json(submission);
    }
    catch (error) {
        console.error('--- [API] Error in Event Submission POST request ---', error);
        return server_1.NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
