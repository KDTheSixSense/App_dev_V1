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
