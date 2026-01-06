'use server';

import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { logAudit, AuditAction } from '@/lib/audit';

/**
 * 新しいグループを作成し、招待コードを発行するAction
 * @param data.groupName フォームから受け取った新しいグループの名前
 */
export async function createGroupAction(data: { groupName: string, body: string }) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) return { error: 'ログインしていません。' };
    const userId = session.user.id;

    const { groupName, body } = data;

    if (!groupName || groupName.trim() === '') {
        return { error: 'グループ名を入力してください。' };
    }

    const inviteCode = nanoid(8);

    const newGroup = await prisma.groups.create({
        data: {
            groupname: groupName,
            invite_code: inviteCode,
            body: body, // グループの説明
        },
    });

    await prisma.groups_User.create({
        data: {
            user_id: userId,
            group_id: newGroup.id,
            admin_flg: true, // 作成者は自動的に管理者
        },
    });

    try {
        await logAudit(userId, AuditAction.CREATE_GROUP, { groupId: newGroup.id, groupName: newGroup.groupname });
    } catch (e) {
        // ignore
    }

    revalidatePath('/groups');
    return { success: true, groupName: newGroup.groupname, inviteCode: newGroup.invite_code };
}

export async function joinGroupAction(inviteCode: string) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) return { error: 'ログインしていません。' };
    const userId = session.user.id;

    if (!inviteCode || inviteCode.trim() === '') {
        return { error: '招待コードを入力してください。' };
    }

    const group = await prisma.groups.findUnique({
        where: { invite_code: inviteCode },
    });

    if (!group) {
        return { error: '無効な招待コードです。' };
    }

    const existingMembership = await prisma.groups_User.findUnique({
        where: {
            group_id_user_id: { group_id: group.id, user_id: userId },
        },
    });

    if (existingMembership) {
        return { error: '既にこのグループに参加しています。' };
    }

    await prisma.groups_User.create({
        data: {
            user_id: userId,
            group_id: group.id,
            admin_flg: false, // 参加者はデフォルトで管理者ではない
        },
    });

    try {
        await logAudit(userId, AuditAction.JOIN_GROUP, { groupId: group.id, groupName: group.groupname });
    } catch (e) {
        // ignore
    }

    revalidatePath('/groups');
    return { success: true, groupName: group.groupname };
}

export async function getGroupsAction() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id || null;

    if (!userId) {
        return { error: 'ログインしていません。' };
    }

    try {
        const groups = await prisma.groups.findMany({
            where: {
                // ログイン中のユーザーがメンバーに含まれるグループのみを検索
                groups_User: {
                    some: {
                        user_id: userId,
                    },
                },
            },
            // 各グループのメンバー数を一緒に取得
            include: {
                // メンバー数と、メンバーの詳細リストの両方を取得します
                _count: {
                    select: {
                        groups_User: true,
                    },
                },
                groups_User: {
                    include: {
                        user: { // 各メンバーのユーザー情報も取得
                            select: {
                                id: true,
                                username: true,
                                icon: true,
                            },
                        },
                    },
                },
            },
        });
        return { success: true, data: groups, currentUserId: userId };
    } catch (error) {
        console.error("Failed to fetch groups:", error);
        return { error: 'グループの取得に失敗しました。' };
    }
}
