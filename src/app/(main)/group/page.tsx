import { getGroupsAction } from '@/lib/actions';
import GroupClientPage from './GroupClientPage';

interface Group {
    id: number;
    hashedId: string;
    name: string;
    description: string;
    color: string;
    teacher: string;
    memberCount: number;
    members: Member[];
    inviteCode: string;
}

interface Member {
    admin_flg: boolean;
    user: {
        id: number;
        username: string | null;
        icon: string | null;
    };
}

export default async function GroupPage() {
  const result = await getGroupsAction();

  if (!result.success) {
    // エラーハンドリング（例: エラーメッセージを表示するクライアントコンポーネントを返す）
    return <div>エラー: {result.error || 'グループの読み込みに失敗しました'}</div>;
  }

  const formattedGroups: Group[] = result.data.map((group: any) => {
    const members: Member[] = group.groups_User || [];
    const admin = members.find(member => member.admin_flg);
    const teacherName = admin?.user?.username || '管理者';

    return {
      id: group.id,
      hashedId: group.hashedId,
      name: group.groupname,
      description: group.body,
      color: '#00bcd4',
      teacher: teacherName,
      memberCount: group._count?.groups_User || 0,
      members: members,
      inviteCode: group.invite_code || ''
    };
  });

  const currentUserId = result.currentUserId || null; // Server Actionから取得

  return (
    <GroupClientPage
      initialGroups={formattedGroups}
      initialCurrentUserId={currentUserId}
    />
  );
}