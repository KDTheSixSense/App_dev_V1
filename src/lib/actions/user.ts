'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { getMissionDate } from '@/lib/utils'; // Fixed path
import { getNowJST, getAppToday, isSameAppDay, getDaysDiff } from '@/lib/dateUtils'; // Fixed path
import { registerSchema as baseRegisterSchema } from '@/lib/validations';
import { z } from 'zod';
import { TitleType } from '@prisma/client';
import { calculateLevelFromXp } from '@/lib/leveling';
import { checkAndSaveEvolution } from '@/lib/evolutionActions';

const MAX_HUNGER = 200;

const registerSchema = baseRegisterSchema.extend({
    username: z.string().min(1, 'ユーザー名は必須です'),
    isAgreedToTerms: z.boolean().refine(val => val === true, '利用規約への同意が必要です'),
    isAgreedToPrivacyPolicy: z.boolean().refine(val => val === true, 'プライバシーポリシーへの同意が必要です'),
});

export async function registerUserAction(data: {
    username: string, email: string, password: string, birth?: string, isAgreedToTerms: boolean,
    isAgreedToPrivacyPolicy: boolean
}) {
    const validationResult = registerSchema.safeParse(data);
    if (!validationResult.success) {
        return { error: validationResult.error.issues[0].message };
    }

    const { username, email, password, birth, isAgreedToTerms, isAgreedToPrivacyPolicy } = validationResult.data;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
                birth: birth ? new Date(birth) : null,
                isAgreedToTerms: isAgreedToTerms,
                isAgreedToPrivacyPolicy: isAgreedToPrivacyPolicy,
                status_Kohaku: {
                    create: {
                        status: '満腹 ',
                        hungerlevel: 150,
                        hungerLastUpdatedAt: new Date(),
                    },
                },
            },
        });

        return { success: true, user: newUser };

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { error: 'そのメールアドレスまたはユーザー名は既に使用されています。' };
        }
        console.error("User registration failed:", error);
        return { error: 'アカウントの作成中にエラーが発生しました。' };
    }
}

export async function changePasswordAction(currentPassword: string, newPassword: string) {
    'use server';

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id;

    if (!userId) {
        return { success: false, error: '認証セッションが無効です。' };
    }
    if (!currentPassword || !newPassword) {
        return { success: false, error: '現在のパスワードと新しいパスワードを入力してください。' };
    }
    if (newPassword.length < 8) {
        return { success: false, error: '新しいパスワードは8文字以上である必要があります。' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user || !user.password) {
            return { success: false, error: 'パスワード情報が見つかりません。' };
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return { success: false, error: '現在のパスワードが正しくありません。' };
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: newHashedPassword },
        });

        return { success: true, message: 'パスワードが正常に変更されました。' };

    } catch (error) {
        console.error("Password change failed:", error);
        return { success: false, error: 'パスワードの更新中に予期せぬエラーが発生しました。' };
    }
}

export async function ensureDailyMissionProgress(userOrId: string | { id: string, lastlogin: Date | null, continuouslogin: number | null }) {
    'use server';

    let user: { id: string, lastlogin: Date | null, continuouslogin: number | null } | null = null;
    let userId: string;

    if (typeof userOrId === 'string') {
        userId = userOrId;
        user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                lastlogin: true,
                continuouslogin: true
            },
        });
    } else {
        user = userOrId;
        userId = user.id;
    }

    if (!user) {
        console.error(`[ensureDailyMissionProgress] Error: User with ID ${userId} not found.`);
        return false;
    }

    const missionDate = getMissionDate();

    if (user.lastlogin && user.continuouslogin !== 0) {
        const lastLoginMissionDate = getMissionDate(user.lastlogin);
        const diffInMs = missionDate.getTime() - lastLoginMissionDate.getTime();
        const diffInDays = diffInMs / 86400000;

        if (diffInDays >= 2) {
            console.log(`[ensureDailyMissionProgress] Resetting login streak for user ${userId}.`);
            await prisma.user.update({
                where: { id: userId },
                data: { continuouslogin: 0 },
            });
        }
    }

    try {
        const existingProgressCount = await prisma.userDailyMissionProgress.count({
            where: {
                userId: userId,
                date: missionDate,
            },
        });

        if (existingProgressCount > 0) {
            return;
        }

        const missionMasters = await prisma.dailyMissionMaster.findMany({
            select: { id: true },
        });

        if (missionMasters.length === 0) {
            console.warn('Daily mission master data not found.');
            return;
        }

        const newProgressData = missionMasters.map((master: any) => ({
            userId: userId,
            missionId: master.id,
            date: missionDate,
            progress: 0,
            isCompleted: false,
        }));

        await prisma.userDailyMissionProgress.createMany({
            data: newProgressData,
            skipDuplicates: true,
        });

        return true;

    } catch (error: any) {
        if (error.code === 'P2002') {
            return true;
        }
        console.error(`Error creating daily mission progress for user ${userId}:`, error);
        return false;
    }
}

