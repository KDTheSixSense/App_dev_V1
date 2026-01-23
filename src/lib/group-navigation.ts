export interface GroupMember {
    admin_flg: boolean;
    user: {
        id: string;
    };
}

/**
 * Determines the navigation path for a group based on the user's role.
 * 
 * @param groupHashedId The hashed ID of the group
 * @param currentUserId The ID of the current logged-in user
 * @param members The list of members in the group
 * @returns The path to navigate to (/admin, /member, or intermediate page)
 */
/**
 * グループナビゲーションパス決定関数
 * 
 * ユーザーのロール（管理者/一般/未所属）に基づいて、
 * グループ内の適切な遷移先パス（ダッシュボードなど）を決定します。
 * 
 * @param groupHashedId グループのハッシュ化ID
 * @param currentUserId 現在のログインユーザーID
 * @param members グループメンバーリスト
 * @returns 遷移先パス string
 */
export function getGroupNavigationPath(
    groupHashedId: string,
    currentUserId: string | null,
    members: GroupMember[]
): string {
    if (!currentUserId) {
        return `/group/${groupHashedId}`;
    }

    const myMembership = members.find(m => m.user.id === currentUserId);

    if (myMembership) {
        return myMembership.admin_flg
            ? `/group/${groupHashedId}/admin`
            : `/group/${groupHashedId}/member`;
    }

    return `/group/${groupHashedId}`;
}
