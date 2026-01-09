'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { getNowJST, isSameAppDay } from '@/lib/dateUtils'; // Fixed path
import type { Problem as SerializableProblem } from '@/lib/types';
import { TitleType } from '@prisma/client';
import { calculateLevelFromXp } from '@/lib/leveling'; // Fixed path
import { checkAndSaveEvolution } from '@/lib/evolutionActions'; // Assuming this is correct
import {
    updateDailyMissionProgress,
    feedPetAction,
    upsertDailyActivity,
    updateUserLoginStats
} from './user';

const convertToSerializableProblem = (dbProblem: any): SerializableProblem | undefined => {
    if (!dbProblem) {
        return undefined;
    }
    return {
        id: String(dbProblem.id),
        logicType: 'CODING_PROBLEM',
        title: { ja: dbProblem.title, en: dbProblem.title },
        description: { ja: dbProblem.description, en: dbProblem.description },
        programLines: {
            ja: (dbProblem.codeTemplate || '').split('\n'),
            en: (dbProblem.codeTemplate || '').split('\n'),
        },
        answerOptions: { ja: [], en: [] },
        correctAnswer: dbProblem.sampleCases?.[0]?.expectedOutput || '',
        explanationText: {
            ja: dbProblem.sampleCases?.[0]?.description || '解説は準備中です。',
            en: dbProblem.sampleCases?.[0]?.description || 'Explanation is not ready yet.',
        },
        sampleCases: dbProblem.sampleCases || [],
        initialVariables: {},
        traceLogic: [],
    };
};

export async function getProblemByIdAction(problemId: string): Promise<SerializableProblem | undefined> {
    const id = parseInt(problemId, 10);
    if (isNaN(id)) {
        console.error('Invalid problem ID:', problemId);
        return undefined;
    }

    try {
        const problemFromDb = await prisma.programmingProblem.findUnique({
            where: { id },
            include: {
                sampleCases: { orderBy: { order: 'asc' } },
                testCases: { orderBy: { order: 'asc' } },
            },
        });

        return convertToSerializableProblem(problemFromDb);

    } catch (error) {
        console.error(`Failed to fetch problem ${id}:`, error);
        return undefined;
    }
}

export async function getNextProblemId(currentId: number, category: string): Promise<number | null> {
    try {
        let problemIds: { id: number }[] = [];

        if (category === 'basic_info_b_problem') {
            const [staticIds, algoIds] = await Promise.all([
                prisma.questions.findMany({ select: { id: true } }),
                prisma.questions_Algorithm.findMany({
                    where: { subject: { name: '基本情報B問題' } },
                    select: { id: true },
                }),
            ]);
            problemIds = [...staticIds, ...algoIds];
        } else if (category === 'basic_info_a_problem') {
            problemIds = await prisma.basic_Info_A_Question.findMany({ select: { id: true } });
        } else if (category === 'applied_info_morning_problem') {
            problemIds = await prisma.applied_am_Question.findMany({ select: { id: true } });
        } else {
            problemIds = await prisma.questions_Algorithm.findMany({
                where: { subject: { name: category } },
                select: { id: true },
            });
        }

        const allIds = problemIds.map(p => p.id);
        const sortedUniqueIds = [...new Set(allIds)].sort((a, b) => a - b);
        const currentIndex = sortedUniqueIds.indexOf(currentId);

        if (currentIndex === -1 || currentIndex >= sortedUniqueIds.length - 1) {
            return null;
        }

        return sortedUniqueIds[currentIndex + 1];

    } catch (error) {
        console.error("Failed to get next problem ID:", error);
        return null;
    }
}

