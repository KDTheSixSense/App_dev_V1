'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupLayout } from '../../GroupLayout';

// === 型定義 ===
interface GroupDetail {
    id: number;
    hashedId: string;
    name: string;
    description: string;
    memberCount: number;
    teacher: string;
}

interface Member {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    isAdmin: boolean;
    onlineStatus: 'online' | 'away' | 'offline';
    level?: number;
    xp?: number;
    posts?: number;
    assignments?: number;
    attendance?: number;
}

interface MemberStats {
    totalMembers: number;
    onlineMembers: number;
    adminCount: number;
    studentCount: number;
}

interface FormatState {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
}

// 投稿データの型定義
interface Post {
    id: number;
    content: string;
    author: string;
    date: string;
    showMenu: boolean;
    // コメント機能のための型定義
    comments?: Comment[];
    showComments?: boolean;
    // 投稿編集機能のための型定義を追加
    isEditing?: boolean;  // 編集モード状態を追加
}

// コメントの型定義
interface Comment {
    id: number;
    content: string;
    author: string;
    date: string;
    avatar?: string;
    // コメント編集・削除機能のための型定義
    showMenu?: boolean;    // メニュー表示状態
    isEditing?: boolean;   // 編集モード状態
}

// 課題データの型定義
interface Kadai {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    progress: number;
    createdAt: string;
    showComments?: boolean; // 課題詳細表示用
    comments?: Comment[]; // 課題に紐づくコメント
}

const GroupDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const hashedId = params.hashedId as string;

    // === State管理 ===
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // メンバー関連のstate
    const [members, setMembers] = useState<Member[]>([]);
    const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);
    
    // 投稿関連のstate
    const [posts, setPosts] = useState<Post[]>([]);
    
    // コメント関連のstate
    const [commentInputs, setCommentInputs] = useState<{[postId: number]: string}>({});

    // コメント編集用のstate
    const [editingComments, setEditingComments] = useState<{[commentId: number]: string}>({});

    // 投稿編集用のstateを追加
    const [editingPosts, setEditingPosts] = useState<{[postId: number]: string}>({});

    // コメント編集テキスト更新機能
    const updateEditingComment = (commentId: number, value: string) => {
        setEditingComments(prev => ({ ...prev, [commentId]: value }));
    };

    // 投稿編集テキスト更新機能を追加
    const updateEditingPost = (postId: number, value: string) => {
        setEditingPosts(prev => ({ ...prev, [postId]: value }));
    };
    
    // UI関連のstate
    const [activeTab, setActiveTab] = useState<'お知らせ' | '課題' | 'メンバー'>('お知らせ');
    const [isEditorExpanded, setIsEditorExpanded] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [formatState, setFormatState] = useState<FormatState>({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false
    });

    // 課題関連のstate
    const [showKadaiOptions, setShowKadaiOptions] = useState(false);
    const [isKadaiEditorExpanded, setIsKadaiEditorExpanded] = useState<boolean>(false);
    const [kadaiTitle, setKadaiTitle] = useState<string>('');
    const [kadaiDescription, setKadaiDescription] = useState<string>('');
    const [kadaiDueDate, setKadaiDueDate] = useState<string>('');
    const [kadaiList, setKadaiList] = useState<Kadai[]>([]);
    const [kadaiFormatState, setKadaiFormatState] = useState<FormatState>({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false
    });
    const [selectedKadai, setSelectedKadai] = useState<Kadai | null>(null);
    const [kadaiViewMode, setKadaiViewMode] = useState<'list' | 'expanded' | 'detail'>('list');

    const [createGroupForm, setCreateGroupForm] = useState({
        className: '',
        description: '',
        section: '',
        subject: '',
        room: '',
    });

    const [classCode, setClassCode] = useState('');

    const editorRef = useRef<HTMLDivElement>(null);
    const kadaiEditorRef = useRef<HTMLDivElement>(null);

    // === API関数 ===
    // メンバー一覧を取得する関数
    const fetchGroupMembers = async (groupHashedId: string) => {
        try {
            setMembersLoading(true);
            setMembersError(null);
            
            const response = await fetch(`/api/groups/${groupHashedId}/members`);
            const data = await response.json();
            
            if (data.success) {
                console.log('メンバー一覧:', data.data.members);
                console.log('統計情報:', data.data.stats);
                setMembers(data.data.members);
                setMemberStats(data.data.stats);
                return data.data;
            } else {
                console.error('エラー:', data.message);
                setMembersError(data.message);
            }
        } catch (error) {
            console.error('APIエラー:', error);
            setMembersError('メンバー情報の取得に失敗しました');
        } finally {
            setMembersLoading(false);
        }
    };

    // メンバー追加関数
    const handleAddMember = async (email: string) => {
        if (!hashedId) return;
        
        try {
            const response = await fetch(`/api/groups/${hashedId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, isAdmin: false }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                await fetchGroupMembers(hashedId); // リロード
                alert('メンバーを追加しました');
            } else {
                alert(`メンバー追加に失敗しました: ${data.message}`);
            }
        } catch (error) {
            console.error('メンバー追加エラー:', error);
            alert('メンバー追加に失敗しました');
        }
    };

    // === データ取得 ===
    useEffect(() => {
        if (hashedId) {
            const fetchGroupDetail = async () => {
                try {
                    setLoading(true);
                    const response = await fetch(`/api/groups/${hashedId}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'グループの読み込みに失敗しました');
                    }
                    const data = await response.json();
                    setGroup({ teacher: '管理者', ...data });
                    
                    // メンバー情報も同時に取得
                    await fetchGroupMembers(hashedId);
                    
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
                } finally {
                    setLoading(false);
                }
            };
            fetchGroupDetail();
        }
    }, [hashedId]);

    // === イベントハンドラ ===
    // エディター展開処理
    const handleEditorExpand = () => {
        setIsEditorExpanded(true);
        setTimeout(() => editorRef.current?.focus(), 100);
    };

    // エディター縮小処理
    const handleEditorCollapse = () => {
        setIsEditorExpanded(false);
        setEditorContent('');
        setFormatState({ bold: false, italic: false, underline: false, strikethrough: false });
    };

    // === 投稿関連の関数 ===
    // 投稿処理の更新版
    const handlePost = async () => {
        if (!group) {
            alert('投稿するグループを選択してください。');
            return;
        }
        if (!editorContent.trim()) {
            alert('内容が空です。');
            return;
        }
        
        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editorContent, groupId: group.id }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '投稿に失敗しました');
            }
            
            // 新しい投稿を投稿リストに追加
            const newPost: Post = {
                id: Date.now(),
                content: editorContent,
                author: '管理者', // または実際のユーザー名
                date: new Date().toLocaleDateString('ja-JP', { 
                    month: 'long', 
                    day: 'numeric' 
                }),
                showMenu: false,
                // コメント機能の初期化
                comments: [],
                showComments: false,
                // 投稿編集機能の初期化を追加
                isEditing: false
            };
            
            setPosts([newPost, ...posts]);
            alert('投稿に成功しました！');
            handleEditorCollapse();
            
        } catch (error) {
            console.error('投稿エラー:', error);
            alert(`投稿に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
    };

    // 投稿メニュー操作関数
    const togglePostMenu = (postId: number) => {
        setPosts(posts.map(post => 
            post.id === postId 
                ? { ...post, showMenu: !post.showMenu }
                : { ...post, showMenu: false }
        ));
    };

    // 投稿リンクコピー機能
    const copyPostLink = (postId: number) => {
        const link = `${window.location.origin}${window.location.pathname}#post-${postId}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('リンクをコピーしました');
            togglePostMenu(postId);
        });
    };

    // 投稿編集機能を改善
    const editPost = (postId: number) => {
        const post = posts.find(p => p.id === postId);
        if (post) {
            // 投稿を編集モードに切り替え
            setPosts(posts.map(p => 
                p.id === postId 
                    ? { ...p, isEditing: true, showMenu: false }
                    : p
            ));
            // 編集用のテキストを設定
            setEditingPosts(prev => ({ ...prev, [postId]: post.content }));
        }
    };

    // 投稿編集保存機能を追加
    const saveEditPost = (postId: number) => {
        const editedContent = editingPosts[postId];
        if (!editedContent || !editedContent.trim()) {
            alert('投稿内容を入力してください');
            return;
        }

        setPosts(posts.map(post => 
            post.id === postId 
                ? { ...post, content: editedContent, isEditing: false }
                : post
        ));

        // 編集用のテキストをクリア
        setEditingPosts(prev => {
            const newState = { ...prev };
            delete newState[postId];
            return newState;
        });
    };

    // 投稿編集キャンセル機能を追加
    const cancelEditPost = (postId: number) => {
        setPosts(posts.map(post => 
            post.id === postId 
                ? { ...post, isEditing: false }
                : post
        ));

        // 編集用のテキストをクリア
        setEditingPosts(prev => {
            const newState = { ...prev };
            delete newState[postId];
            return newState;
        });
    };

    // 投稿削除機能
    const deletePost = (postId: number) => {
        if (confirm('この投稿を削除しますか？')) {
            setPosts(posts.filter(p => p.id !== postId));
        }
        togglePostMenu(postId);
    };

    // === コメント関連の機能 ===
    // コメント表示切り替え機能
    const toggleComments = (postId: number) => {
        setPosts(posts.map(post => 
            post.id === postId 
                ? { ...post, showComments: !post.showComments }
                : post
        ));
    };

    // コメント編集開始機能
    const startEditComment = (postId: number, commentId: number, currentContent: string) => {
        // 編集モードに切り替え
        setPosts(posts.map(post => 
            post.id === postId 
                ? {
                    ...post,
                    comments: post.comments?.map(comment =>
                        comment.id === commentId
                            ? { ...comment, isEditing: true, showMenu: false }
                            : comment
                    )
                }
                : post
        ));

        // 編集用のテキストを設定
        setEditingComments(prev => ({ ...prev, [commentId]: currentContent }));
    };

    // コメント編集保存機能
    const saveEditComment = (postId: number, commentId: number) => {
        const editedContent = editingComments[commentId];
        if (!editedContent || !editedContent.trim()) {
            alert('コメントを入力してください');
            return;
        }

        setPosts(posts.map(post => 
            post.id === postId 
                ? {
                    ...post,
                    comments: post.comments?.map(comment =>
                        comment.id === commentId
                            ? { ...comment, content: editedContent, isEditing: false }
                            : comment
                    )
                }
                : post
        ));

        // 編集用のテキストをクリア
        setEditingComments(prev => {
            const newState = { ...prev };
            delete newState[commentId];
            return newState;
        });
    };

    // コメント編集キャンセル機能
    const cancelEditComment = (postId: number, commentId: number) => {
        setPosts(posts.map(post => 
            post.id === postId 
                ? {
                    ...post,
                    comments: post.comments?.map(comment =>
                        comment.id === commentId
                            ? { ...comment, isEditing: false }
                            : comment
                    )
                }
                : post
        ));

        // 編集用のテキストをクリア
        setEditingComments(prev => {
            const newState = { ...prev };
            delete newState[commentId];
            return newState;
        });
    };

    // コメント削除機能
    const deleteComment = (postId: number, commentId: number) => {
        if (confirm('このコメントを削除しますか？')) {
            setPosts(posts.map(post => 
                post.id === postId 
                    ? {
                        ...post,
                        comments: post.comments?.filter(comment => comment.id !== commentId)
                    }
                    : post
            ));
        }
    };

    // コメントメニュー表示切り替え機能
    const toggleCommentMenu = (postId: number, commentId: number) => {
        setPosts(posts.map(post => 
            post.id === postId 
                ? {
                    ...post,
                    comments: post.comments?.map(comment =>
                        comment.id === commentId
                            ? { ...comment, showMenu: !comment.showMenu }
                            : { ...comment, showMenu: false }
                    )
                }
                : post
        ));
    };

    // コメント追加機能
    const addComment = (postId: number) => {
        const commentText = commentInputs[postId];
        if (!commentText || !commentText.trim()) {
            alert('コメントを入力してください');
            return;
        }

        const newComment: Comment = {
            id: Date.now(),
            content: commentText,
            author: 'あなた', // 実際のユーザー名に置き換え
            date: new Date().toLocaleDateString('ja-JP', { 
                month: 'long', 
                day: 'numeric' 
            }),
            avatar: 'あ'
        };

        setPosts(posts.map(post => 
            post.id === postId 
                ? { 
                    ...post, 
                    comments: [...(post.comments || []), newComment],
                    showComments: true
                }
                : post
        ));

        // コメント入力フィールドをクリア
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    };

    // コメント入力値更新機能
    const updateCommentInput = (postId: number, value: string) => {
        setCommentInputs(prev => ({ ...prev, [postId]: value }));
    };

    // 課題エディター展開処理
    const handleKadaiEditorExpand = (): void => {
        setIsKadaiEditorExpanded(true);
        setTimeout(() => {
            if (kadaiEditorRef.current) {
                kadaiEditorRef.current.focus();
            }
        }, 100);
    };

    // 課題エディター縮小処理
    const handleKadaiEditorCollapse = (): void => {
        setIsKadaiEditorExpanded(false);
        setKadaiTitle('');
        setKadaiDescription('');
        setKadaiDueDate('');
        setKadaiFormatState({
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false
        });
        if (kadaiEditorRef.current) {
            kadaiEditorRef.current.innerHTML = '';
        }
    };

    // 課題作成処理
    const handleKadaiCreate = (): void => {
        if (!kadaiTitle.trim()) {
            alert('課題のタイトルを入力してください');
            return;
        }
        
        const newKadai: Kadai = {
            id: Date.now(),
            title: kadaiTitle,
            description: kadaiDescription,
            dueDate: kadaiDueDate,
            progress: 0,
            createdAt: new Date().toISOString()
        };
        
        setKadaiList([...kadaiList, newKadai]);
        handleKadaiEditorCollapse();
    };

    // 課題編集処理
    const handleKadaiEdit = (kadai: Kadai): void => {
        setKadaiTitle(kadai.title);
        setKadaiDescription(kadai.description);
        setKadaiDueDate(kadai.dueDate);
        setIsKadaiEditorExpanded(true);
        
        setTimeout(() => {
            if (kadaiEditorRef.current) {
                kadaiEditorRef.current.innerHTML = kadai.description;
            }
        }, 100);
        
        setKadaiList(kadaiList.filter((k) => k.id !== kadai.id));
    };

    // 課題削除処理
    const handleKadaiDelete = (kadai: Kadai): void => {
        if (confirm('この課題を削除しますか？')) {
            setKadaiList(kadaiList.filter((k) => k.id !== kadai.id));
        }
    };

    // 課題詳細表示
    const handleKadaiDetail = (kadai: Kadai): void => {
        setSelectedKadai(kadai);
        setKadaiViewMode('detail');
    };

    // 課題詳細表示から戻る処理
    const handleKadaiBackToList = (): void => {
        setSelectedKadai(null);
        setKadaiViewMode('list');
    };

    // 課題エディターの内容変更処理
    const handleKadaiEditorChange = (): void => {
        if (kadaiEditorRef.current) {
            setKadaiDescription(kadaiEditorRef.current.innerHTML);
        }
    };

    // 課題エディター用フォーマット適用
    const applyKadaiFormat = (command: string): void => {
        document.execCommand(command, false, undefined);
        
        setKadaiFormatState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough')
        });
    };

    // テキストフォーマット適用機能
    const applyFormat = (command: string) => {
        document.execCommand(command, false, undefined);
        setFormatState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough')
        });
    };
    
    // リスト挿入機能
    const insertList = () => document.execCommand('insertUnorderedList', false, undefined);
    
    // ファイル添付機能（プレースホルダー）
    const handleFileAttach = () => alert('ファイル添付機能');
    
    // 動画埋め込み機能（プレースホルダー）
    const handleVideoEmbed = () => alert('動画埋め込み機能');
    
    // ファイルアップロード機能（プレースホルダー）
    const handleFileUpload = () => alert('ファイルアップロード機能');
    
    // リンク挿入機能
    const handleLinkInsert = () => {
        const url = prompt('URLを入力してください:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    };

    // エディター内容変更処理
    const handleEditorChange = () => {
        if (editorRef.current) {
            setEditorContent(editorRef.current.innerHTML);
        }
    };

    // フォールバック用のメンバー生成関数
    const generateMembers = (count: number): Member[] => {
        const members: Member[] = [];
        for (let i = 0; i < count; i++) {
            members.push({
                id: i + 1,
                name: i === 0 ? group?.teacher || 'あなた' : `メンバー ${i}`,
                email: `member${i}@example.com`,
                avatar: i === 0 ? group?.teacher?.charAt(0) || 'あ' : 'メ',
                isAdmin: i === 0,
                onlineStatus: i % 3 === 0 ? 'online' : i % 3 === 1 ? 'away' : 'offline',
                level: Math.floor(Math.random() * 10) + 1,
                xp: Math.floor(Math.random() * 1000),
                posts: Math.floor(Math.random() * 20),
                assignments: Math.floor(Math.random() * 10),
                attendance: Math.floor(Math.random() * 40) + 60
            });
        }
        return members;
    };

    // === レンダリング処理 ===
    return (
        <GroupLayout>
            {loading && <div style={{padding: '2rem'}}>読み込み中...</div>}
            {error && <div style={{padding: '2rem', color: 'red'}}>エラー: {error}</div>}
            {!loading && !group && <div style={{padding: '2rem'}}>グループが見つかりません。</div>}
            
            {group && (
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    {/* グループ詳細ヘッダー */}
                    <div style={{ backgroundColor: '#b2dfdb', padding: '24px', position: 'relative' }}>
                        <button
                            onClick={() => router.push('/group')}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
                                borderRadius: '50%', marginBottom: '16px', transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2e7d32">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                            </svg>
                        </button>
                        <h1 style={{ fontSize: '24px', color: '#2e7d32', margin: '0 0 8px 0', fontWeight: '500' }}>
                            {group.name}
                        </h1>
                        <p style={{ fontSize: '14px', color: '#2e7d32', margin: '0', opacity: '0.8' }}>
                            {group.description}
                        </p>
                    </div>

                    {/* タブナビゲーション */}
                    <div style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff', padding: '0 24px' }}>
                        {(['お知らせ', '課題', 'メンバー'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                padding: '16px 24px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                                fontSize: '14px', fontWeight: '500', marginRight: '16px',
                                borderBottom: `2px solid ${activeTab === tab ? '#00bcd4' : 'transparent'}`,
                                color: activeTab === tab ? '#00bcd4' : '#5f6368', transition: 'all 0.2s'
                            }}>
                                {tab}
                            </button>
                        ))}
                    </div>
                    
                    {/* タブコンテンツ */}
                    <div style={{ padding: '24px', backgroundColor: '#fff' }}>
                        {/* お知らせセクション */}
                        {activeTab === 'お知らせ' && (
                            <div>
                                {/* 投稿エディター */}
                                <div style={{
                                    backgroundColor: '#f8f9fa', 
                                    border: '1px solid #e0e0e0', 
                                    borderRadius: '8px',
                                    padding: '16px', 
                                    marginBottom: '16px', 
                                    transition: 'all 0.3s ease'
                                }}>
                                    {!isEditorExpanded ? (
                                        // 縮小状態のエディター
                                        <div onClick={handleEditorExpand} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            cursor: 'text', 
                                            padding: '8px 0' 
                                        }}>
                                            {/* ユーザーアバター */}
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
                                            {/* プレースホルダーテキスト */}
                                            <div style={{ 
                                                flex: 1, 
                                                padding: '8px 12px', 
                                                fontSize: '14px', 
                                                color: '#9e9e9e' 
                                            }}>
                                                クラスへの連絡事項を入力
                                            </div>
                                        </div>
                                    ) : (
                                        // 展開状態のエディター
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
                                            
                                            {/* テキストエディター */}
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
                                            
                                            {/* フォーマットツールバー */}
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                padding: '8px 0', 
                                                borderTop: '1px solid #e0e0e0', 
                                                marginBottom: '16px' 
                                            }}>
                                                {/* 太字ボタン */}
                                                <button onClick={() => applyFormat('bold')} style={{ 
                                                    padding: '6px 8px', 
                                                    border: `1px solid ${formatState.bold ? '#a1c2fa' : '#e0e0e0'}`, 
                                                    backgroundColor: formatState.bold ? '#e3f2fd' : '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer', 
                                                    fontWeight: 'bold' 
                                                }} title="太字">B</button>
                                                
                                                {/* 斜体ボタン */}
                                                <button onClick={() => applyFormat('italic')} style={{ 
                                                    padding: '6px 8px', 
                                                    border: `1px solid ${formatState.italic ? '#a1c2fa' : '#e0e0e0'}`, 
                                                    backgroundColor: formatState.italic ? '#e3f2fd' : '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer', 
                                                    fontStyle: 'italic' 
                                                }} title="斜体">I</button>
                                                
                                                {/* 下線ボタン */}
                                                <button onClick={() => applyFormat('underline')} style={{ 
                                                    padding: '6px 8px', 
                                                    border: `1px solid ${formatState.underline ? '#a1c2fa' : '#e0e0e0'}`, 
                                                    backgroundColor: formatState.underline ? '#e3f2fd' : '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer', 
                                                    textDecoration: 'underline' 
                                                }} title="下線">U</button>
                                                
                                                {/* 取り消し線ボタン */}
                                                <button onClick={() => applyFormat('strikeThrough')} style={{ 
                                                    padding: '6px 8px', 
                                                    border: `1px solid ${formatState.strikethrough ? '#a1c2fa' : '#e0e0e0'}`, 
                                                    backgroundColor: formatState.strikethrough ? '#e3f2fd' : '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer', 
                                                    textDecoration: 'line-through' 
                                                }} title="取り消し線">S</button>
                                                
                                                {/* リストボタン */}
                                                <button onClick={insertList} style={{ 
                                                    padding: '6px 8px', 
                                                    border: '1px solid #e0e0e0', 
                                                    backgroundColor: '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer' 
                                                }} title="リスト">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                        <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                                                    </svg>
                                                </button>
                                                
                                                {/* 区切り線 */}
                                                <div style={{ 
                                                    width: '1px', 
                                                    height: '24px', 
                                                    backgroundColor: '#e0e0e0', 
                                                    margin: '0 4px' 
                                                }} />
                                                
                                                {/* ファイル添付ボタン */}
                                                <button onClick={handleFileAttach} style={{ 
                                                    padding: '6px 8px', 
                                                    border: '1px solid #e0e0e0', 
                                                    backgroundColor: '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer' 
                                                }} title="ファイル添付">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                        <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                                                    </svg>
                                                </button>
                                                
                                                {/* 動画埋め込みボタン */}
                                                <button onClick={handleVideoEmbed} style={{ 
                                                    padding: '6px 8px', 
                                                    border: '1px solid #e0e0e0', 
                                                    backgroundColor: '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer' 
                                                }} title="動画">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                        <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                                    </svg>
                                                </button>
                                                
                                                {/* ファイルアップロードボタン */}
                                                <button onClick={handleFileUpload} style={{ 
                                                    padding: '6px 8px', 
                                                    border: '1px solid #e0e0e0', 
                                                    backgroundColor: '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer' 
                                                }} title="アップロード">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                                                    </svg>
                                                </button>
                                                
                                                {/* リンク挿入ボタン */}
                                                <button onClick={handleLinkInsert} style={{ 
                                                    padding: '6px 8px', 
                                                    border: '1px solid #e0e0e0', 
                                                    backgroundColor: '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer' 
                                                }} title="リンク">
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
                                                {/* キャンセルボタン */}
                                                <button onClick={handleEditorCollapse} style={{ 
                                                    padding: '8px 16px', 
                                                    border: '1px solid #e0e0e0', 
                                                    backgroundColor: '#fff', 
                                                    color: '#5f6368', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer', 
                                                    fontSize: '14px', 
                                                    fontWeight: '500' 
                                                }}>
                                                    キャンセル
                                                </button>
                                                
                                                {/* 投稿ボタン */}
                                                <button onClick={handlePost} style={{ 
                                                    padding: '8px 16px', 
                                                    border: 'none', 
                                                    backgroundColor: '#2196f3', 
                                                    color: '#fff', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer', 
                                                    fontSize: '14px', 
                                                    fontWeight: '500' 
                                                }}>
                                                    投稿
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 投稿一覧表示 */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {posts.map((post) => (
                                        <div 
                                            key={post.id} 
                                            id={`post-${post.id}`}
                                            style={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                padding: '16px',
                                                position: 'relative',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {/* 投稿ヘッダー */}
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'space-between',
                                                marginBottom: '12px' 
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    {/* 投稿者アバター */}
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        backgroundColor: '#4caf50',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginRight: '12px',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {post.author.charAt(0)}
                                                    </div>
                                                    
                                                    {/* 投稿者情報 */}
                                                    <div>
                                                        <div style={{ 
                                                            fontSize: '16px', 
                                                            fontWeight: '500', 
                                                            color: '#3c4043',
                                                            marginBottom: '2px'
                                                        }}>
                                                            {post.author}
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '14px', 
                                                            color: '#5f6368' 
                                                        }}>
                                                            {post.date}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 投稿メニューボタン - 編集モードでない場合のみ表示 */}
                                                {!post.isEditing && (
                                                    <div style={{ position: 'relative' }}>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                togglePostMenu(post.id);
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '4px',
                                                                borderRadius: '50%',
                                                                opacity: 0.7
                                                            }}
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                                                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                                            </svg>
                                                        </button>

                                                        {/* ドロップダウンメニュー */}
                                                        {post.showMenu && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '100%',
                                                                right: 0,
                                                                backgroundColor: '#fff',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                                                zIndex: 1000,
                                                                minWidth: '150px',
                                                                overflow: 'hidden',
                                                                animation: 'fadeIn 0.2s ease-out'
                                                            }}>
                                                                <div style={{ padding: '8px 0' }}>
                                                                    {/* リンクコピー */}
                                                                    <button
                                                                        onClick={() => copyPostLink(post.id)}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '12px 16px',
                                                                            border: 'none',
                                                                            backgroundColor: 'transparent',
                                                                            fontSize: '14px',
                                                                            color: '#3c4043',
                                                                            cursor: 'pointer',
                                                                            textAlign: 'left',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '12px' }}>
                                                                            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.9C4.29 7 2.2 9.09 2.2 11.7s2.09 4.7 4.7 4.7H11v-1.9H6.9c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.1c2.61 0 4.7 2.09 4.7 4.7s-2.09 4.7-4.7 4.7H13v1.9h4.1c2.61 0 4.7-2.09 4.7-4.7S19.71 7 17.1 7H13v1.9z"/>
                                                                        </svg>
                                                                        リンクをコピー
                                                                    </button>

                                                                    {/* 編集 */}
                                                                    <button
                                                                        onClick={() => editPost(post.id)}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '12px 16px',
                                                                            border: 'none',
                                                                            backgroundColor: 'transparent',
                                                                            fontSize: '14px',
                                                                            color: '#3c4043',
                                                                            cursor: 'pointer',
                                                                            textAlign: 'left',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '12px' }}>
                                                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                                                        </svg>
                                                                        編集
                                                                    </button>

                                                                    {/* 削除 */}
                                                                    <button
                                                                        onClick={() => deletePost(post.id)}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '12px 16px',
                                                                            border: 'none',
                                                                            backgroundColor: 'transparent',
                                                                            fontSize: '14px',
                                                                            color: '#d32f2f',
                                                                            cursor: 'pointer',
                                                                            textAlign: 'left',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '12px' }}>
                                                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                                                        </svg>
                                                                        削除
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 投稿内容 - 編集モードと通常モードを切り替え */}
                                            {post.isEditing ? (
                                                // 編集モード - 投稿編集用のUIを追加
                                                <div style={{ marginBottom: '16px' }}>
                                                    <textarea
                                                        value={editingPosts[post.id] || ''}
                                                        onChange={(e) => updateEditingPost(post.id, e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            minHeight: '120px',
                                                            padding: '12px',
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: '4px',
                                                            fontSize: '14px',
                                                            lineHeight: '1.6',
                                                            resize: 'vertical',
                                                            outline: 'none',
                                                            marginBottom: '12px'
                                                        }}
                                                        placeholder="投稿内容を編集..."
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => cancelEditPost(post.id)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: '#fff',
                                                                color: '#5f6368',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            キャンセル
                                                        </button>
                                                        <button
                                                            onClick={() => saveEditPost(post.id)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                border: 'none',
                                                                backgroundColor: '#1976d2',
                                                                color: '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            保存
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // 通常表示モード
                                                <div 
                                                    style={{
                                                        fontSize: '14px',
                                                        lineHeight: '1.6',
                                                        color: '#3c4043',
                                                        marginBottom: '16px',
                                                        whiteSpace: 'pre-wrap'
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: post.content }}
                                                />
                                            )}

                                            {/* コメント表示切り替えボタン - 編集モードでない場合のみ表示 */}
                                            {!post.isEditing && post.comments && post.comments.length > 0 && (
                                                <button
                                                    onClick={() => toggleComments(post.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#1976d2',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        marginBottom: '12px',
                                                        padding: '4px 0'
                                                    }}
                                                >
                                                    {post.showComments ? 'コメントを非表示' : `${post.comments.length}件のコメントを表示`}
                                                </button>
                                            )}

                                            {/* コメント一覧表示 - 編集モードでない場合のみ表示 */}
                                            {!post.isEditing && post.showComments && post.comments && post.comments.length > 0 && (
                                                <div style={{
                                                    marginBottom: '16px',
                                                    paddingLeft: '16px',
                                                    borderLeft: '2px solid #f0f0f0'
                                                }}>
                                                    {post.comments.map((comment) => (
                                                        <div key={comment.id} style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '8px',
                                                            marginBottom: '12px',
                                                            padding: '8px',
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '8px',
                                                            position: 'relative'
                                                        }}>
                                                            {/* コメント投稿者のアバター */}
                                                            <div style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#1976d2',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '12px',
                                                                color: '#fff',
                                                                flexShrink: 0
                                                            }}>
                                                                {comment.avatar || comment.author.charAt(0)}
                                                            </div>
                                                            
                                                            {/* コメント内容 */}
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{
                                                                    fontSize: '12px',
                                                                    color: '#5f6368',
                                                                    marginBottom: '2px'
                                                                }}>
                                                                    {comment.author} • {comment.date}
                                                                </div>
                                                                
                                                                {comment.isEditing ? (
                                                                    // 編集モード
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                        <input
                                                                            type="text"
                                                                            value={editingComments[comment.id] || ''}
                                                                            onChange={(e) => updateEditingComment(comment.id, e.target.value)}
                                                                            style={{
                                                                                padding: '4px 8px',
                                                                                border: '1px solid #e0e0e0',
                                                                                borderRadius: '4px',
                                                                                fontSize: '14px'
                                                                            }}
                                                                        />
                                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                                            <button
                                                                                onClick={() => saveEditComment(post.id, comment.id)}
                                                                                style={{
                                                                                    padding: '4px 8px',
                                                                                    border: 'none',
                                                                                    backgroundColor: '#1976d2',
                                                                                    color: '#fff',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '12px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                保存
                                                                            </button>
                                                                            <button
                                                                                onClick={() => cancelEditComment(post.id, comment.id)}
                                                                                style={{
                                                                                    padding: '4px 8px',
                                                                                    border: '1px solid #e0e0e0',
                                                                                    backgroundColor: '#fff',
                                                                                    color: '#5f6368',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '12px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                キャンセル
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    // 通常表示モード
                                                                    <div style={{
                                                                        fontSize: '14px',
                                                                        color: '#3c4043',
                                                                        lineHeight: '1.4'
                                                                    }}>
                                                                        {comment.content}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* コメント三点メニューボタン */}
                                                            {!comment.isEditing && (
                                                                <div style={{ position: 'relative' }}>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleCommentMenu(post.id, comment.id);
                                                                        }}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            padding: '2px',
                                                                            borderRadius: '50%',
                                                                            opacity: 0.7
                                                                        }}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                                                        </svg>
                                                                    </button>
                                                                    
                                                                    {/* コメント用ドロップダウンメニュー */}
                                                                    {comment.showMenu && (
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '100%',
                                                                            right: '0',
                                                                            backgroundColor: '#fff',
                                                                            border: '1px solid #e0e0e0',
                                                                            borderRadius: '4px',
                                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                            zIndex: 1000,
                                                                            minWidth: '80px'
                                                                        }}>
                                                                            <button
                                                                                onClick={() => startEditComment(post.id, comment.id, comment.content)}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '8px 12px',
                                                                                    border: 'none',
                                                                                    backgroundColor: 'transparent',
                                                                                    fontSize: '12px',
                                                                                    color: '#3c4043',
                                                                                    cursor: 'pointer',
                                                                                    textAlign: 'left'
                                                                                }}
                                                                            >
                                                                                編集
                                                                            </button>
                                                                            <button
                                                                                onClick={() => deleteComment(post.id, comment.id)}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '8px 12px',
                                                                                    border: 'none',
                                                                                    backgroundColor: 'transparent',
                                                                                    fontSize: '12px',
                                                                                    color: '#d32f2f',
                                                                                    cursor: 'pointer',
                                                                                    textAlign: 'left'
                                                                                }}
                                                                            >
                                                                                削除
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* コメント入力エリア - 編集モードでない場合のみ表示 */}
                                            {!post.isEditing && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginTop: '16px',
                                                    paddingTop: '16px',
                                                    borderTop: '1px solid #f0f0f0'
                                                }}>
                                                    {/* ユーザーアバター */}
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#1976d2',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                        </svg>
                                                    </div>
                                                    
                                                    {/* コメント入力フィールド */}
                                                    <input
                                                        type="text"
                                                        placeholder="クラスのコメントを追加..."
                                                        value={commentInputs[post.id] || ''}
                                                        onChange={(e) => updateCommentInput(post.id, e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                addComment(post.id);
                                                            }
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            padding: '8px 12px',
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: '20px',
                                                            fontSize: '14px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    
                                                    {/* コメント送信ボタン */}
                                                    <button 
                                                        onClick={() => addComment(post.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '8px',
                                                            borderRadius: '50%',
                                                            color: '#1976d2'
                                                        }}
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* 投稿がない場合のメッセージ */}
                                {posts.length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                        color: '#5f6368',
                                        fontSize: '14px'
                                    }}>
                                        まだ投稿がありません。最初の投稿を作成してみましょう。
                                    </div>
                                )}
                            </div>
                        )}

