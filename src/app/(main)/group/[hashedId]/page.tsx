'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupLayout } from '../GroupLayout';

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
    avatar: string;
}

interface FormatState {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
}

// 課題データの型定義（優先度フィールドを削除）
interface Kadai {
    id: number; // 課題の一意識別子を追加
    title: string;
    description: string; // HTMLコンテンツを格納
    dueDate: string;
    progress: number;
    createdAt: string;
}

const GroupDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const hashedId = params.hashedId as string;

    // === State管理 ===
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'お知らせ' | '課題' | 'メンバー'>('お知らせ');
    const [isEditorExpanded, setIsEditorExpanded] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [formatState, setFormatState] = useState<FormatState>({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false
    });
    const [showKadaiOptions, setShowKadaiOptions] = useState(false);

    // 課題関連の状態（優先度を削除し、リッチエディター用の状態を追加）
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
    const handleKadaiDetail = (kadai: Kadai): void => {
        setSelectedKadai(kadai);
        setKadaiViewMode('detail');
    };

    // 課題の表示状態管理（3つの状態）
    const [selectedKadai, setSelectedKadai] = useState<Kadai | null>(null); // 選択された課題
    const [kadaiViewMode, setKadaiViewMode] = useState<'list' | 'expanded' | 'detail'>('list'); // 表示モード

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
    const handleEditorExpand = () => {
        setIsEditorExpanded(true);
        setTimeout(() => editorRef.current?.focus(), 100);
    };

    const handleEditorCollapse = () => {
        setIsEditorExpanded(false);
        setEditorContent('');
        setFormatState({ bold: false, italic: false, underline: false, strikethrough: false });
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
            id: Date.now(), // 簡単な一意IDを生成
            title: kadaiTitle,
            description: kadaiDescription, // HTMLコンテンツを保存
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
        
        // リッチエディターの内容を設定
        setTimeout(() => {
            if (kadaiEditorRef.current) {
                kadaiEditorRef.current.innerHTML = kadai.description;
            }
        }, 100);
        
        // Remove the old task (will be replaced when user saves)
        setKadaiList(kadaiList.filter((k) => k.id !== kadai.id));
    };

    // 課題削除処理
    const handleKadaiDelete = (kadai: Kadai): void => {
        if (confirm('この課題を削除しますか？')) {
            setKadaiList(kadaiList.filter((k) => k.id !== kadai.id));
        }
    };

    // 課題クリック処理（お知らせスタイルの展開表示）
    const handleKadaiClick = (kadai: Kadai): void => {
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
        
        // 状態を更新
        setKadaiFormatState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough')
        });
    };

    // 課題エディター用リスト作成
    const insertKadaiList = (): void => {
        document.execCommand('insertUnorderedList', false, undefined);
    };

    // 課題エディター用ファイル添付（ダミー実装）
    const handleKadaiFileAttach = (): void => {
        alert('課題ファイル添付機能');
    };

    // 課題エディター用動画埋め込み（ダミー実装）
    const handleKadaiVideoEmbed = (): void => {
        alert('課題動画埋め込み機能');
    };

    // 課題エディター用ファイルアップロード（ダミー実装）
    const handleKadaiFileUpload = (): void => {
        alert('課題ファイルアップロード機能');
    };

    // 課題エディター用リンク挿入
    const handleKadaiLinkInsert = (): void => {
        const url = prompt('URLを入力してください:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    };


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
            alert('投稿に成功しました！');
            handleEditorCollapse();
        } catch (error) {
            console.error('投稿エラー:', error);
            alert(`投稿に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
    };

    const applyFormat = (command: string) => {
        document.execCommand(command, false, undefined);
        setFormatState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough')
        });
    };
    
    const insertList = () => document.execCommand('insertUnorderedList', false, undefined);
    const handleFileAttach = () => alert('ファイル添付機能');
    const handleVideoEmbed = () => alert('動画埋め込み機能');
    const handleFileUpload = () => alert('ファイルアップロード機能');
    const handleLinkInsert = () => {
        const url = prompt('URLを入力してください:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    };

    const handleEditorChange = () => {
        if (editorRef.current) {
            setEditorContent(editorRef.current.innerHTML);
        }
    };

    const generateMembers = (count: number): Member[] => {
        const members: Member[] = [];
        for (let i = 0; i < count; i++) {
            members.push({
                id: i + 1,
                name: i === 0 ? group?.teacher || 'あなた' : `メンバー ${i}`,
                avatar: i === 0 ? group?.teacher?.charAt(0) || 'あ' : 'メ'
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
                        {activeTab === 'お知らせ' && (
                            <div>
                                <div style={{
                                    backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '8px',
                                    padding: '16px', marginBottom: '16px', transition: 'all 0.3s ease'
                                }}>
                                    {!isEditorExpanded ? (
                                        <div onClick={handleEditorExpand} style={{ display: 'flex', alignItems: 'center', cursor: 'text', padding: '8px 0' }}>
                                            <div style={{
                                                width: '32px', height: '32px', backgroundColor: '#00bcd4', borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px'
                                            }}>
                                                <span style={{ color: '#fff', fontSize: '14px' }}>ク</span>
                                            </div>
                                            <div style={{ flex: 1, padding: '8px 12px', fontSize: '14px', color: '#9e9e9e' }}>
                                                クラスへの連絡事項を入力
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ animation: 'expandEditor 0.3s ease-out' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                                <div style={{ width: '32px', height: '32px', backgroundColor: '#00bcd4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                                                    <span style={{ color: '#fff', fontSize: '14px' }}>ク</span>
                                                </div>
                                                <span style={{ fontSize: '14px', color: '#3c4043' }}>クラスへの連絡事項を入力</span>
                                            </div>
                                            <div ref={editorRef} contentEditable onInput={handleEditorChange} style={{ minHeight: '120px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '4px', backgroundColor: '#fff', fontSize: '14px', lineHeight: '1.5', outline: 'none', marginBottom: '16px' }} data-placeholder="内容を入力してください..." />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderTop: '1px solid #e0e0e0', marginBottom: '16px' }}>
                                                <button onClick={() => applyFormat('bold')} style={{ padding: '6px 8px', border: `1px solid ${formatState.bold ? '#a1c2fa' : '#e0e0e0'}`, backgroundColor: formatState.bold ? '#e3f2fd' : '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} title="太字">B</button>
                                                <button onClick={() => applyFormat('italic')} style={{ padding: '6px 8px', border: `1px solid ${formatState.italic ? '#a1c2fa' : '#e0e0e0'}`, backgroundColor: formatState.italic ? '#e3f2fd' : '#fff', borderRadius: '4px', cursor: 'pointer', fontStyle: 'italic' }} title="斜体">I</button>
                                                <button onClick={() => applyFormat('underline')} style={{ padding: '6px 8px', border: `1px solid ${formatState.underline ? '#a1c2fa' : '#e0e0e0'}`, backgroundColor: formatState.underline ? '#e3f2fd' : '#fff', borderRadius: '4px', cursor: 'pointer', textDecoration: 'underline' }} title="下線">U</button>
                                                <button onClick={() => applyFormat('strikeThrough')} style={{ padding: '6px 8px', border: `1px solid ${formatState.strikethrough ? '#a1c2fa' : '#e0e0e0'}`, backgroundColor: formatState.strikethrough ? '#e3f2fd' : '#fff', borderRadius: '4px', cursor: 'pointer', textDecoration: 'line-through' }} title="取り消し線">S</button>
                                                <button onClick={insertList} style={{ padding: '6px 8px', border: '1px solid #e0e0e0', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer' }} title="リスト"><svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg></button>
                                                <div style={{ width: '1px', height: '24px', backgroundColor: '#e0e0e0', margin: '0 4px' }} />
                                                <button onClick={handleFileAttach} style={{ padding: '6px 8px', border: '1px solid #e0e0e0', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer' }} title="ファイル添付"><svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg></button>
                                                <button onClick={handleVideoEmbed} style={{ padding: '6px 8px', border: '1px solid #e0e0e0', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer' }} title="動画"><svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg></button>
                                                <button onClick={handleFileUpload} style={{ padding: '6px 8px', border: '1px solid #e0e0e0', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer' }} title="アップロード"><svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg></button>
                                                <button onClick={handleLinkInsert} style={{ padding: '6px 8px', border: '1px solid #e0e0e0', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer' }} title="リンク"><svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.9C4.29 7 2.2 9.09 2.2 11.7s2.09 4.7 4.7 4.7H11v-1.9H6.9c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.1c2.61 0 4.7 2.09 4.7 4.7s-2.09 4.7-4.7 4.7H13v1.9h4.1c2.61 0 4.7-2.09 4.7-4.7S19.71 7 17.1 7H13v1.9z"/></svg></button>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                                <button onClick={handleEditorCollapse} style={{ padding: '8px 16px', border: '1px solid #e0e0e0', backgroundColor: '#fff', color: '#5f6368', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>キャンセル</button>
                                                <button onClick={handlePost} style={{ padding: '8px 16px', border: 'none', backgroundColor: '#2196f3', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>投稿</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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

                                                    {/* 課題説明エディター (ここを修正) */}
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
                                                    チームで1つ提出
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

                                                {/* コメント入力 */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginTop: '24px'
                                                }}>
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
                                                    <input
                                                        type="text"
                                                        placeholder="クラスのコメントを追加..."
                                                        style={{
                                                            flex: 1,
                                                            padding: '8px 12px',
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: '20px',
                                                            fontSize: '14px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <button style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '8px',
                                                        borderRadius: '50%',
                                                        color: '#1976d2'
                                                    }}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                                        </svg>
                                                    </button>
                                                </div>
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
                        {activeTab === 'メンバー' && (
                            <div>
                                <h3 style={{ fontSize: '18px', color: '#3c4043', margin: '0 0 16px 0', fontWeight: '500' }}>メンバー ({group.memberCount}人)</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                                    {generateMembers(group.memberCount).map(member => (
                                        <div key={member.id} style={{ display: 'flex', alignItems: 'center', padding: '8px' }}>
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