'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'
import FloatingActionButton from './button/FloatingActionButton'; 
import { createGroupAction,getGroupsAction,joinGroupAction } from '@/lib/actions'; // グループ作成アクションをインポート
import MemberList from './components/MemberList'; // メンバーリストコンポーネントをインポート

// グループデータの型定義
interface Group {
    id: number;
    hashedId: string;
    name: string;
    description: string;
    room?: string;
    color: string;
    teacher: string;
    memberCount: number;
    members: Member[]; // メンバー情報を追加
}

// メンバーデータの型定義
interface Member {
    admin_flg: boolean;
    user: {
        id: number;
        username: string | null;
        icon: string | null;
    };
}

// フォーマット状態の型定義
interface FormatState {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
}

// ★ 追加：通知設定の型定義
interface NotificationSettings {
    email: boolean;
    commentsOnMyPosts: boolean;
    commentsThatMentionMe: boolean;
    privateCommentsOnWork: boolean;
    submittedLate: boolean;
    resubmitted: boolean;
    invitationsToCoTeach: boolean;
    postedToClasses: boolean;
    classReminders: boolean;
}

// ★ 追加：トグルスイッチコンポーネントのプロパティ型定義
interface ToggleSwitchProps {
    id: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
    description?: string;
}

const ClassroomApp: React.FC = () => {
    // 状態管理
    const [currentView, setCurrentView] = useState<'empty' | 'groups' | 'detail' | 'settings'>('empty');
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [activeTab, setActiveTab] = useState<'お知らせ' | '課題' | 'メンバー'>('お知らせ');
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const router = useRouter();

    // リッチエディター関連の状態
    const [isEditorExpanded, setIsEditorExpanded] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [formatState, setFormatState] = useState<FormatState>({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false
    });

    // ★ 修正: グループ作成フォーム専用のstateを用意
    const [createGroupForm, setCreateGroupForm] = useState({
        className: '',
        description: '',
        section: '',
        subject: '',
        room: '',
    });

    const [classCode, setClassCode] = useState('');

    // ★ 追加：設定ページ用の状態管理
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        email: true,
        commentsOnMyPosts: true,
        commentsThatMentionMe: true,
        privateCommentsOnWork: true,
        submittedLate: true,
        resubmitted: true,
        invitationsToCoTeach: true,
        postedToClasses: true,
        classReminders: true,
    });
    const [classNotificationSettings, setClassNotificationSettings] = useState<{ [key: number]: boolean }>({});

    // エディターのref
    const editorRef = useRef<HTMLDivElement>(null);

    // APIからグループ一覧を取得する関数
    const fetchGroups = async () => {
        try {
            // fetchの代わりに、インポートしたServer Actionを直接呼び出す
            const result = await getGroupsAction();

            if (!result.success) {
                throw new Error(result.error || 'グループの読み込みに失敗しました');
            }
            
            // Actionから返されたデータを整形する
            const formattedGroups: Group[] = result.data.map((group: any) => ({
                id: group.id,
                hashedId: group.hashedId,
                name: group.groupname,
                description: group.body,
                color: '#00bcd4',
                teacher: '管理者',
                memberCount: group._count?.groups_User || 0,
                // ★★★ サーバーからの `groups_User` を、クライアントの `members` にマッピングする ★★★
                members: group.groups_User || [], 
            }));

            setGroups(formattedGroups);

        } catch (error) {
            console.error("グループ取得エラー:", error);
            alert(error instanceof Error ? error.message : '不明なエラーが発生しました');
        }
    };

    // --- ★ 修正: ページ読み込み時に一度だけグループ一覧を取得 ---
    useEffect(() => {
        fetchGroups();
    }, []);

    // ★ 追加：グループデータが更新されたら、クラスごとの通知設定を初期化
    useEffect(() => {
        const initialSettings = groups.reduce((acc, group) => {
            acc[group.id] = classNotificationSettings[group.id] ?? true; // 既存の設定を維持し、なければtrue
            return acc;
        }, {} as { [key: number]: boolean });
        setClassNotificationSettings(initialSettings);
        if (groups.length > 0) {
            setCurrentView('groups');
        } else {
            setCurrentView('empty');
        }
    }, [groups]);

    // ★ 追加：設定ページ用のイベントハンドラ
    const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setNotificationSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleClassNotificationChange = (groupId: number, checked: boolean) => {
        setClassNotificationSettings(prev => ({ ...prev, [groupId]: checked }));
    };

    // ★ 追加：設定ページに遷移するハンドラ
    const handleSettingsClick = () => {
        setCurrentView('settings');
        setSelectedGroup(null);
        setActiveDropdown(null);
    };

    // サイドバーの開閉
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // ホームボタンのクリック処理
    const handleHomeClick = () => {
        // ★ 修正：グループがあればgroupsへ、なければemptyへ
        if (groups.length > 0) {
            setCurrentView('groups');
        } else {
            setCurrentView('empty');
        }
        setSelectedGroup(null);
        setActiveDropdown(null);
    };

    // エディター展開処理
    const handleEditorExpand = () => {
        setIsEditorExpanded(true);
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
            }
        }, 100);
    };

    // エディター縮小処理
    const handleEditorCollapse = () => {
        setIsEditorExpanded(false);
        setEditorContent('');
        setFormatState({
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false
        });
    };

    // 投稿処理
    // 投稿処理の修正案
    const handlePost = async () => {
        // ★ グループが選択されているかチェック
        if (!selectedGroup) {
          alert('投稿するグループを選択してください。');
          return;
        }

        if (!editorContent.trim()) {
            alert('内容が空です。');
            return;
        }
    
        try {
            const response = await fetch('/api/posts', { // Next.jsのAPIルートのパスを指定
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    content: editorContent,
                    groupId: selectedGroup.id
                 }),
            });
        
            // レスポンスが成功でなければエラーを投げる
            if (!response.ok) {
                // サーバーからのエラーメッセージを取得試行
                const errorData = await response.json().catch(() => ({ message: 'サーバーでエラーが発生しました。' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
        
            // 成功した場合
            const result = await response.json();
            alert(`投稿に成功しました: ${result.message}`);
            handleEditorCollapse();
        
        } catch (error) {
            console.error('投稿エラー:', error);
            alert(`投稿に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
    };
    // フォーマット適用
    const applyFormat = (command: string) => {
        document.execCommand(command, false, undefined);
        
        // 状態を更新
        setFormatState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough')
        });
    };

    // リスト作成
    const insertList = () => {
        document.execCommand('insertUnorderedList', false, undefined);
    };

    // ファイル添付（ダミー実装）
    const handleFileAttach = () => {
        alert('ファイル添付機能');
    };

    // 動画埋め込み（ダミー実装）
    const handleVideoEmbed = () => {
        alert('動画埋め込み機能');
    };

    // ファイルアップロード（ダミー実装）
    const handleFileUpload = () => {
        alert('ファイルアップロード機能');
    };

    // リンク挿入
    const handleLinkInsert = () => {
        const url = prompt('URLを入力してください:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    };

    // エディターの内容変更処理
    const handleEditorChange = () => {
        if (editorRef.current) {
            setEditorContent(editorRef.current.innerHTML);
        }
    };

    // --- ★ 修正: グループ作成処理 (API呼び出し) ---
const handleCreateGroup = async () => {
    // 2. フォームから値を取得
    const groupName = createGroupForm.className.trim();
    const description = createGroupForm.description;

    if (!groupName) {
        alert('クラス名を入力してください。');
        return;
    }

    try {
        // 3. fetchの代わりに、インポートしたServer Actionを直接呼び出す
        const result = await createGroupAction({ 
            groupName: groupName, 
            body: description 
        });

        // 4. Actionからの戻り値で成功・失敗を判定
        if (result.success) {
            setShowCreateModal(false);
            setCreateGroupForm({ className: '', description: '', section: '',subject: '', room: '' });
            fetchGroups(); // Server ActionのrevalidatePathが機能するため、これは不要になる場合があります
        } else {
            // エラーがあればそれを表示
            throw new Error(result.error || 'グループの作成に失敗しました');
        }
    } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : '不明なエラー');
    }
};

    // クラス参加処理
    const handleJoinGroup = async () => {
        if (!classCode.trim()) {
            alert('招待コードを入力してください。');
            return;
        }
        
        try {
            // Server Actionを呼び出して、実際に入室処理を行う
            const result = await joinGroupAction(classCode);

            if (result.success) {
                alert(`「${result.groupName}」に参加しました！`);
                setShowJoinModal(false);
                setClassCode('');
                // ★★★ 成功したら、グループ一覧を再取得して画面を更新 ★★★
                fetchGroups();
            } else {
                throw new Error(result.error || 'グループへの参加に失敗しました。');
            }
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : '不明なエラー');
        }
    };
    // グループクリック処理
    const handleGroupClick = (group: Group) => {
        // router.push(`/group/${group.hashedId}`); // ルーティングを使わずに状態管理で表示切り替え
        setSelectedGroup(group);
        setCurrentView('detail');
    };

    // 3点メニューの表示切り替え
    const toggleDropdown = (groupId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setActiveDropdown(activeDropdown === groupId ? null : groupId);
    };

    // グループ移動処理
    const handleMoveGroup = (groupId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        alert(`グループ ID ${groupId} を移動しました`);
        setActiveDropdown(null);
    };

    // グループ登録解除処理
    const handleUnregisterGroup = (groupId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        if (confirm('このクラスの登録を解除しますか？')) {
            setGroups(groups.filter(group => group.id !== groupId));
            alert(`グループ ID ${groupId} の登録を解除しました`);
            setActiveDropdown(null);
            
            if (groups.length <= 1) {
                setCurrentView('empty');
            }
        }
    };

    // 外部クリックでドロップダウンを閉じる
    useEffect(() => {
        const handleClickOutside = () => {
            if (activeDropdown !== null) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown]);

    // Escapeキーでドロップダウンを閉じる
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (activeDropdown !== null) {
                    setActiveDropdown(null);
                } else if (isEditorExpanded) {
                    handleEditorCollapse();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [activeDropdown, isEditorExpanded]);

    // ★ 追加：再利用可能なトグルスイッチコンポーネント
    const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label, description }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <label htmlFor={id} style={{ flex: 1, cursor: 'pointer' }}>
                <span style={{ fontSize: '14px', color: '#3c4043' }}>{label}</span>
                {description && <p style={{ fontSize: '12px', color: '#5f6368', margin: '4px 0 0 0', lineHeight: 1.4 }}>{description}</p>}
            </label>
            <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                <input id={id} type="checkbox" name={id} checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: checked ? '#a5d6a7' : '#bdbdbd',
                    transition: '.3s', borderRadius: '20px'
                }}></span>
                <span style={{
                    position: 'absolute', content: '""', height: '14px', width: '14px',
                    left: checked ? '22px' : '3px', bottom: '3px',
                    backgroundColor: checked ? '#388e3c' : '#f5f5f5',
                    transition: '.3s', borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}></span>
            </label>
        </div>
    );

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
                display: 'flex',
                position: 'relative',
                minHeight: 'calc(100vh - 80px)'
            }}>
                {/* サイドバー */}
                <aside style={{
                    width: sidebarCollapsed ? '60px' : '240px',
                    backgroundColor: '#f8f9fa',
                    borderRight: '1px solid #e0e0e0',
                    minHeight: 'calc(100vh - 80px)',
                    padding: '16px',
                    transition: 'width 0.3s ease',
                    position: 'fixed',
                    left: 0,
                    top: '80px',
                    zIndex: 999,
                    boxSizing: 'border-box'
                }}>
                    {/* ハンバーガーメニューボタン */}
                    <button
                        onClick={toggleSidebar}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px',
                            cursor: 'pointer',
                            marginBottom: '16px',
                            borderRadius: '4px',
                            width: '100%',
                            display: 'flex',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M3 12h18M3 6h18M3 18h18" stroke="#5f6368" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>

                    {/* ホームボタン */}
                    <div
                        onClick={handleHomeClick}
                        style={{
                            backgroundColor: currentView !== 'settings' ? '#e3f2fd' : 'transparent', // ★ 修正
                            borderRadius: sidebarCollapsed ? '50%' : '24px', padding: sidebarCollapsed ? '12px' : '12px 16px',
                            marginBottom: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bbdefb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentView !== 'settings' ? '#e3f2fd' : 'transparent'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1976d2">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                        {!sidebarCollapsed && (
                            <span style={{
                                marginLeft: '12px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: currentView !== 'settings' ? '#1976d2' : '#5f6368'
                            }}>
                                ホーム
                            </span>
                        )}
                    </div>

                    {/* 設定ボタン */}
                    <div
                        onClick={handleSettingsClick} // ★ 修正：onClickイベントを追加
                        style={{
                            padding: sidebarCollapsed ? '12px' : '12px 16px', marginBottom: '8px', display: 'flex',
                            alignItems: 'center', cursor: 'pointer', borderRadius: sidebarCollapsed ? '50%' : '24px',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start', transition: 'all 0.2s',
                            backgroundColor: currentView === 'settings' ? '#e8eaf6' : 'transparent' // ★ 修正
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentView === 'settings' ? '#e8eaf6' : 'transparent'} // ★ 修正
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={currentView === 'settings' ? '#3f51b5' : '#5f6368'}>
                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                        </svg>
                        {!sidebarCollapsed && (
                            <span style={{
                                marginLeft: '12px', fontSize: '14px', fontWeight: '500',
                                color: currentView === 'settings' ? '#3f51b5' : '#5f6368' // ★ 修正
                            }}>
                                設定
                            </span>
                        )}
                    </div>
                </aside>

                {/* メインコンテンツ */}
                <main style={{
                    flex: 1,
                    marginLeft: sidebarCollapsed ? '60px' : '240px',
                    padding: '24px 48px',
                    transition: 'margin-left 0.3s ease',
                    backgroundColor: '#ffffff',
                    minHeight: 'calc(100vh - 80px)',
                    boxSizing: 'border-box'
                }}>
                    {/* 初期状態（グループなし） */}
                    {currentView === 'empty' && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '60vh',
                            textAlign: 'center'
                        }}>
                            {/* イラスト */}
                            <div style={{
                                width: '200px',
                                height: '150px',
                                marginBottom: '32px',
                                position: 'relative'
                            }}>
                                {/* フォルダ（青） */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    left: '50px',
                                    width: '100px',
                                    height: '80px',
                                    backgroundColor: '#2196f3',
                                    borderRadius: '8px',
                                    transform: 'rotate(-5deg)'
                                }} />
                                
                                {/* フォルダ（黄） */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '30px',
                                    left: '60px',
                                    width: '100px',
                                    height: '80px',
                                    backgroundColor: '#ffc107',
                                    borderRadius: '8px',
                                    border: '2px solid #e0e0e0'
                                }} />
                                
                                {/* ノート */}
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '30px',
                                    width: '60px',
                                    height: '80px',
                                    backgroundColor: '#fff',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '4px'
                                }}>
                                    <div style={{ height: '2px', backgroundColor: '#e0e0e0', margin: '15px auto 5px', width: '40px' }} />
                                    <div style={{ height: '2px', backgroundColor: '#e0e0e0', margin: '5px auto', width: '35px' }} />
                                    <div style={{ height: '2px', backgroundColor: '#e0e0e0', margin: '5px auto', width: '30px' }} />
                                </div>
                            </div>

                            <h2 style={{
                                fontSize: '24px',
                                color: '#3c4043',
                                marginBottom: '16px',
                                fontWeight: '400'
                            }}>
                                クラスを追加して開始
                            </h2>

                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                marginTop: '24px'
                            }}>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    style={{
                                        padding: '12px 24px',
                                        border: '1px solid #2196f3',
                                        backgroundColor: 'transparent',
                                        color: '#2196f3',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    クラスを作成
                                </button>
                                <button
                                    onClick={() => setShowJoinModal(true)}
                                    style={{
                                        padding: '12px 24px',
                                        border: 'none',
                                        backgroundColor: '#2196f3',
                                        color: '#fff',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196f3'}
                                >
                                    クラスに参加
                                </button>
                            </div>
                        </div>
                    )}

                    {/* グループ一覧表示 */}
                    {currentView === 'groups' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px',
                            marginBottom: '32px'
                        }}>
                            {groups.map(group => (
                                <div
                                    key={group.id}
                                    onClick={() => handleGroupClick(group)}
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '1px solid #e0e0e0',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* グループカードヘッダー */}
                                    <div style={{
                                        height: '100px',
                                        backgroundColor: group.color,
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        padding: '16px',
                                        color: '#fff'
                                    }}>
                                        {/* 3点メニューボタン */}
                                        <button
                                            onClick={(e) => toggleDropdown(group.id, e)}
                                            aria-label="メニューを開く"
                                            title="メニューを開く"
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                background: 'rgba(0, 0, 0, 0.2)',
                                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '50%',
                                                color: '#fff',
                                                transition: 'all 0.2s',
                                                zIndex: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                outline: 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                            </svg>
                                        </button>

                                        {/* ドロップダウンメニュー */}
                                        {activeDropdown === group.id && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '45px',
                                                right: '8px',
                                                backgroundColor: '#fff',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                                zIndex: 1000,
                                                minWidth: '140px',
                                                overflow: 'hidden',
                                                animation: 'fadeIn 0.2s ease-out'
                                            }}>
                                                <div
                                                    onClick={(e) => handleMoveGroup(group.id, e)}
                                                    style={{
                                                        padding: '12px 16px',
                                                        fontSize: '14px',
                                                        color: '#3c4043',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #f0f0f0',
                                                        transition: 'background-color 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                        <path d="M3 17h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V5H3z" fill="#5f6368"/>
                                                    </svg>
                                                    移動
                                                </div>
                                                <div
                                                    onClick={(e) => handleUnregisterGroup(group.id, e)}
                                                    style={{
                                                        padding: '12px 16px',
                                                        fontSize: '14px',
                                                        color: '#d32f2f',
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffebee'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#d32f2f"/>
                                                    </svg>
                                                    登録を解除
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h3 style={{
                                                fontSize: '16px',
                                                fontWeight: '500',
                                                margin: '0 0 4px 0',
                                                lineHeight: '1.2'
                                            }}>
                                                {group.name}
                                            </h3>
                                            <p style={{
                                                fontSize: '12px',
                                                margin: '0',
                                                opacity: '0.9'
                                            }}>
                                                {group.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* グループカードコンテンツ */}
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#f5f5f5'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginTop: '12px'
                                        }}>
                                            {/* 教師情報 */}
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#5f6368',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#34a853',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: '6px',
                                                    color: '#fff',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {group.teacher.charAt(0)}
                                                </div>
                                                {group.teacher}
                                            </div>

                                            {/* メンバー数 */}
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#5f6368',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}>
                                                <svg style={{ marginRight: '4px' }} width="12" height="12" viewBox="0 0 24 24" fill="#5f6368">
                                                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 17.06 7c-.8 0-1.54.5-1.85 1.26l-1.92 5.63c-.25.72.11 1.51.83 1.76.72.25 1.51-.11 1.76-.83L16.5 12H18v8h2zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .9-2 2 .89 2 2 2zm2.5 16v-7H6v-2.5c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2V15h-2v7h-3z"/>
                                                </svg>
                                                {group.memberCount}人
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <FloatingActionButton
                            onCreateClick={() => setShowCreateModal(true)}
                            onJoinClick={() => setShowJoinModal(true)}
                            />
                        </div>
                    )}

                    {/* グループ詳細表示 */}
                    {currentView === 'detail' && selectedGroup && (
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            {/* グループ詳細ヘッダー */}
                            <div style={{
                                backgroundColor: '#b2dfdb',
                                padding: '24px',
                                position: 'relative'
                            }}>
                                <button
                                    onClick={() => setCurrentView('groups')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '50%',
                                        marginBottom: '16px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#2e7d32">
                                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                    </svg>
                                </button>
                                <h1 style={{
                                    fontSize: '24px',
                                    color: '#2e7d32',
                                    margin: '0 0 8px 0',
                                    fontWeight: '500'
                                }}>
                                    {selectedGroup.name}
                                </h1>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#2e7d32',
                                    margin: '0',
                                    opacity: '0.8'
                                }}>
                                    {selectedGroup.description}
                                </p>
                            </div>

                            {/* タブナビゲーション */}
                            <div style={{
                                borderBottom: '1px solid #e0e0e0',
                                backgroundColor: '#fff',
                                padding: '0 24px'
                            }}>
                                {(['お知らせ', '課題', 'メンバー'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '16px 24px',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginRight: '16px',
                                            borderBottom: `2px solid ${activeTab === tab ? '#00bcd4' : 'transparent'}`,
                                            color: activeTab === tab ? '#00bcd4' : '#5f6368',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* タブコンテンツ */}
                            <div style={{
                                padding: '24px',
                                backgroundColor: '#fff'
                            }}>
                                {activeTab === 'お知らせ' && (
                                    <div>
                                        {/* リッチエディター付き投稿エリア */}
                                        <div style={{
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            marginBottom: '16px',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {!isEditorExpanded ? (
                                                // 通常状態の入力フィールド
                                                <div
                                                    onClick={handleEditorExpand}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        cursor: 'text',
                                                        padding: '8px 0'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        backgroundColor: '#00bcd4',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginRight: '12px'
                                                    }}>
                                                        <span style={{ color: '#fff', fontSize: '14px' }}>ク</span>
                                                    </div>
                                                    <div style={{
                                                        flex: 1,
                                                        padding: '8px 12px',
                                                        fontSize: '14px',
                                                        color: '#9e9e9e',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        outline: 'none'
                                                    }}>
                                                        クラスへの連絡事項を入力
                                                    </div>
                                                </div>
                                            ) : (
                                                // 展開されたリッチエディター
                                                <div style={{ animation: 'expandEditor 0.3s ease-out' }}>
                                                    {/* エディターヘッダー */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginBottom: '16px'
                                                    }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            backgroundColor: '#00bcd4',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginRight: '12px'
                                                        }}>
                                                            <span style={{ color: '#fff', fontSize: '14px' }}>ク</span>
                                                        </div>
                                                        <span style={{ fontSize: '14px', color: '#3c4043' }}>
                                                            クラスへの連絡事項を入力
                                                        </span>
                                                    </div>

                                                    {/* エディター本体 */}
                                                    <div
                                                        ref={editorRef}
                                                        contentEditable
                                                        onInput={handleEditorChange}
                                                        style={{
                                                            minHeight: '120px',
                                                            padding: '12px',
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: '4px',
                                                            backgroundColor: '#fff',
                                                            fontSize: '14px',
                                                            lineHeight: '1.5',
                                                            outline: 'none',
                                                            marginBottom: '16px'
                                                        }}
                                                        data-placeholder="内容を入力してください..."
                                                    />

                                                    {/* ツールバー */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px 0',
                                                        borderTop: '1px solid #e0e0e0',
                                                        marginBottom: '16px'
                                                    }}>
                                                        {/* テキストフォーマットボタン */}
                                                        <button
                                                            onClick={() => applyFormat('bold')}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: formatState.bold ? '#e3f2fd' : '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold',
                                                                fontSize: '14px'
                                                            }}
                                                            title="太字"
                                                        >
                                                            B
                                                        </button>
                                                        <button
                                                            onClick={() => applyFormat('italic')}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: formatState.italic ? '#e3f2fd' : '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontStyle: 'italic',
                                                                fontSize: '14px'
                                                            }}
                                                            title="斜体"
                                                        >
                                                            I
                                                        </button>
                                                        <button
                                                            onClick={() => applyFormat('underline')}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: formatState.underline ? '#e3f2fd' : '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                textDecoration: 'underline',
                                                                fontSize: '14px'
                                                            }}
                                                            title="下線"
                                                        >
                                                            U
                                                        </button>
                                                        <button
                                                            onClick={() => applyFormat('strikeThrough')}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: formatState.strikethrough ? '#e3f2fd' : '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                textDecoration: 'line-through',
                                                                fontSize: '14px'
                                                            }}
                                                            title="取り消し線"
                                                        >
                                                            S
                                                        </button>
                                                        <button
                                                            onClick={insertList}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                            title="リスト"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                                <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                                                            </svg>
                                                        </button>

                                                        <div style={{ width: '1px', height: '24px', backgroundColor: '#e0e0e0', margin: '0 4px' }} />

                                                        {/* メディアボタン */}
                                                        <button
                                                            onClick={handleFileAttach}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                            title="ファイル添付"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={handleVideoEmbed}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                            title="動画"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                                <path d="M8 5v14l11-7z"/>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={handleFileUpload}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                            title="アップロード"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={handleLinkInsert}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                            title="リンク"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.9C4.29 7 2.2 9.09 2.2 11.7s2.09 4.7 4.7 4.7H11v-1.9H6.9c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.1c2.61 0 4.7 2.09 4.7 4.7s-2.09 4.7-4.7 4.7H13v1.9h4.1c2.61 0 4.7-2.09 4.7-4.7S19.71 7 17.1 7H13v1.9z"/>
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    {/* アクションボタン */}
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        gap: '12px'
                                                    }}>
                                                        <button
                                                            onClick={handleEditorCollapse}
                                                            style={{
                                                                padding: '8px 16px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: '#fff',
                                                                color: '#5f6368',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            キャンセル
                                                        </button>
                                                        <button
                                                            onClick={handlePost}
                                                            style={{
                                                                padding: '8px 16px',
                                                                border: 'none',
                                                                backgroundColor: '#2196f3',
                                                                color: '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            投稿
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === '課題' && (
                                    <div>
                                        <h3 style={{
                                            fontSize: '18px',
                                            color: '#3c4043',
                                            margin: '0 0 16px 0',
                                            fontWeight: '500'
                                        }}>
                                            課題一覧
                                        </h3>
                                        <div style={{
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            marginBottom: '16px'
                                        }}>
                                            <p style={{ color: '#5f6368', fontSize: '14px', margin: 0 }}>
                                                現在課題はありません。
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'メンバー' && (
                                    // selectedGroup.groups_User (APIから取得したメンバーリスト) と
                                    // selectedGroup._count.groups_User (メンバー数) を渡す
                                    <MemberList 
                                        members={selectedGroup.members} 
                                        memberCount={selectedGroup.memberCount} 
                                    />
                                )}
                            </div>
                        </div>
                    )}
                    {/* 設定ページ表示 */}
                    {currentView === 'settings' && (
                        <div style={{ maxWidth: '1024px', margin: '0 auto' }}> {/* ★ デザイン改善: 横幅を広げる */}
                            <h1 style={{ 
                                fontSize: '28px', // ★ デザイン改善
                                color: '#2d3748', // ★ デザイン改善: 濃いグレー
                                borderBottom: '1px solid #e2e8f0', // ★ デザイン改善: 薄いボーダー
                                paddingBottom: '16px', 
                                marginBottom: '32px', // ★ デザイン改善
                                fontWeight: 700, // ★ デザイン改善
                            }}>設定</h1>

                            {/* 通知セクション */}
                            <div style={{ marginBottom: '40px' }}>
                                <h2 style={{ fontSize: '20px', color: '#2d3748', marginBottom: '16px', fontWeight: 600 }}>通知</h2>
                                <div style={{ 
                                    backgroundColor: '#ffffff', // ★ デザイン改善
                                    borderRadius: '12px', // ★ デザイン改善
                                    padding: '8px 32px', // ★ デザイン改善
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' // ★ デザイン改善
                                }}>
                                    <ToggleSwitch
                                        id="email"
                                        label="メール通知を許可"
                                        checked={notificationSettings.email}
                                        onChange={handleNotificationChange}
                                        // description="これらの設定はメールで受信する通知に適用されます"
                                    />
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
                                        {/* <ToggleSwitch id="classReminders" label="提出期限に関するリマインダー" checked={notificationSettings.classReminders} onChange={handleNotificationChange} /> */}
                                    </div>
                                </div>
                            </div>

                            {/* クラス通知セクション */}
                            <div>
                                <h2 style={{ fontSize: '18px', color: '#3c4043', marginBottom: '16px' }}>クラス通知</h2>
                                {/* <p style={{ fontSize: '13px', color: '#5f6368', marginBottom: '16px' }}>これらの設定は、各クラスのメール通知とデバイス通知の両方に適用されます</p> */}
                                <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0 24px' }}>
                                    {groups.length > 0 ? (
                                        groups.map((group, index) => (
                                            <React.Fragment key={group.id}>
                                                <ToggleSwitch
                                                    id={`class-${group.id}`}
                                                    label={group.name}
                                                    checked={classNotificationSettings[group.id] ?? true}
                                                    onChange={(e) => handleClassNotificationChange(group.id, e.target.checked)}
                                                />
                                                {index < groups.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: 0 }} />}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <p style={{ color: '#5f6368', fontSize: '14px', padding: '16px 0' }}>
                                            通知設定を行うクラスがありません。
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            {/* カスタムクラス作成モーダル */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        padding: '32px',
                        width: '500px',
                        maxWidth: '90vw',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{
                            fontSize: '20px',
                            color: '#3c4043',
                            margin: '0 0 32px 0',
                            fontWeight: '500'
                        }}>
                            クラスを作成する
                        </h2>
                        
                        {/* クラス名（必須） */}
                        <div style={{ marginBottom: '24px', position: 'relative' }}>
                            <input
                                type="text"
                                value={createGroupForm.className}
                                onChange={(e) => setCreateGroupForm({...createGroupForm, className: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '12px 0 12px 12px',
                                    border: 'none',
                                    borderBottom: '2px solid #2196f3',
                                    backgroundColor: '#f5f5f5',
                                    fontSize: '16px',
                                    color: '#3c4043',
                                    outline: 'none',
                                    borderRadius: '4px 4px 0 0',
                                    boxSizing: 'border-box'
                                }}
                                placeholder=" "
                            />
                            <label style={{
                                position: 'absolute',
                                top: createGroupForm.className ? '-8px' : '12px',
                                left: '12px',
                                fontSize: createGroupForm.className ? '12px' : '14px',
                                color: '#2196f3',
                                pointerEvents: 'none',
                                transition: 'all 0.2s'
                            }}>
                                クラス名（必須）
                            </label>
                        </div>

                        {/* 一部 */}
                        <div style={{ marginBottom: '24px', position: 'relative' }}>
                            <input
                                type="text"
                                value={createGroupForm.section}
                                onChange={(e) => setCreateGroupForm({...createGroupForm, section: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '12px 0 12px 12px',
                                    border: 'none',
                                    borderBottom: '2px solid #e0e0e0',
                                    backgroundColor: '#f5f5f5',
                                    fontSize: '16px',
                                    color: '#3c4043',
                                    outline: 'none',
                                    borderRadius: '4px 4px 0 0',
                                    boxSizing: 'border-box'
                                }}
                                placeholder=" "
                            />
                            <label style={{
                                position: 'absolute',
                                top: createGroupForm.section ? '-8px' : '12px',
                                left: '12px',
                                fontSize: createGroupForm.section ? '12px' : '14px',
                                color: '#5f6368',
                                pointerEvents: 'none',
                                transition: 'all 0.2s'
                            }}>
                                一部
                            </label>
                        </div>

                        {/* 科目 */}
                        <div style={{ marginBottom: '24px', position: 'relative' }}>
                            <input
                                type="text"
                                value={createGroupForm.subject}
                                onChange={(e) => setCreateGroupForm({...createGroupForm, subject: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '12px 0 12px 12px',
                                    border: 'none',
                                    borderBottom: '2px solid #e0e0e0',
                                    backgroundColor: '#f5f5f5',
                                    fontSize: '16px',
                                    color: '#3c4043',
                                    outline: 'none',
                                    borderRadius: '4px 4px 0 0',
                                    boxSizing: 'border-box'
                                }}
                                placeholder=" "
                            />
                            <label style={{
                                position: 'absolute',
                                top: createGroupForm.subject ? '-8px' : '12px',
                                left: '12px',
                                fontSize: createGroupForm.subject ? '12px' : '14px',
                                color: '#5f6368',
                                pointerEvents: 'none',
                                transition: 'all 0.2s'
                            }}>
                                科目
                            </label>
                        </div>

                        {/* 部屋 */}
                        <div style={{ marginBottom: '24px', position: 'relative' }}>
                            <input
                                type="text"
                                value={createGroupForm.room}
                                onChange={(e) => setCreateGroupForm({...createGroupForm, room: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '12px 0 12px 12px',
                                    border: 'none',
                                    borderBottom: '2px solid #e0e0e0',
                                    backgroundColor: '#f5f5f5',
                                    fontSize: '16px',
                                    color: '#3c4043',
                                    outline: 'none',
                                    borderRadius: '4px 4px 0 0',
                                    boxSizing: 'border-box'
                                }}
                                placeholder=" "
                            />
                            <label style={{
                                position: 'absolute',
                                top: createGroupForm.room ? '-8px' : '12px',
                                left: '12px',
                                fontSize: createGroupForm.room ? '12px' : '14px',
                                color: '#5f6368',
                                pointerEvents: 'none',
                                transition: 'all 0.2s'
                            }}>
                                部屋
                            </label>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '16px',
                            marginTop: '32px'
                        }}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#2196f3',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={!createGroupForm.className.trim()}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    backgroundColor: createGroupForm.className.trim() ? '#2196f3' : '#e0e0e0',
                                    color: createGroupForm.className.trim() ? '#fff' : '#9e9e9e',
                                    cursor: createGroupForm.className.trim() ? 'pointer' : 'not-allowed',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (createGroupForm.className.trim()) {
                                        e.currentTarget.style.backgroundColor = '#1976d2';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (createGroupForm.className.trim()) {
                                        e.currentTarget.style.backgroundColor = '#2196f3';
                                    }
                                }}
                            >
                                作成
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* クラス参加モーダル */}
            {showJoinModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        padding: '32px',
                        width: '500px',
                        maxWidth: '90vw',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{
                            fontSize: '20px',
                            color: '#3c4043',
                            margin: '0 0 32px 0',
                            fontWeight: '500'
                        }}>
                            クラスに参加
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: '#5f6368',
                            marginBottom: '24px'
                        }}>
                            教師にクラスコードを尋ねて、ここに入力してください。
                        </p>
                        <div style={{ marginBottom: '24px', position: 'relative' }}>
                            <input
                                type="text"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 0 12px 12px',
                                    border: 'none',
                                    borderBottom: '2px solid #e0e0e0',
                                    backgroundColor: '#f5f5f5',
                                    fontSize: '16px',
                                    color: '#3c4043',
                                    outline: 'none',
                                    borderRadius: '4px 4px 0 0',
                                    boxSizing: 'border-box'
                                }}
                                placeholder=" "
                            />
                            <label style={{
                                position: 'absolute',
                                top: classCode ? '-8px' : '12px',
                                left: '12px',
                                fontSize: classCode ? '12px' : '14px',
                                color: '#5f6368',
                                pointerEvents: 'none',
                                transition: 'all 0.2s'
                            }}>
                                クラスコード
                            </label>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '16px',
                            marginTop: '32px'
                        }}>
                            <button
                                onClick={() => setShowJoinModal(false)}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#2196f3',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleJoinGroup}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    backgroundColor: '#2196f3',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196f3'}
                            >
                                参加
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSSアニメーション */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes expandEditor {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                        max-height: 0;
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                        max-height: 500px;
                    }
                }
                
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9e9e9e;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};

export default ClassroomApp;

