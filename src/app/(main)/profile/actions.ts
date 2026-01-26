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

/**
 * ユーザープロフィール更新Server Action
 * 
 * ユーザーIDに基づき、ニックネーム、生年月日、アイコン、選択中の称号を更新します。
 * 入力値のバリデーション（文字数制限）や、称号の所有権チェックも行います。
 * 
 * @param formData 更新するプロフィール情報
 */
export async function updateUserProfileAction(formData: ProfileUpdateData) {
  const session = await getAppSession();
  if (!session?.user) {
    return { error: "認証されていません。" };
  }

  const userId = session.user.id;

  // 1. バリデーション
  if (formData.username && formData.username.length > 50) {
    return { error: "ユーザー名は50文字以内で入力してください。" };
  }

  // 称号の所有権チェック
  if (formData.selectedTitleId) {
    const hasTitle = await prisma.userUnlockedTitle.findUnique({
      where: {
        userId_titleId: {
          userId: userId,
          titleId: formData.selectedTitleId,
        },
      },
    });

    if (!hasTitle) {
      return { error: "未獲得の称号を選択することはできません。" };
    }
  }

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

import { getDailyActivityStats } from "@/lib/data";

/**
 * 指定された期間の日次活動サマリーを取得する
 * (データがない日は0埋めする)
 */
export async function getDailyActivityAction(timeframeDays: 7 | 14 | 30) {
  'use server';

  const session = await getAppSession();
  if (!session?.user) {
    return { error: '認証されていません。' };
  }
  const userId = session.user.id;

  try {
    const chartData = await getDailyActivityStats(userId, timeframeDays);
    return { data: chartData };
  } catch (error) {
    console.error('活動データの取得に失敗:', error);
    return { error: 'データの取得に失敗しました。' };
  }
}