export async function awardXpForCorrectAnswer(problemId: number, eventId: number | undefined, subjectid?: number, problemStartedAt?: string | number) {
    'use server';

    const session = await getSession();
    const user = session.user;

    if (!user) {
        throw new Error('認証されていません。ログインしてください。');
    }

    const userId = user.id;
    if (!userId) {
        throw new Error('セッション内のユーザーIDが無効です。');
    }

    if (subjectid === undefined) {
        throw new Error(`SubjectIDが提供されていません。どの科目の問題か判別できません。`);
    }

    const nowJST = getNowJST();

    let difficultyId: number | undefined;
    let alreadyCorrectToday = false;
    let userAnswerForeignKeyData: any = {};
    let createdByUser = false;

    if (subjectid === 1) {
        const problem = await prisma.programmingProblem.findUnique({
            where: { id: problemId },
            select: { difficulty: true, createdBy: true }
        });
        difficultyId = problem?.difficulty;
        userAnswerForeignKeyData = { programingProblem_id: problemId };

        //作成した問題の場合の分岐
        if (problem?.createdBy) {
            createdByUser = true;
        }

        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, programingProblem_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer && isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
            alreadyCorrectToday = true;
        }

    } else if (subjectid === 2) {
        const problem = await prisma.basic_Info_A_Question.findUnique({
            where: { id: problemId },
            select: { difficultyId: true }
        });
        difficultyId = problem?.difficultyId;
        userAnswerForeignKeyData = { basic_A_Info_Question_id: problemId };

        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, basic_A_Info_Question_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer && isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
            alreadyCorrectToday = true;
        }

    } else if (subjectid === 3) {
        const problem = await prisma.questions_Algorithm.findUnique({
            where: { id: problemId },
            select: { difficultyId: true }
        });
        difficultyId = problem?.difficultyId;
        userAnswerForeignKeyData = { questions_algorithm_id: problemId };

        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, questions_algorithm_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer && isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
            alreadyCorrectToday = true;
        }

    } else if (subjectid === 4) {
        const problem = await prisma.selectProblem.findUnique({
            where: { id: problemId },
            select: { difficultyId: true, createdBy: true }
        });
        difficultyId = problem?.difficultyId;
        userAnswerForeignKeyData = { selectProblem_id: problemId };

        //作成した問題の場合の分岐
        if (problem?.createdBy) {
            createdByUser = true;
        }
        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, selectProblem_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer && isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
            alreadyCorrectToday = true;
        }
    } else if (subjectid === 5) {
        const problem = await prisma.applied_am_Question.findUnique({
            where: { id: problemId },
            select: { difficultyId: true }
        });
        difficultyId = problem?.difficultyId;
        userAnswerForeignKeyData = { applied_am_question_id: problemId };

        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, applied_am_question_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer && isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
            alreadyCorrectToday = true;
        }
    } else {
        const problem = await prisma.questions_Algorithm.findUnique({
            where: { id: problemId },
            select: { difficultyId: true }
        });
        difficultyId = problem?.difficultyId;
        userAnswerForeignKeyData = { questions_id: problemId };

        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, questions_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer && isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
            alreadyCorrectToday = true;
        }
    }

    if (!difficultyId) {
        throw new Error(`問題ID:${problemId} (科目ID:${subjectid}) が見つかりません、またはdifficultyIdが設定されていません。`);
    }

    if (alreadyCorrectToday) {
        console.log(`ユーザーID:${userId} は本日既に問題ID:${problemId}に正解済みです。`);
        return { message: '既に正解済みです。' };
    }

    let xpAmount = 0;
    let timeSpentMs = 0;

    const difficulty = await prisma.difficulty.findUnique({
        where: { id: difficultyId },
    });
    if (difficulty) {
        xpAmount = difficulty.xp;
    }

    if (typeof problemStartedAt !== 'undefined' && problemStartedAt !== null) {
        try {
            const startTime = typeof problemStartedAt === 'number'
                ? problemStartedAt
                : Date.parse(String(problemStartedAt));

            if (!isNaN(startTime)) {
                const endTime = Date.now();
                timeSpentMs = endTime - startTime;
                console.log(`[awardXp] Calculated timeSpentMs: ${timeSpentMs}`);
            } else {
                console.warn('[awardXp] Invalid problemStartedAt value received:', problemStartedAt);
            }
        } catch (e) {
            console.warn('[awardXp] Failed to calculate study time:', e);
        }
    } else {
        console.log('[awardXp] problemStartedAt was not provided.');
    }

    upsertDailyActivity(userId, xpAmount, timeSpentMs);

    const totalAnswerCount = await prisma.userAnswer.count({ where: { userId } });
    const isFirstAnswerEver = (totalAnswerCount === 0);

    updateDailyMissionProgress(1, 1);

    if (!subjectid) {
        subjectid = 0;
    }

    let unlockedTitle = undefined;

    if (!createdByUser) {
        const result = await addXp(userId, subjectid, difficultyId);
        unlockedTitle = result.unlockedTitle;
        const updatedUser = result.updatedUser;
        const isLevelUp = result.isLevelUp;
        const previousLevel = result.previousLevel;

        await feedPetAction(difficultyId);

        if (updatedUser && isLevelUp) {
            const currentLevel = updatedUser.level;
            const milestone = 30;
            if (Math.floor(currentLevel / milestone) > Math.floor(previousLevel / milestone)) {
                const evolutionLevel = Math.floor(currentLevel / milestone) * milestone;
                await checkAndSaveEvolution(userId, evolutionLevel);
                revalidatePath('/profile');
                revalidatePath('/home');
                revalidatePath('/', 'layout');
            }
        }
    }

    if (eventId !== undefined && xpAmount > 0) {
        await prisma.event_Participants.updateMany({
            where: {
                eventId: eventId,
                userId: userId,
            },
            data: {
                event_getpoint: { increment: xpAmount },
            },
        });
        console.log(`[EventScore] ユーザーID:${userId} の イベントID:${eventId} での得点を ${xpAmount}点 加算しました。`);
    }

    await updateUserLoginStats(userId);

    await prisma.userAnswer.create({
        data: {
            userId: userId,
            isCorrect: true,
            answer: 'CORRECT',
            answeredAt: new Date(),
            ...userAnswerForeignKeyData
        },
    });

    console.log(`ユーザーID:${userId} が問題ID:${problemId} (科目ID:${subjectid}) に正解し、XPを獲得しました。`);

    if (isFirstAnswerEver) {
        await prisma.status_Kohaku.updateMany({
            where: { user_id: userId },
            data: {
                hungerLastUpdatedAt: nowJST,
            },
        });
        console.log(`ユーザーID:${userId} のペットの満腹度タイマーを開始しました。`);
    }

    return { message: '経験値を獲得しました！', unlockedTitle };
}

