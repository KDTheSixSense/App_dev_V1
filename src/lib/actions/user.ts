// lib/actions/user.ts

// サーバーアクションとして定義 (クライアントから直接呼び出し可能)
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { getMissionDate } from '@/lib/utils'; 
import { getNowJST, getAppToday, isSameAppDay, getDaysDiff } from '@/lib/dateUtils';
import { registerSchema as baseRegisterSchema } from '@/lib/validations';
import { z } from 'zod';
import { TitleType } from '@prisma/client';
import { calculateLevelFromXp } from '@/lib/leveling';
import { checkAndSaveEvolution } from '@/lib/evolutionActions';

// ペットの満腹度の上限値
const MAX_HUNGER = 200;

// バリデーションスキーマの拡張
const registerSchema = baseRegisterSchema.extend({
    username: z.string().min(1, 'ユーザー名は必須です'),
    isAgreedToTerms: z.boolean().refine(val => val === true, '利用規約への同意が必要です'),
    isAgreedToPrivacyPolicy: z.boolean().refine(val => val === true, 'プライバシーポリシーへの同意が必要です'),
});

/**
 * ユーザー登録処理
 * ユーザー作成と同時に、初期ペットステータスも作成します。
 */
export async function registerUserAction(data: {
    username: string, email: string, password: string, birth?: string, isAgreedToTerms: boolean,
    isAgreedToPrivacyPolicy: boolean
}) {
    // 1. 入力値の検証
    const validationResult = registerSchema.safeParse(data);
    if (!validationResult.success) {
        return { error: validationResult.error.issues[0].message };
    }

    const { username, email, password, birth, isAgreedToTerms, isAgreedToPrivacyPolicy } = validationResult.data;

    try {
        // 2. パスワードのハッシュ化 (セキュリティ対策)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. ユーザーとペット情報の作成 (Nested Write)
        // Userを作成しつつ、関連するstatus_Kohaku(ペット)も同時に作成します
        const newUser = await prisma.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
                birth: birth ? new Date(birth) : null,
                isAgreedToTerms: isAgreedToTerms,
                isAgreedToPrivacyPolicy: isAgreedToPrivacyPolicy,
                // ペットの初期状態を設定
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
        // 一意制約違反 (メールアドレスやユーザー名の重複) のハンドリング
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { error: 'そのメールアドレスまたはユーザー名は既に使用されています。' };
        }
        console.error("User registration failed:", error);
        return { error: 'アカウントの作成中にエラーが発生しました。' };
    }
}

/**
 * パスワード変更処理
 */
export async function changePasswordAction(currentPassword: string, newPassword: string) {
    'use server';

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id;

    if (!userId) {
        return { success: false, error: '認証セッションが無効です。' };
    }
    // ...バリデーション (省略)...
    if (!currentPassword || !newPassword) {
        return { success: false, error: '現在のパスワードと新しいパスワードを入力してください。' };
    }
    if (newPassword.length < 8) {
        return { success: false, error: '新しいパスワードは8文字以上である必要があります。' };
    }

    try {
        // 現在のパスワードを取得して照合
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

        // 新しいパスワードをハッシュ化して保存
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

/**
 * デイリーミッションの進捗レコードが存在することを保証する関数
 * また、ログインストリーク（連続ログイン）のリセット判定もここで行います。
 * @param userOrId ユーザーID または ユーザーオブジェクト
 */
export async function ensureDailyMissionProgress(userOrId: string | { id: string, lastlogin: Date | null, continuouslogin: number | null }) {
    'use server';

    let user: { id: string, lastlogin: Date | null, continuouslogin: number | null } | null = null;
    let userId: string;

    // 引数の型判定
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

    const missionDate = getMissionDate(); // 今日の日付（アプリ基準）を取得

    // 1. 連続ログインが途切れているかのチェック
    if (user.lastlogin && user.continuouslogin !== 0) {
        const lastLoginMissionDate = getMissionDate(user.lastlogin);
        const diffInMs = missionDate.getTime() - lastLoginMissionDate.getTime();
        const diffInDays = diffInMs / 86400000;

        // 最終ログインから2日以上経過（＝昨日ログインしていない）場合、ストリークをリセット
        if (diffInDays >= 2) {
            console.log(`[ensureDailyMissionProgress] Resetting login streak for user ${userId}.`);
            await prisma.user.update({
                where: { id: userId },
                data: { continuouslogin: 0 },
            });
        }
    }

    try {
        // 2. 今日のミッション進捗が既に作られているかチェック
        const existingProgressCount = await prisma.userDailyMissionProgress.count({
            where: {
                userId: userId,
                date: missionDate,
            },
        });

        if (existingProgressCount > 0) {
            return; // 既に存在すれば何もしない
        }

        // 3. ミッションマスタを取得して、進捗レコードを作成
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

        // createManyで一括作成（skipDuplicates: true で競合回避）
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

/**
 * ユーザーのログイン統計（最終ログイン、連続日数、総日数）を更新
 */
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

        // 同日に既に更新済みならスキップ
        if (isSameAppDay(user.lastlogin, now)) {
            return;
        }

        // 昨日ログインしていれば +1
        if (daysSinceLastLogin === 1) {
            newConsecutiveDays = (user.continuouslogin ?? 0) + 1;
        }
        // 昨日ログインしていなければ 1 にリセット (上の初期値)
    }
    const newTotalDays = (user.totallogin ?? 0) + 1;

    // ユーザー情報更新
    await prisma.user.update({
        where: { id: userId },
        data: {
            totallogin: newTotalDays,
            continuouslogin: newConsecutiveDays,
            lastlogin: now,
        },
    });

    // ログイン履歴テーブルにも記録
    await prisma.loginHistory.create({
        data: {
            userId: userId,
        },
    });
}

// クライアントから呼ぶためのラッパー関数
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

/**
 * ペットに餌をやる処理
 * 課題の難易度に応じた餌の量が与えられます。
 */
export async function feedPetAction(difficultyId: number) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) {
        return { error: 'ログインしていません。' };
    }
    const userId = session.user.id;

    try {
        // 難易度テーブルから餌の量を取得
        const difficulty = await prisma.difficulty.findUnique({
            where: { id: difficultyId },
        });

        if (!difficulty) {
            return { error: '指定された難易度が見つかりません。' };
        }
        const foodAmount = difficulty.feed;
        
        // ペットの状態を取得
        const petStatus = await prisma.status_Kohaku.findFirst({
            where: { user_id: userId },
        });

        const now = new Date();

        // ペットデータがなければ作成、あれば更新
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
            // 上限値 (MAX_HUNGER) を超えないように制御
            const cappedHungerLevel = Math.min(newHungerLevel, MAX_HUNGER);

            await prisma.status_Kohaku.update({
                where: { id: petStatus.id },
                data: {
                    hungerlevel: cappedHungerLevel,
                    hungerLastUpdatedAt: now,
                },
            });
            // 【重要】ここで「餌やりミッション」の進捗を進めています
            // TODO: ミッションID '2' がハードコードされているため、マスタ変更時に注意が必要
            updateDailyMissionProgress(2, foodAmount);
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to feed pet:", error);
        return { error: 'コハクへの餌やりに失敗しました。' };
    }
}

