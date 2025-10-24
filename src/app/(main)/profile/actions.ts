'use server';

import { prisma } from "@/lib/prisma";
import { getAppSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type ProfileUpdateData = {
  username?: string;
  birth?: string;
  icon?: string;
  selectedTitleId?: number | null;
};

export async function updateUserProfileAction(formData: ProfileUpdateData) {
  const session = await getAppSession();
  if (!session?.user) {
    return { error: "認証されていません。" };
  }

  const userId = Number(session.user.id);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        username: formData.username,
        birth: formData.birth ? new Date(formData.birth) : null,
        icon: formData.icon,
        selectedTitleId: formData.selectedTitleId,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Profile update failed:", error);
    return { error: "プロフィールの更新に失敗しました。" };
  }
}

/**
 * 指定された期間の日次活動サマリーを取得する
 * (データがない日は0埋めする)
 */
export async function getDailyActivityAction(timeframeDays: 7 | 14 | 30) {
  'use server';

  console.log(`[getDailyActivityAction] timeframeDays: ${timeframeDays}`);

  const session = await getAppSession();
  if (!session?.user) {
    console.error('[getDailyActivityAction] Error: Not authenticated.');
    return { error: '認証されていません。' };
  }
  const userId = Number(session.user.id);
  console.log(`[getDailyActivityAction] userId: ${userId}`); // ★ 追加

  if (isNaN(userId)) { // ★ userId が NaN でないかチェックを追加
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
    console.log('[getDailyActivityAction] Checking prisma object:', typeof prisma);
    console.log('[getDailyActivityAction] Checking prisma.dailyActivitySummary:', typeof prisma.dailyActivitySummary);

    // 2. データベースから期間内の活動データを取得
    const dbData = await prisma.dailyActivitySummary.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDateQuery,
          lte: endDateQuery,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
    console.log(`[getDailyActivityAction] dbData count: ${dbData.length}`);

    // 3. データを「日付文字列」をキーにしたMapに変換
    const activityMap = new Map(
      dbData.map((d) => [
        d.date.toISOString().split('T')[0], // (例: '2025-10-24')
        {
          totalXpGained: d.totalXpGained,
          // BigIntをnumberに変換（JSONでシリアライズ可能にするため）
          // Avoid bigint literal (60000n) for older TS targets by converting BigInt to number first.
          totalTimeSpentMin: Math.floor(Number(d.totalTimeSpentMs) / 60000), // ミリ秒 -> 分
        },
      ])
    );
    console.log(`[getDailyActivityAction] activityMap size: ${activityMap.size}`);

    // 4. 0埋めした完全なデータ配列を作成
    const chartData = [];
    for (let i = 0; i < timeframeDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];

      const data = activityMap.get(dateString) || {
        totalXpGained: 0,
        totalTimeSpentMin: 0,
      };
      console.log(`[getDailyActivityAction] chartData generated count: ${chartData.length}`);

      chartData.push({
        // グラフ用に日付をフォーマット (例: '10/24')
        date: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
        '総獲得XP': data.totalXpGained,
        '総学習時間 (分)': data.totalTimeSpentMin,
      });
    }

    return { data: chartData };
  } catch (error) {
    console.error('活動データの取得に失敗:', error);
    return { error: 'データの取得に失敗しました。' };
  }
}