export async function recordAnswerAction(problemId: number, subjectid: number, isCorrect: boolean, answer: string) {
    'use server';

    const session = await getSession();
    const userId = session.user?.id;

    if (!userId) {
        throw new Error('User not authenticated');
    }

    let userAnswerForeignKeyData = {};
    if (subjectid === 1) userAnswerForeignKeyData = { programingProblem_id: problemId };
    else if (subjectid === 2) userAnswerForeignKeyData = { basic_A_Info_Question_id: problemId };
    else if (subjectid === 3) userAnswerForeignKeyData = { questions_algorithm_id: problemId };
    else if (subjectid === 4) userAnswerForeignKeyData = { selectProblem_id: problemId };
    else if (subjectid === 5) userAnswerForeignKeyData = { applied_am_question_id: problemId };
    else userAnswerForeignKeyData = { questions_id: problemId };

    await prisma.userAnswer.create({
        data: {
            userId,
            isCorrect,
            answer,
            answeredAt: new Date(),
            ...userAnswerForeignKeyData
        }
    });
}

export async function addXp(user_id: string, subject_id: number, difficulty_id: number) {
    const nowJST = getNowJST();

    const difficulty = await prisma.difficulty.findUnique({
        where: { id: difficulty_id },
    });

    if (!difficulty) {
        throw new Error(`'${difficulty_id}' が見つかりません。`);
    }
    const xpAmount = difficulty.xp;
    console.log(`${difficulty_id}: ${xpAmount}xp`);

    updateDailyMissionProgress(3, xpAmount);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updatedProgress = await tx.userSubjectProgress.upsert({
            where: { user_id_subject_id: { user_id, subject_id } },
            create: { user_id, subject_id, xp: xpAmount, level: 1 },
            update: { xp: { increment: xpAmount } },
        });

        let unlockedTitle: { name: string } | null = null;

        const newSubjectLevel = calculateLevelFromXp(updatedProgress.xp);
        if (newSubjectLevel > updatedProgress.level) {
            await tx.userSubjectProgress.update({
                where: { user_id_subject_id: { user_id, subject_id } },
                data: { level: newSubjectLevel },
            });
            console.log(`[科目レベルアップ!] subjectId:${subject_id} がレベル ${newSubjectLevel} に！`);
        }

        const subjectTitles = await tx.title.findMany({
            where: {
                type: 'SUBJECT_LEVEL',
                requiredSubjectId: subject_id,
            },
        });

        for (const title of subjectTitles) {
            if (newSubjectLevel >= title.requiredLevel) {
                const existingUnlock = await tx.userUnlockedTitle.findUnique({
                    where: { userId_titleId: { userId: user_id, titleId: title.id } },
                });
                if (!existingUnlock) {
                    await tx.userUnlockedTitle.create({
                        data: { userId: user_id, titleId: title.id, unlockedAt: nowJST },
                    });
                    unlockedTitle = { name: title.name };
                    console.log(`[称号獲得!] ${title.name} を獲得しました！`);
                }
            }
        }

        let user = await tx.user.update({
            where: { id: user_id },
            data: { xp: { increment: xpAmount } },
        });
        const previousLevel = user.level;
        const newAccountLevel = calculateLevelFromXp(user.xp);
        let isLevelUp = false;
        if (newAccountLevel > user.level) {
            isLevelUp = true;
            user = await tx.user.update({
                where: { id: user_id },
                data: { level: newAccountLevel },
            });
            console.log(`[アカウントレベルアップ!] ${user.username} がアカウントレベル ${newAccountLevel} に！`);

            const userTitles = await tx.title.findMany({
                where: {
                    type: 'USER_LEVEL',
                },
            });

            for (const title of userTitles) {
                if (newAccountLevel >= title.requiredLevel) {
                    const existingUnlock = await tx.userUnlockedTitle.findUnique({
                        where: { userId_titleId: { userId: user_id, titleId: title.id } },
                    });
                    if (!existingUnlock) {
                        await tx.userUnlockedTitle.create({
                            data: { userId: user_id, titleId: title.id, unlockedAt: nowJST },
                        });
                        unlockedTitle = { name: title.name };
                        console.log(`[称号獲得!] ${title.name} を獲得しました！`);
                    }
                }
            }
        }

        return { updatedUser: user, updatedProgress, unlockedTitle, isLevelUp, previousLevel };
    });

    return result;
}

