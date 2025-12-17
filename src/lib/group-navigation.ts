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
