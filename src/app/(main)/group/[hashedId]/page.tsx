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
    const editorRef = useRef<HTMLDivElement>(null);

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
                                <h3 style={{ fontSize: '18px', color: '#3c4043', margin: '0 0 16px 0', fontWeight: '500' }}>課題一覧</h3>
                                <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                                    <p style={{ color: '#5f6368', fontSize: '14px', margin: 0 }}>現在課題はありません。</p>
                                </div>
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