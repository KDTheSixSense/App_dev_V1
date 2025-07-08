'use client';

import React, { useState, useEffect } from 'react';
import { GroupLayout } from '../GroupLayout'; // 共通レイアウトをインポート

// === 型定義 ===
interface Group {
    id: number;
    name: string;
}
interface NotificationSettings {
    email: boolean;
    commentsOnMyPosts: boolean;
    commentsThatMentionMe: boolean;
    privateCommentsOnWork: boolean;
    submittedLate: boolean;
    resubmitted: boolean;
    invitationsToCoTeach: boolean;
}
interface ToggleSwitchProps {
    id: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
    description?: string;
}

// === 再利用可能なトグルスイッチコンポーネント ===
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label, description }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
        <label htmlFor={id} style={{ flex: 1, cursor: 'pointer' }}>
            <span style={{ fontSize: '14px', color: '#3c4043' }}>{label}</span>
            {description && <p style={{ fontSize: '12px', color: '#5f6368', margin: '4px 0 0 0', lineHeight: 1.4 }}>{description}</p>}
        </label>
        <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
            <input id={id} type="checkbox" name={id} checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: checked ? '#a5d6a7' : '#bdbdbd', transition: '.3s', borderRadius: '20px' }}></span>
            <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: checked ? '22px' : '3px', bottom: '3px', backgroundColor: checked ? '#388e3c' : '#f5f5f5', transition: '.3s', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></span>
        </label>
    </div>
);

const SettingsPage: React.FC = () => {
    // === State管理 ===
    const [groups, setGroups] = useState<Group[]>([]);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        email: true,
        commentsOnMyPosts: true,
        commentsThatMentionMe: true,
        privateCommentsOnWork: true,
        submittedLate: true,
        resubmitted: true,
        invitationsToCoTeach: true,
    });
    const [classNotificationSettings, setClassNotificationSettings] = useState<{ [key: number]: boolean }>({});

    // === データ取得 ===
    useEffect(() => {
        const fetchGroupsForSettings = async () => {
            try {
                const response = await fetch('/api/groups');
                const data = await response.json();
                const formattedGroups: Group[] = data.map((g: any) => ({ id: g.id, name: g.groupname }));
                setGroups(formattedGroups);

                // クラスごとの通知設定を初期化
                const initialSettings = formattedGroups.reduce((acc, group) => {
                    acc[group.id] = true;
                    return acc;
                }, {} as { [key: number]: boolean });
                setClassNotificationSettings(initialSettings);
            } catch (error) {
                console.error("グループ取得エラー:", error);
            }
        };
        fetchGroupsForSettings();
    }, []);

    // === イベントハンドラ ===
    const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setNotificationSettings(prev => ({ ...prev, [name as keyof NotificationSettings]: checked }));
    };

    const handleClassNotificationChange = (groupId: number, checked: boolean) => {
        setClassNotificationSettings(prev => ({ ...prev, [groupId]: checked }));
    };

    return (
        <GroupLayout>
            <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '28px', color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '32px', fontWeight: 700 }}>設定</h1>
                
                {/* 通知セクション */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '16px', fontWeight: 600 }}>通知</h2>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '8px 32px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                        <ToggleSwitch id="email" label="メール通知を許可" checked={notificationSettings.email} onChange={handleNotificationChange} />
                        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: 0 }} />
                        <div style={{ padding: '8px 0' }}>
                            <h3 style={{ fontSize: '16px', color: '#4a5568', margin: '16px 0', fontWeight: 600 }}>コメント</h3>
                            <ToggleSwitch id="commentsOnMyPosts" label="自分の投稿へのコメント" checked={notificationSettings.commentsOnMyPosts} onChange={handleNotificationChange} />
                            <ToggleSwitch id="commentsThatMentionMe" label="自分の名前がリンク付きのコメント" checked={notificationSettings.commentsThatMentionMe} onChange={handleNotificationChange} />
                            <ToggleSwitch id="privateCommentsOnWork" label="課題に関する限定公開のコメント" checked={notificationSettings.privateCommentsOnWork} onChange={handleNotificationChange} />
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: 0 }} />
                        <div style={{ padding: '8px 0 16px' }}>
                             <h3 style={{ fontSize: '16px', color: '#4a5568', margin: '16px 0', fontWeight: 600 }}>登録したクラス</h3>
                             <ToggleSwitch id="submittedLate" label="教師からの課題やその他の投稿" checked={notificationSettings.submittedLate} onChange={handleNotificationChange} />
                             <ToggleSwitch id="resubmitted" label="教師から返却された課題と成績" checked={notificationSettings.resubmitted} onChange={handleNotificationChange} />
                             <ToggleSwitch id="invitationsToCoTeach" label="生徒としてクラスへ招待" checked={notificationSettings.invitationsToCoTeach} onChange={handleNotificationChange} />
                        </div>
                    </div>
                </div>

                {/* クラス通知セクション */}
                <div>
                    <h2 style={{ fontSize: '18px', color: '#3c4043', marginBottom: '16px' }}>クラス通知</h2>
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0 24px' }}>
                        {groups.length > 0 ? (
                            groups.map((group, index) => (
                                <React.Fragment key={group.id}>
                                    <ToggleSwitch id={`class-${group.id}`} label={group.name} checked={classNotificationSettings[group.id] ?? true} onChange={(e) => handleClassNotificationChange(group.id, e.target.checked)} />
                                    {index < groups.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: 0 }} />}
                                </React.Fragment>
                            ))
                        ) : (
                            <p style={{ color: '#5f6368', fontSize: '14px', padding: '16px 0' }}>通知設定を行うクラスがありません。</p>
                        )}
                    </div>
                </div>
            </div>
        </GroupLayout>
    );
};

export default SettingsPage;