export async function getNextProgrammingProblemId(currentId: number): Promise<string | null> {
    try {
        const nextProblem = await prisma.programmingProblem.findFirst({
            where: {
                id: {
                    gt: currentId
                },
                isPublished: true,
            },
            orderBy: {
                id: 'asc'
            },
            select: {
                id: true
            }
        });
        return nextProblem ? String(nextProblem.id) : null;
    } catch (error) {
        console.error("Failed to get next programming problem ID:", error);
        return null;
    }
}

export async function deleteProblemAction(formData: FormData) {
    'use server';

    const session = await getSession();
    const user = session.user;

    if (!user?.id) {
        throw new Error('認証が必要です。');
    }

    const userId = user.id;

    const problemIdStr = formData.get('problemId');
    if (typeof problemIdStr !== 'string') {
        throw new Error('無効な問題IDです。');
    }

    const problemId = Number(problemIdStr);
    if (isNaN(problemId)) {
        throw new Error('問題IDが数値ではありません。');
    }

    try {
        const problem = await prisma.programmingProblem.findUnique({
            where: {
                id: problemId,
            },
            select: {
                createdBy: true,
            },
        });

        if (!problem || problem.createdBy !== userId) {
            throw new Error('この問題を削除する権限がありません。');
        }

        await prisma.programmingProblem.delete({
            where: {
                id: problemId,
            },
        });

        revalidatePath('/issue_list/mine_issue_list/problems');

        console.log(`ユーザーID:${userId} が 問題ID:${problemId} を削除しました。`);

    } catch (error) {
        console.error('問題の削除中にエラーが発生しました:', error);
    }
}