{activeTab === '課題' && (
                            <div>
                                {kadaiViewMode === 'list' && (
                                    <div>
                                        <h2 style={{
                                            fontSize: '20px',
                                            fontWeight: '500',
                                            color: '#3c4043',
                                            marginBottom: '24px'
                                        }}>
                                            課題一覧
                                        </h2>

                                        {/* 課題作成ボタン */}
                                        <div style={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            marginBottom: '24px',
                                            overflow: 'hidden'
                                        }}>
                                            {!isKadaiEditorExpanded ? (
                                                <div
                                                    onClick={handleKadaiEditorExpand}
                                                    style={{
                                                        padding: '16px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: '#5f6368',
                                                        fontSize: '14px',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#ff9800',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginRight: '12px'
                                                    }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                                        </svg>
                                                    </div>
                                                    新しい課題を作成
                                                </div>
                                            ) : (
                                                <div>
                                                    {/* 課題タイトル入力 */}
                                                    <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
                                                        <input
                                                            type="text"
                                                            value={kadaiTitle}
                                                            onChange={(e) => setKadaiTitle(e.target.value)}
                                                            placeholder="課題のタイトルを入力..."
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '4px',
                                                                fontSize: '16px',
                                                                fontWeight: '500'
                                                            }}
                                                        />
                                                    </div>

                                                    {/* ツールバー */}
                                                    <div style={{
                                                        padding: '12px 16px',
                                                        borderBottom: '1px solid #e0e0e0',
                                                        display: 'flex',
                                                        gap: '8px',
                                                        alignItems: 'center'
                                                    }}>
                                                        <button
                                                            onClick={() => applyKadaiFormat('bold')}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: kadaiFormatState.bold ? '#e8f0fe' : '#fff',
                                                                color: kadaiFormatState.bold ? '#1976d2' : '#5f6368',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            B
                                                        </button>
                                                        <button
                                                            onClick={() => applyKadaiFormat('italic')}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: kadaiFormatState.italic ? '#e8f0fe' : '#fff',
                                                                color: kadaiFormatState.italic ? '#1976d2' : '#5f6368',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                fontStyle: 'italic'
                                                            }}
                                                        >
                                                            I
                                                        </button>
                                                        <button
                                                            onClick={() => applyKadaiFormat('underline')}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: kadaiFormatState.underline ? '#e8f0fe' : '#fff',
                                                                color: kadaiFormatState.underline ? '#1976d2' : '#5f6368',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                textDecoration: 'underline'
                                                            }}
                                                        >
                                                            U
                                                        </button>
                                                        <button
                                                            onClick={() => applyKadaiFormat('strikeThrough')}
                                                            style={{
                                                                padding: '6px 8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: kadaiFormatState.strikethrough ? '#e8f0fe' : '#fff',
                                                                color: kadaiFormatState.strikethrough ? '#1976d2' : '#5f6368',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                textDecoration: 'line-through'
                                                            }}
                                                        >
                                                            S
                                                        </button>
                                                    </div>

                                                    {/* 課題説明エディター */}
                                                    <div
                                                        ref={kadaiEditorRef}
                                                        contentEditable
                                                        onInput={handleKadaiEditorChange}
                                                        data-placeholder="課題の詳細説明を入力..."
                                                        style={{
                                                            padding: '16px',
                                                            minHeight: '120px',
                                                            fontSize: '14px',
                                                            lineHeight: '1.5',
                                                            outline: 'none',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                    </div>

                                                    {/* 期限設定 */}
                                                    <div style={{
                                                        padding: '16px',
                                                        borderTop: '1px solid #e0e0e0',
                                                        borderBottom: '1px solid #e0e0e0'
                                                    }}>
                                                        <label style={{
                                                            display: 'block',
                                                            fontSize: '14px',
                                                            color: '#3c4043',
                                                            marginBottom: '8px'
                                                        }}>
                                                            期限
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            value={kadaiDueDate}
                                                            onChange={(e) => setKadaiDueDate(e.target.value)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '4px',
                                                                fontSize: '14px'
                                                            }}
                                                        />
                                                    </div>

                                                    {/* アクションボタン */}
                                                    <div style={{
                                                        padding: '12px 16px',
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        gap: '12px'
                                                    }}>
                                                        <button
                                                            onClick={handleKadaiEditorCollapse}
                                                            style={{
                                                                padding: '8px 16px',
                                                                border: 'none',
                                                                backgroundColor: 'transparent',
                                                                color: '#5f6368',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            キャンセル
                                                        </button>
                                                        <button
                                                            onClick={handleKadaiCreate}
                                                            style={{
                                                                padding: '8px 16px',
                                                                border: 'none',
                                                                backgroundColor: '#1976d2',
                                                                color: '#fff',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            課題を作成
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* 課題一覧 */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px'
                                        }}>
                                            {kadaiList.length === 0 ? (
                                                <div style={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '8px',
                                                    padding: '32px',
                                                    textAlign: 'center',
                                                    color: '#5f6368'
                                                }}>
                                                    現在課題はありません。
                                                </div>
                                            ) : (
                                                kadaiList.map((kadai) => (
                                                    <div
                                                        key={kadai.id}
                                                        style={{
                                                            backgroundColor: '#fff',
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: '8px',
                                                            padding: '16px',
                                                            cursor: 'pointer',
                                                            transition: 'box-shadow 0.2s'
                                                        }}
                                                        onClick={() => handleKadaiDetail(kadai)}
                                                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                                    >
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'flex-start',
                                                            marginBottom: '12px'
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}>
                                                                <div style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: '#4caf50',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    marginRight: '12px'
                                                                }}>
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                                                                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <div style={{
                                                                        fontSize: '14px',
                                                                        color: '#5f6368'
                                                                    }}>
                                                                        管理者さんが新しい課題を投稿しました:
                                                                    </div>
                                                                    <h3 style={{
                                                                        fontSize: '16px',
                                                                        fontWeight: '500',
                                                                        color: '#3c4043',
                                                                        margin: '4px 0 0 0'
                                                                    }}>
                                                                        {kadai.title}
                                                                    </h3>
                                                                </div>
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                gap: '8px'
                                                            }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleKadaiEdit(kadai);
                                                                    }}
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        border: '1px solid #1976d2',
                                                                        backgroundColor: 'transparent',
                                                                        color: '#1976d2',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    編集
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleKadaiDelete(kadai);
                                                                    }}
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        border: '1px solid #d32f2f',
                                                                        backgroundColor: 'transparent',
                                                                        color: '#d32f2f',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    削除
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            color: '#5f6368',
                                                            marginLeft: '44px'
                                                        }}>
                                                            投稿日: {new Date(kadai.createdAt).toLocaleDateString('ja-JP')}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            color: '#5f6368',
                                                            marginLeft: '44px'
                                                        }}>
                                                            期限: {kadai.dueDate ? new Date(kadai.dueDate).toLocaleString('ja-JP') : '未設定'}
                                                        </div>

                                                        {/* コメント表示切り替えボタン */}
                                                        {kadai.comments && kadai.comments.length > 0 && (
                                                            <button
                                                                onClick={() => toggleComments(kadai.id)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: '#1976d2',
                                                                    cursor: 'pointer',
                                                                    fontSize: '14px',
                                                                    marginBottom: '12px',
                                                                    padding: '4px 0'
                                                                }}
                                                            >
                                                                {kadai.showComments ? 'コメントを非表示' : `${kadai.comments.length}件のコメントを表示`}
                                                            </button>
                                                        )}

                                                        {/* コメント一覧表示 */}
                                                        {kadai.showComments && kadai.comments && kadai.comments.length > 0 && (
                                                            <div style={{
                                                                marginBottom: '16px',
                                                                paddingLeft: '16px',
                                                                borderLeft: '2px solid #f0f0f0'
                                                            }}>
                                                                {kadai.comments.map((comment) => (
                                                                    <div key={comment.id} style={{
                                                                        display: 'flex',
                                                                        alignItems: 'flex-start',
                                                                        gap: '8px',
                                                                        marginBottom: '12px',
                                                                        padding: '8px',
                                                                        backgroundColor: '#f8f9fa',
                                                                        borderRadius: '8px',
                                                                        position: 'relative'
                                                                    }}>
                                                                        {/* コメント投稿者のアバター */}
                                                                        <div style={{
                                                                            width: '24px',
                                                                            height: '24px',
                                                                            borderRadius: '50%',
                                                                            backgroundColor: '#1976d2',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: '12px',
                                                                            color: '#fff',
                                                                            flexShrink: 0
                                                                        }}>
                                                                            {comment.avatar || comment.author.charAt(0)}
                                                                        </div>
                                                                        
                                                                        {/* コメント内容 */}
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{
                                                                                fontSize: '12px',
                                                                                color: '#5f6368',
                                                                                marginBottom: '2px'
                                                                            }}>
                                                                                {comment.author} • {comment.date}
                                                                            </div>
                                                                            
                                                                            {comment.isEditing ? (
                                                                                // 編集モード
                                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editingComments[comment.id] || ''}
                                                                                        onChange={(e) => updateEditingComment(comment.id, e.target.value)}
                                                                                        style={{
                                                                                            padding: '4px 8px',
                                                                                            border: '1px solid #e0e0e0',
                                                                                            borderRadius: '4px',
                                                                                            fontSize: '14px'
                                                                                        }}
                                                                                    />
                                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                                        <button
                                                                                            onClick={() => saveEditComment(kadai.id, comment.id)}
                                                                                            style={{
                                                                                                padding: '4px 8px',
                                                                                                border: 'none',
                                                                                                backgroundColor: '#1976d2',
                                                                                                color: '#fff',
                                                                                                borderRadius: '4px',
                                                                                                fontSize: '12px',
                                                                                                cursor: 'pointer'
                                                                                            }}
                                                                                        >
                                                                                            保存
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => cancelEditComment(kadai.id, comment.id)}
                                                                                            style={{
                                                                                                padding: '4px 8px',
                                                                                                border: '1px solid #e0e0e0',
                                                                                                backgroundColor: '#fff',
                                                                                                color: '#5f6368',
                                                                                                borderRadius: '4px',
                                                                                                fontSize: '12px',
                                                                                                cursor: 'pointer'
                                                                                            }}
                                                                                        >
                                                                                            キャンセル
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                // 通常表示モード
                                                                                <div style={{
                                                                                    fontSize: '14px',
                                                                                    color: '#3c4043',
                                                                                    lineHeight: '1.4'
                                                                                }}>
                                                                                    {comment.content}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* コメント三点メニューボタン */}
                                                                        {!comment.isEditing && (
                                                                            <div style={{ position: 'relative' }}>
                                                                                <button 
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        toggleCommentMenu(kadai.id, comment.id);
                                                                                    }}
                                                                                    style={{
                                                                                        background: 'none',
                                                                                        border: 'none',
                                                                                        cursor: 'pointer',
                                                                                        padding: '2px',
                                                                                        borderRadius: '50%',
                                                                                        opacity: 0.7
                                                                                    }}
                                                                                >
                                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                                                                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                                                                    </svg>
                                                                                </button>
                                                                                
                                                                                {/* コメント用ドロップダウンメニュー */}
                                                                                {comment.showMenu && (
                                                                                    <div style={{
                                                                                        position: 'absolute',
                                                                                        top: '100%',
                                                                                        right: '0',
                                                                                        backgroundColor: '#fff',
                                                                                        border: '1px solid #e0e0e0',
                                                                                        borderRadius: '4px',
                                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                                        zIndex: 1000,
                                                                                        minWidth: '80px'
                                                                                    }}>
                                                                                        <button
                                                                                            onClick={() => startEditComment(kadai.id, comment.id, comment.content)}
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                padding: '8px 12px',
                                                                                                border: 'none',
                                                                                                backgroundColor: 'transparent',
                                                                                                fontSize: '12px',
                                                                                                color: '#3c4043',
                                                                                                cursor: 'pointer',
                                                                                                textAlign: 'left'
                                                                                            }}
                                                                                        >
                                                                                            編集
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => deleteComment(kadai.id, comment.id)}
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                padding: '8px 12px',
                                                                                                border: 'none',
                                                                                                backgroundColor: 'transparent',
                                                                                                fontSize: '12px',
                                                                                                color: '#d32f2f',
                                                                                                cursor: 'pointer',
                                                                                                textAlign: 'left'
                                                                                            }}
                                                                                        >
                                                                                            削除
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* コメント入力エリア */}
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            marginTop: '16px',
                                                            paddingTop: '16px',
                                                            borderTop: '1px solid #f0f0f0'
                                                        }}>
                                                            {/* ユーザーアバター */}
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#1976d2',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                                </svg>
                                                            </div>
                                                            
                                                            {/* コメント入力フィールド */}
                                                            <input
                                                                type="text"
                                                                placeholder="クラスのコメントを追加..."
                                                                value={commentInputs[kadai.id] || ''}
                                                                onChange={(e) => updateCommentInput(kadai.id, e.target.value)}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        addComment(kadai.id);
                                                                    }
                                                                }}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '8px 12px',
                                                                    border: '1px solid #e0e0e0',
                                                                    borderRadius: '20px',
                                                                    fontSize: '14px',
                                                                    outline: 'none'
                                                                }}
                                                            />
                                                            
                                                            {/* コメント送信ボタン */}
                                                            <button 
                                                                onClick={() => addComment(kadai.id)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    padding: '8px',
                                                                    borderRadius: '50%',
                                                                    color: '#1976d2'
                                                                }}
                                                            >
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 課題詳細表示 */}
                                {kadaiViewMode === 'detail' && selectedKadai && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '24px'
                                    }}>
                                        {/* メインコンテンツ */}
                                        <div style={{
                                            flex: 1
                                        }}>
                                            <button
                                                onClick={handleKadaiBackToList}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#1976d2',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    marginBottom: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                                </svg>
                                                課題一覧に戻る
                                            </button>

                                            <div style={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                padding: '24px'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '16px'
                                                }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#4caf50',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginRight: '16px'
                                                    }}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                                                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h1 style={{
                                                            fontSize: '24px',
                                                            fontWeight: '500',
                                                            color: '#3c4043',
                                                            margin: '0 0 4px 0'
                                                        }}>
                                                            {selectedKadai.title}
                                                        </h1>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            color: '#5f6368'
                                                        }}>
                                                            管理者 • {new Date(selectedKadai.createdAt).toLocaleDateString('ja-JP')}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            color: '#5f6368'
                                                        }}>
                                                            100 点
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#5f6368',
                                                    marginBottom: '16px'
                                                }}>
                                                    期限: {selectedKadai.dueDate ? new Date(selectedKadai.dueDate).toLocaleString('ja-JP') : '未設定'}
                                                </div>

                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#5f6368',
                                                    marginBottom: '24px'
                                                }}>
            
                                                </div>

                                                {selectedKadai.description && (
                                                    <div
                                                        style={{
                                                            fontSize: '14px',
                                                            lineHeight: '1.6',
                                                            color: '#3c4043',
                                                            marginBottom: '24px'
                                                        }}
                                                        dangerouslySetInnerHTML={{ __html: selectedKadai.description }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        

                                        {/* サイドバー（課題詳細表示時のみ） */}
                                        {kadaiViewMode === 'detail' && (
                                            <div style={{
                                                width: '300px',
                                                backgroundColor: '#fff',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                padding: '16px',
                                                position: 'relative'
                                            }}>
                                                <h3 style={{
                                                    fontSize: '16px',
                                                    fontWeight: '500',
                                                    color: '#3c4043',
                                                    margin: '0 0 16px 0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}>
                                                    あなたの課題
                                                    <span style={{
                                                        fontSize: '12px',
                                                        color: '#34a853',
                                                        fontWeight: 'normal'
                                                    }}>
                                                        割り当て済み
                                                    </span>
                                                </h3>

                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={() => setShowKadaiOptions(!showKadaiOptions)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px',
                                                            border: '1px solid #1976d2',
                                                            backgroundColor: 'transparent',
                                                            color: '#1976d2',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            marginBottom: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px'
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                                        </svg>
                                                        追加または作成
                                                    </button>

                                                    {showKadaiOptions && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '100%',
                                                            left: 0,
                                                            right: 0,
                                                            backgroundColor: '#fff',
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                                            zIndex: 1000,
                                                            minWidth: '200px',
                                                            overflow: 'hidden',
                                                            animation: 'fadeIn 0.2s ease-out'
                                                        }}>
                                                            <div style={{ padding: '8px 0' }}>
                                                                <div onClick={() => alert('Google ドライブ')}
                                                                    style={{
                                                                        padding: '12px 16px',
                                                                        fontSize: '14px',
                                                                        color: '#3c4043',
                                                                        cursor: 'pointer',
                                                                        transition: 'background-color 0.2s',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368" style={{ marginRight: '12px' }}>
                                                                        <path d="M19.5 9.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                                                    </svg>
                                                                    Google ドライブ
                                                                </div>
                                                                <div onClick={() => alert('リンク')}
                                                                    style={{
                                                                        padding: '12px 16px',
                                                                        fontSize: '14px',
                                                                        color: '#3c4043',
                                                                        cursor: 'pointer',
                                                                        transition: 'background-color 0.2s',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368" style={{ marginRight: '12px' }}>
                                                                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.9C4.29 7 2.2 9.09 2.2 11.7s2.09 4.7 4.7 4.7H11v-1.9H6.9c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.1c2.61 0 4.7 2.09 4.7 4.7s-2.09 4.7-4.7 4.7H13v1.9h4.1c2.61 0 4.7-2.09 4.7-4.7S19.71 7 17.1 7H13v1.9z"/>
                                                                    </svg>
                                                                    リンク
                                                                </div>
                                                                <div onClick={() => alert('ファイル')}
                                                                    style={{
                                                                        padding: '12px 16px',
                                                                        fontSize: '14px',
                                                                        color: '#3c4043',
                                                                        cursor: 'pointer',
                                                                        transition: 'background-color 0.2s',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368" style={{ marginRight: '12px' }}>
                                                                        <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v11.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                                                                    </svg>
                                                                    ファイル
                                                                </div>
                                                                <div onClick={() => alert('link copy')}
                                                                    style={{
                                                                        padding: '12px 16px',
                                                                        fontSize: '14px',
                                                                        color: '#3c4043',
                                                                        cursor: 'pointer',
                                                                        transition: 'background-color 0.2s',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368" style={{ marginRight: '12px' }}>
                                                                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                                                    </svg>
                                                                    link copy
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        border: 'none',
                                                        backgroundColor: '#1976d2',
                                                        color: '#fff',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        marginBottom: '16px'
                                                    }}
                                                >
                                                    完了としてマーク
                                                </button>

                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontSize: '14px',
                                                    color: '#5f6368',
                                                    marginBottom: '8px'
                                                }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                    </svg>
                                                    限定公開のコメント
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#1976d2',
                                                    cursor: 'pointer'
                                                }}>
                                                    管理者 先生へのコメントを追加する
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}


                        {/* メンバータブ */}
                        {activeTab === 'メンバー' && (
                            <div>
                                <h3 style={{ fontSize: '18px', color: '#3c4043', margin: '0 0 16px 0', fontWeight: '500' }}>メンバー ({group.memberCount}人)</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                                    {generateMembers(group.memberCount).map(member => (
                                        <div key={member.id} style={{ display: 'flex', alignItems: 'center', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', backgroundColor: '#00bcd4', color: '#fff', fontSize: '12px' }}>
                                                {member.avatar}
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#3c4043' }}>{member.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </GroupLayout>
    );
};

export default GroupDetailPage;

