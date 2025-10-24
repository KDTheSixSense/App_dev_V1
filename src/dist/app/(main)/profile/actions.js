"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfileAction = updateUserProfileAction;
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