export async function updateUserLoginStats(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            lastlogin: true,
            continuouslogin: true,
            totallogin: true,
        },
    });

    if (!user) { throw new Error('User not found'); }

    const now = getNowJST();
    const appToday = getAppToday();
    let newConsecutiveDays = 1;

    if (user.lastlogin) {
        const daysSinceLastLogin = getDaysDiff(user.lastlogin, appToday);

        if (isSameAppDay(user.lastlogin, now)) {
            return;
        }

        if (daysSinceLastLogin === 1) {
            newConsecutiveDays = (user.continuouslogin ?? 0) + 1;
        }
    }
    const newTotalDays = (user.totallogin ?? 0) + 1;

    await prisma.user.update({
        where: { id: userId },
        data: {
            totallogin: newTotalDays,
            continuouslogin: newConsecutiveDays,
            lastlogin: now,
        },
    });

    await prisma.loginHistory.create({
        data: {
            userId: userId,
        },
    });
}

export async function updateLoginStreakAction() {
    'use server';
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id;

    if (!userId) {
        return { error: 'ユーザーIDが無効です。' };
    }

    try {
        await updateUserLoginStats(userId);
        return { success: true };
    } catch (error) {
        console.error('Failed to update login streak:', error);
        return { error: 'ログイン日数の更新に失敗しました。' };
    }
}

export async function feedPetAction(difficultyId: number) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) {
        return { error: 'ログインしていません。' };
    }
    const userId = session.user.id;

    try {
        const difficulty = await prisma.difficulty.findUnique({
            where: { id: difficultyId },
        });

        if (!difficulty) {
            return { error: '指定された難易度が見つかりません。' };
        }
        const foodAmount = difficulty.feed;
        const petStatus = await prisma.status_Kohaku.findFirst({
            where: { user_id: userId },
        });

        const now = new Date();

        if (!petStatus) {
            await prisma.status_Kohaku.create({
                data: {
                    user_id: userId,
                    status: "満腹",
                    hungerlevel: Math.min(foodAmount, MAX_HUNGER),
                    hungerLastUpdatedAt: now,
                }
            });
        } else {
            const newHungerLevel = petStatus.hungerlevel + foodAmount;
            const cappedHungerLevel = Math.min(newHungerLevel, MAX_HUNGER);

            await prisma.status_Kohaku.update({
                where: { id: petStatus.id },
                data: {
                    hungerlevel: cappedHungerLevel,
                    hungerLastUpdatedAt: now,
                },
            });
            // Import necessary? updateDailyMissionProgress is in same file
            updateDailyMissionProgress(2, foodAmount);
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to feed pet:", error);
        return { error: 'コハクへの餌やりに失敗しました。' };
    }
}

export async function updatePetName(newName: string) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id;

    if (!userId) {
        return { error: '認証されていません。' };
    }

    const trimmedName = newName.trim();
    if (trimmedName.length === 0 || trimmedName.length > 20) {
        return { error: '名前は1文字以上20文字以下である必要があります。' };
    }

    try {
        await prisma.status_Kohaku.update({
            where: { user_id: userId },
            data: { name: trimmedName },
        });

        revalidatePath('/profile');
        return { success: true };

    } catch (error) {
        console.error('ペットの名前更新に失敗しました:', error);
        return { error: 'データベースエラーで名前を変更できませんでした。' };
    }
}

// Exporting this for internal use by problem.ts/recordStudyTime etc
export async function upsertDailyActivity(
    userId: string,
    xpAmount: number,
    timeSpentMs: number
) {
    const jstOffset = 9 * 60 * 60 * 1000;
    const todayJST = new Date(Date.now() + jstOffset);
    const todayDate = new Date(todayJST.toISOString().split('T')[0]);

    try {
        await prisma.dailyActivitySummary.upsert({
            where: {
                userId_date: {
                    userId: userId,
                    date: todayDate,
                },
            },
            create: {
                userId: userId,
                date: todayDate,
                totalXpGained: xpAmount,
                totalTimeSpentMs: BigInt(timeSpentMs),
                problemsCompleted: xpAmount > 0 ? 1 : 0,
            },
            update: {
                totalXpGained: { increment: xpAmount },
                totalTimeSpentMs: { increment: BigInt(timeSpentMs) },
                problemsCompleted: { increment: xpAmount > 0 ? 1 : 0 },
            },
        });
    } catch (error) {
        console.error(`[ActivitySummary] Failed to update activity for user ${userId}:`, error);
    }
}