export async function getMineProblems() {
    'use server';
    try {
        const session = await getSession();
        const user = session.user;

        if (!user || !user.id) {
            return { error: '認証が必要です。ログインしてください。' };
        }

        const userId = user.id;
        const problems = await prisma.programmingProblem.findMany({
            where: { createdBy: userId },
            include: {
                creator: {
                    select: { username: true },
                },
            },
            orderBy: { id: 'asc' },
        });

        return { data: problems };
    } catch (error) {
        console.error("Failed to fetch user's problems:", error);
        return { error: '問題の取得中にエラーが発生しました。' };
    }
}

export async function getMineSelectProblems() {
    'use server';
    try {
        const session = await getSession();
        const user = session.user;

        if (!user || !user.id) {
            return { error: '認証が必要です。ログインしてください。' };
        }

        const userId = user.id;

        const problems = await prisma.selectProblem.findMany({
            where: { createdBy: userId },
            include: {
                creator: {
                    select: { username: true },
                },
            },
            orderBy: { id: 'asc' },
        });

        return { data: problems };
    } catch (error) {
        console.error("Failed to fetch user's select problems:", error);
        return { error: '選択問題の取得中にエラーが発生しました。' };
    }
}

export async function deleteSelectProblemAction(formData: FormData) {
    'use server';

    const session = await getSession();
    const user = session.user;

    if (!user?.id) {
        throw new Error('認証が必要です。');
    }
    const userId = user.id;

    const problemIdStr = formData.get('problemId');
    if (typeof problemIdStr !== 'string') {
        throw new Error('無効な問題IDです。');
    }
    const problemId = Number(problemIdStr);

    try {
        const problem = await prisma.selectProblem.findUnique({
            where: { id: problemId },
            select: { createdBy: true },
        });

        if (!problem || problem.createdBy !== userId) {
            throw new Error('この問題を削除する権限がありません。');
        }

        await prisma.selectProblem.delete({
            where: { id: problemId },
        });

        revalidatePath('/issue_list/mine_issue_list/problems');

    } catch (error) {
        console.error('選択問題の削除中にエラーが発生しました:', error);
    }
}

export async function getSelectProblemByIdAction(problemId: number) {
    'use server';
    try {
        const session = await getSession();
        if (!session.user) {
            return { error: '認証が必要です。' };
        }

        const problem = await prisma.selectProblem.findUnique({
            where: { id: problemId },
        });

        if (!problem) {
            return { error: '問題が見つかりません。' };
        }

        if (problem.createdBy !== session.user.id) {
            return { error: 'この問題の編集権限がありません。' };
        }

        return { data: problem };
    } catch (error) {
        console.error("Failed to fetch select problem:", error);
        return { error: '問題の取得に失敗しました。' };
    }
}

export async function updateSelectProblemAction(formData: FormData) {
    'use server';
    try {
        const session = await getSession();
        const user = session.user;
        if (!user) {
            return { error: '認証が必要です。' };
        }

        const problemId = Number(formData.get('problemId'));
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const explanation = formData.get('explanation') as string;
        const answerOptions = JSON.parse(formData.get('answerOptions') as string);
        const correctAnswer = formData.get('correctAnswer') as string;
        const subjectId = Number(formData.get('subjectId'));
        const difficultyId = Number(formData.get('difficultyId'));

        if (isNaN(problemId) || !title || !description || !answerOptions || !correctAnswer || isNaN(subjectId) || isNaN(difficultyId)) {
            return { error: '必須項目が不足しています。' };
        }

        const existingProblem = await prisma.selectProblem.findUnique({ where: { id: problemId } });
        if (!existingProblem || existingProblem.createdBy !== user.id) {
            return { error: 'この問題を更新する権限がありません。' };
        }

        const updatedProblem = await prisma.selectProblem.update({
            where: { id: problemId },
            data: {
                title,
                description,
                explanation,
                answerOptions,
                correctAnswer,
                subjectId,
                difficultyId,
            },
        });

        revalidatePath('/issue_list/mine_issue_list/problems');
        return { success: true, problem: updatedProblem };

    } catch (error) {
        console.error('Error updating select problem:', error);
        return { error: '問題の更新中にエラーが発生しました。' };
    }
}
