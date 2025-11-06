"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfileAction = updateUserProfileAction;
exports.getDailyActivityAction = getDailyActivityAction;
const prisma_1 = require("@/lib/prisma");
const auth_1 = require("@/lib/auth");
const cache_1 = require("next/cache");
async function updateUserProfileAction(formData) {
    const session = await (0, auth_1.getAppSession)();
    if (!(session === null || session === void 0 ? void 0 : session.user)) {
        return { error: "認証されていません。" };
    }
    const userId = Number(session.user.id);
    try {
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                username: formData.username,
                birth: formData.birth ? new Date(formData.birth) : null,
                icon: formData.icon,
                selectedTitleId: formData.selectedTitleId,
            },
        });
        (0, cache_1.revalidatePath)("/profile");
        return { success: true };
    }
    catch (error) {
        console.error("Profile update failed:", error);
        return { error: "プロフィールの更新に失敗しました。" };
    }
}
/**
 * 指定された期間の日次活動サマリーを取得する
 * (データがない日は0埋めする)
 */
async function getDailyActivityAction(timeframeDays) {
    'use server';
    console.log(`[getDailyActivityAction] timeframeDays: ${timeframeDays}`);
    const session = await (0, auth_1.getAppSession)();
    if (!(session === null || session === void 0 ? void 0 : session.user)) {
        console.error('[getDailyActivityAction] Error: Not authenticated.');
        return { error: '認証されていません。' };
    }
    const userId = Number(session.user.id);
    console.log(`[getDailyActivityAction] userId: ${userId}`);
    if (isNaN(userId)) { // userId が NaN でないかチェックを追加
        console.error('[getDailyActivityAction] Error: Invalid userId.');
        return { error: '無効なユーザーIDです。' };
    }
    try {
        // 1. 期間の開始日と終了日をJSTで計算
        const jstOffset = 9 * 60 * 60 * 1000;
        const endDate = new Date(Date.now() + jstOffset);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - (timeframeDays - 1)); // (例: 7日なら6日前)
        // DB検索用にUTCの「日付」オブジェクトに変換
        const startDateQuery = new Date(startDate.toISOString().split('T')[0]);
        const endDateQuery = new Date(endDate.toISOString().split('T')[0]);
        console.log(`[getDailyActivityAction] startDateQuery: ${startDateQuery.toISOString()}, endDateQuery: ${endDateQuery.toISOString()}`);
        console.log('[getDailyActivityAction] Checking prisma object:', typeof prisma_1.prisma);
        console.log('[getDailyActivityAction] Checking prisma.dailyActivitySummary:', typeof prisma_1.prisma.dailyActivitySummary);
        // 2. DBから取得 (problemsCompleted も select に追加)
        const dbData = await prisma_1.prisma.dailyActivitySummary.findMany({
            where: {
                userId: userId,
                date: {
                    gte: startDateQuery,
                    lte: endDateQuery,
                },
            },
            // problemsCompleted を追加
            select: {
                date: true,
                totalXpGained: true,
                totalTimeSpentMs: true,
                problemsCompleted: true,
            },
            orderBy: {
                date: 'asc',
            },
        });
        console.log(`[getDailyActivityAction] dbData count: ${dbData.length}`);
        // 3. データを「日付文字列」をキーにしたMapに変換
        const activityMap = new Map(dbData.map((d) => [
            d.date.toISOString().split('T')[0], // (例: '2025-10-24')
            {
                totalXpGained: d.totalXpGained,
                totalTimeSpentMin: Number(d.totalTimeSpentMs / BigInt(60000)),
                problemsCompleted: d.problemsCompleted,
            },
        ]));
        console.log(`[getDailyActivityAction] activityMap size: ${activityMap.size}`);
        // 4. 0埋めデータ作成 ( problemsCompleted も含める)
        const chartData = [];
        for (let i = 0; i < timeframeDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];
            const data = activityMap.get(dateString) || {
                totalXpGained: 0,
                totalTimeSpentMin: 0,
                problemsCompleted: 0,
            };
            chartData.push({
                date: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
                '獲得XP': data.totalXpGained,
                '学習時間 (分)': data.totalTimeSpentMin,
                '完了問題数': data.problemsCompleted,
            });
        }
        return { data: chartData };
    }
    catch (error) {
        console.error('活動データの取得に失敗:', error);
        return { error: 'データの取得に失敗しました。' };
    }
}