export async function recordStudyTimeAction(timeSpentMs: number) {
    'use server';
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id;

    if (!userId) {
        return { error: 'Authentication required.' };
    }

    if (typeof timeSpentMs !== 'number' || timeSpentMs <= 0 || isNaN(timeSpentMs)) {
        return { error: 'Invalid time value.' };
    }

    try {
        await upsertDailyActivity(userId, 0, timeSpentMs);
        return { success: true, message: 'Study time recorded.' };
    } catch (error) {
        console.error('[recordStudyTimeAction] Failed:', error);
        return { error: 'Failed to record study time.' };
    }
}

export async function updateDailyMissionProgress(
    missionId: number,
    incrementAmount: number
) {
    'use server';

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id;
    if (!userId) {
        return { success: false, error: '認証されていません。' };
    }

    const missionDate = getMissionDate();

    try {
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const currentProgress = await tx.userDailyMissionProgress.findUniqueOrThrow({
                where: {
                    userId_missionId_date: {
                        userId: userId,
                        missionId: missionId,
                        date: missionDate,
                    },
                },
                include: {
                    mission: true,
                },
            });

            if (currentProgress.isCompleted) {
                return null;
            }

            const newProgress = currentProgress.progress + incrementAmount;

            await tx.userDailyMissionProgress.update({
                where: {
                    userId_missionId_date: {
                        userId: userId,
                        missionId: missionId,
                        date: missionDate,
                    },
                },
                data: {
                    progress: newProgress,
                },
            });

            let unlockedTitle: { name: string } | null = null;
            let justCompleted = false;

            if (newProgress >= currentProgress.mission.targetCount) {
                justCompleted = true;

                await tx.userDailyMissionProgress.update({
                    where: {
                        userId_missionId_date: {
                            userId: userId,
                            missionId: missionId,
                            date: missionDate,
                        },
                    },
                    data: {
                        isCompleted: true,
                    },
                });

                grantXpToUser(userId, currentProgress.mission.xpReward).then((res) => {
                    if (res && res.unlockedTitle) unlockedTitle = res.unlockedTitle;
                });
            }

            return { justCompleted, unlockedTitle };
        });

        if (result === null) {
            return { success: true, completed: true, message: '既に達成済みです。' };
        } else {
            return { success: true, completed: result.justCompleted, unlockedTitle: result.unlockedTitle };
        }

    } catch (error: any) {
        if (error.code === 'P2025') {
            return { success: false, error: '本日のミッション進捗が見つかりません。' };
        }
        console.error(`[updateDailyMissionProgress] Error:`, error);
        return { success: false, error: 'ミッション進捗の更新中にエラーが発生しました。' };
    }
}

export async function grantXpToUser(userId: string, xpAmount: number) {
    'use server';

    if (xpAmount <= 0) {
        return { unlockedTitle: null };
    }

    const { unlockedTitle, updatedUser, isLevelUp, previousLevel } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

        let user = await tx.user.update({
            where: { id: userId },
            data: { xp: { increment: xpAmount } },
        });

        let unlockedTitle: { name: string } | null = null;
        const previousLevel = user.level;
        const oldLevel = user.level;
        const newAccountLevel = calculateLevelFromXp(user.xp);
        let isLevelUp = false;

        if (newAccountLevel > oldLevel) {
            isLevelUp = true;
            user = await tx.user.update({
                where: { id: userId },
                data: { level: newAccountLevel },
            });

            const userTitles = await tx.title.findMany({
                where: {
                    type: TitleType.USER_LEVEL,
                    requiredLevel: { lte: newAccountLevel },
                },
            });

            for (const title of userTitles) {
                const existingUnlock = await tx.userUnlockedTitle.findUnique({
                    where: { userId_titleId: { userId: userId, titleId: title.id } },
                });

                if (!existingUnlock) {
                    await tx.userUnlockedTitle.create({
                        data: { userId: userId, titleId: title.id },
                    });
                    unlockedTitle = { name: title.name };
                }
            }
        }

        return { unlockedTitle, updatedUser: user, isLevelUp, previousLevel };
    });

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

    return { unlockedTitle, xpAmount };
}