// ペットの名前変更
export async function updatePetName(newName: string) {
    // ...認証とバリデーション (省略)...
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

/**
 * 毎日の活動記録（XP獲得量、学習時間）を記録・更新する (Upsert)
 */
export async function upsertDailyActivity(
    userId: string,
    xpAmount: number,
    timeSpentMs: number
) {
    const jstOffset = 9 * 60 * 60 * 1000;
    const todayJST = new Date(Date.now() + jstOffset);
    const todayDate = new Date(todayJST.toISOString().split('T')[0]); // YYYY-MM-DD形式の日付を取得

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

// 学習時間記録の公開アクション
export async function recordStudyTimeAction(timeSpentMs: number) {
    'use server';
    // ...認証とバリデーション...
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

/**
 * デイリーミッションの進捗を更新する関数
 * 目標を達成した場合、自動的にXPが付与され、称号判定なども行われます。
 */
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
        // トランザクション処理: 進捗更新と達成処理を原子的に行う
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 現在の進捗を取得 (存在しない場合はエラー)
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

            // 既に完了済みなら処理しない
            if (currentProgress.isCompleted) {
                return null;
            }

            const newProgress = currentProgress.progress + incrementAmount;

            // 進捗を更新
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

            // 目標値に到達した場合の達成処理
            if (newProgress >= currentProgress.mission.targetCount) {
                justCompleted = true;

                // 完了フラグを立てる
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

                // ★重要: XPを付与 (非同期で実行)
                // Note: grantXpToUser自体も内部でトランザクションを持っているため、
                // トランザクションのネストに注意が必要だが、ここでは .then で処理を繋げている
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

/**
 * ユーザーにXPを付与し、レベルアップ、称号獲得、進化判定を行う関数
 */
export async function grantXpToUser(userId: string, xpAmount: number) {
    'use server';

    if (xpAmount <= 0) {
        return { unlockedTitle: null };
    }

    // XP付与、レベル計算、称号獲得をトランザクション内で実行
    const { unlockedTitle, updatedUser, isLevelUp, previousLevel } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

        // 1. XPを加算
        let user = await tx.user.update({
            where: { id: userId },
            data: { xp: { increment: xpAmount } },
        });

        let unlockedTitle: { name: string } | null = null;
        const previousLevel = user.level;
        const oldLevel = user.level;
        
        // 2. 新しいレベルを計算
        const newAccountLevel = calculateLevelFromXp(user.xp);
        let isLevelUp = false;

        // 3. レベルが上がっていれば更新
        if (newAccountLevel > oldLevel) {
            isLevelUp = true;
            user = await tx.user.update({
                where: { id: userId },
                data: { level: newAccountLevel },
            });

            // 4. レベル条件の称号をチェック
            const userTitles = await tx.title.findMany({
                where: {
                    type: TitleType.USER_LEVEL,
                    requiredLevel: { lte: newAccountLevel },
                },
            });

            for (const title of userTitles) {
                // まだ持っていない称号なら付与
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

    // 5. ペットの進化判定 (トランザクションの外で実行)
    // レベルが30, 60...と30の倍数の大台に乗ったときに進化をチェック
    if (updatedUser && isLevelUp) {
        const currentLevel = updatedUser.level;
        const milestone = 30;
        
        // 前回レベルと今回レベルで、30の倍数の区切りを跨いだか判定
        // 例: prev=29, curr=30 -> 0 < 1 -> True
        if (Math.floor(currentLevel / milestone) > Math.floor(previousLevel / milestone)) {
            const evolutionLevel = Math.floor(currentLevel / milestone) * milestone;
            
            // 進化処理を実行 (DB保存)
            await checkAndSaveEvolution(userId, evolutionLevel);
            
            // 画面更新
            revalidatePath('/profile');
            revalidatePath('/home');
            revalidatePath('/', 'layout');
        }
    }

    return { unlockedTitle, xpAmount };
}