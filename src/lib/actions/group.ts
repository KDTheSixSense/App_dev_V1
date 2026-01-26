// /workspaces/my-next-app/src/lib/actions/group.ts

// グループ機能のサーバーアクション
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
 * @param data.body グループの説明文
 */
export async function createGroupAction(data: { groupName: string, body: string }) {
    // 1. 認証チェック
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) return { error: 'ログインしていません。' };
    const userId = session.user.id;

    const { groupName, body } = data;

    // 2. 入力バリデーション
    if (!groupName || groupName.trim() === '') {
        return { error: 'グループ名を入力してください。' };
    }

    // 3. 招待コードの生成 (8文字のランダム文字列)
    const inviteCode = nanoid(8);

    // 4. グループの作成
    // Note: 本来は下のメンバー追加と合わせてトランザクションにするのが理想的です
    const newGroup = await prisma.groups.create({
        data: {
            groupname: groupName,
            invite_code: inviteCode,
            body: body, // グループの説明
        },
    });

    // 5. 作成者を管理者としてメンバーに追加
    await prisma.groups_User.create({
        data: {
            user_id: userId,
            group_id: newGroup.id,
            admin_flg: true, // 作成者は自動的に管理者フラグをTrueにする
        },
    });

    // 6. 監査ログの記録 (エラーが起きても処理自体は止めないようtry-catch)
    try {
        await logAudit(userId, AuditAction.CREATE_GROUP, { groupId: newGroup.id, groupName: newGroup.groupname });
    } catch (e) {
        // ignore
    }

    // 7. グループ一覧ページのキャッシュを更新
    revalidatePath('/groups');
    return { success: true, groupName: newGroup.groupname, inviteCode: newGroup.invite_code };
}

/**
 * 招待コードを使って既存のグループに参加するAction
 */
export async function joinGroupAction(inviteCode: string) {
    // 1. 認証チェック
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) return { error: 'ログインしていません。' };
    const userId = session.user.id;

    if (!inviteCode || inviteCode.trim() === '') {
        return { error: '招待コードを入力してください。' };
    }

    // 2. 招待コードからグループを検索
    const group = await prisma.groups.findUnique({
        where: { invite_code: inviteCode },
    });

    if (!group) {
        return { error: '無効な招待コードです。' };
    }

    // 3. 既に参加済みかどうかのチェック (重複参加の防止)
    const existingMembership = await prisma.groups_User.findUnique({
        where: {
            // 複合主キーまたはユニーク制約 (group_id + user_id) を使用して検索
            group_id_user_id: { group_id: group.id, user_id: userId },
        },
    });

    if (existingMembership) {
        return { error: '既にこのグループに参加しています。' };
    }

    // 4. メンバーとして追加
    await prisma.groups_User.create({
        data: {
            user_id: userId,
            group_id: group.id,
            admin_flg: false, // 参加者はデフォルトで管理者ではない(False)
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

/**
 * ログインユーザーが所属しているグループ一覧を取得するAction
 */
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
                // (groups_User テーブルに userId と一致するレコードがあるか)
                groups_User: {
                    some: {
                        user_id: userId,
                    },
                },
            },
            // 各グループのメンバー数とメンバー詳細を一緒に取得
            include: {
                // メンバー数のカウント
                _count: {
                    select: {
                        groups_User: true,
                    },
                },
                // メンバーの詳細リスト
                // Note: メンバー数が多い場合、ここで全件取得するとパフォーマンスに影響する可能性があります
                groups_User: {
                    include: {
                        user: { // 各メンバーのユーザー情報も取得 (アイコン表示など用)
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