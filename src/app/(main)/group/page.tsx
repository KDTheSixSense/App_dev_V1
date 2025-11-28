import { getGroupsAction } from '@/lib/actions';
import GroupClientPage from './GroupClientPage';

interface Group {
    id: number;
    hashedId: string;
    name: string;
    description: string;
    color: string;
    teacher: string;
    teacherIcon: string | null;
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
                throw new Error(result.error || 'グループの読み込みに失敗しました');
            }

            
            
            // Actionから返されたデータを整形する
            const formattedGroups: Group[] = result.data.map((group: any) => {
                const members: Member[] = group.groups_User || [];
                const admin = members.find(member => member.admin_flg);
                const teacherName = admin?.user?.username || '管理者';
                const teacherIcon = admin?.user?.icon || null;

                return {
                    id: group.id,
                    hashedId: group.hashedId,
                    name: group.groupname,
                    description: group.body,
                    color: '#00bcd4',
                    teacher: teacherName,
                    teacherIcon: teacherIcon,
                    memberCount: group._count?.groups_User || 0,
                    members: members,
                    inviteCode: group.invite_code || ''
                };
            });

  const currentUserId = result.currentUserId || null; // Server Actionから取得

    return (
        <div style={{
            fontFamily: "'Hiragino Sans', 'ヒラギノ角ゴシック', 'Yu Gothic', 'メイリオ', sans-serif",
            backgroundColor: '#ffffff',
            minHeight: '100vh',
            paddingTop: '80px',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box'
        }}>
            {/* レイアウトコンテナ */}
            <div style={{
                position: 'relative',
                minHeight: 'calc(100vh - 80px)'
            }}>
{/* メインコンテンツ */}
                <main style={{
                    flex: 1,
                    padding: '24px',
                    transition: 'margin-left 0.3s ease',
                    backgroundColor: '#ffffff',
                    minHeight: 'calc(100vh - 80px)',
                    boxSizing: 'border-box',
                    maxWidth: '100%'
                }}>
                    <GroupClientPage initialGroups={formattedGroups} initialCurrentUserId={currentUserId} />
                </main>
            </div>
        </div>
    );
}
