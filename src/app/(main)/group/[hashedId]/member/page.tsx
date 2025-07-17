'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupLayout } from '../../GroupLayout';

// === 型定義 ===
// ※PostやAPIからのデータ型に合わせて調整してください
interface Post {
    id: number;
    authorName: string;
    authorAvatar: string;
    content: string;
    createdAt: string;
}

interface Kadai {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    createdAt: string;
}

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

const MemberGroupPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const hashedId = params.hashedId as string;

    // === State管理 ===
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [kadaiList, setKadaiList] = useState<Kadai[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'お知らせ' | '課題' | 'メンバー'>('お知らせ');

    // 課題表示関連
    const [selectedKadai, setSelectedKadai] = useState<Kadai | null>(null);
    const [kadaiViewMode, setKadaiViewMode] = useState<'list' | 'detail'>('list');
    const [showSubmissionOptions, setShowSubmissionOptions] = useState(false);


    // === データ取得 ===
    useEffect(() => {
        if (hashedId) {
            const fetchGroupData = async () => {
                try {
                    setLoading(true);
                    // グループ詳細、投稿、課題を並行して取得
                    const [groupRes, postsRes, assignmentsRes] = await Promise.all([
                        fetch(`/api/groups/${hashedId}`),
                        fetch(`/api/groups/${hashedId}/posts`),      // お知らせ取得API（要実装）
                        fetch(`/api/groups/${hashedId}/assignments`) // 課題取得API（要実装）
                    ]);

                    if (!groupRes.ok) throw new Error('グループの読み込みに失敗しました');
                    const groupData = await groupRes.json();
                    setGroup({ teacher: '管理者', ...groupData });

                    if(postsRes.ok) {
                        const postsData = await postsRes.json();
                        setPosts(postsData);
                    }
                    
                    if(assignmentsRes.ok) {
                        const assignmentsData = await assignmentsRes.json();
                        setKadaiList(assignmentsData);
                    }

                } catch (err) {
                    setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
                } finally {
                    setLoading(false);
                }
            };
            fetchGroupData();
        }
    }, [hashedId]);

    // === イベントハンドラ ===

    // 課題詳細表示
    const handleKadaiDetail = (kadai: Kadai): void => {
        setSelectedKadai(kadai);
        setKadaiViewMode('detail');
    };

    // 課題一覧に戻る
    const handleBackToKadaiList = (): void => {
        setSelectedKadai(null);
        setKadaiViewMode('list');
    };
    
    // メンバーリスト生成 (ダミー)
    const generateMembers = (count: number): Member[] => {
        const members: Member[] = [];
        for (let i = 0; i < count; i++) {
            members.push({
                id: i + 1,
                name: i === 0 ? group?.teacher || 'あなた' : `メンバー ${i}`,
                avatar: i === 0 ? 'あ' : 'メ'
            });
        }
        return members;
    };

    // === レンダリング処理 ===
    return (
        <GroupLayout>
            {loading && <div style={{ padding: '2rem' }}>読み込み中...</div>}
            {error && <div style={{ padding: '2rem', color: 'red' }}>エラー: {error}</div>}
            {!loading && !group && <div style={{ padding: '2rem' }}>グループが見つかりません。</div>}
            
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
                    <div style={{ padding: '24px', backgroundColor: '#f9f9f9' }}>
                        {activeTab === 'お知らせ' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {posts.length > 0 ? posts.map(post => (
                                    <div key={post.id} style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                                        {/* お知らせアイテムのUI */}
                                        <p>{post.content}</p>
                                    </div>
                                )) : <p>お知らせはありません。</p>}
                            </div>
                        )}

                        {activeTab === '課題' && (
                            <div>
                                {kadaiViewMode === 'list' && (
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {kadaiList.length > 0 ? kadaiList.map((kadai) => (
                                            <div
                                                key={kadai.id}
                                                style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                                                onClick={() => handleKadaiDetail(kadai)}
                                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                            >
                                                <h3 style={{ margin: '0 0 8px 0' }}>{kadai.title}</h3>
                                                <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>期限: {kadai.dueDate ? new Date(kadai.dueDate).toLocaleString('ja-JP') : '未設定'}</p>
                                            </div>
                                        )) : <p>課題はありません。</p>}
                                    </div>
                                )}
                                
                                {kadaiViewMode === 'detail' && selectedKadai && (
                                    <div style={{ display: 'flex', gap: '24px' }}>
                                        {/* メインコンテンツ */}
                                        <div style={{ flex: 1 }}>
                                            <button onClick={handleBackToKadaiList} style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                                                     <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                                 </svg>
                                                 課題一覧に戻る
                                             </button>
                                            <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '24px' }}>
                                                 <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#3c4043', margin: '0 0 4px 0' }}>{selectedKadai.title}</h1>
                                                 <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '16px' }}>期限: {selectedKadai.dueDate ? new Date(selectedKadai.dueDate).toLocaleString('ja-JP') : '未設定'}</div>
                                                 {selectedKadai.description && <div dangerouslySetInnerHTML={{ __html: selectedKadai.description }} style={{ lineHeight: '1.6' }} />}
                                             </div>
                                        </div>

                                        {/* サイドバー (提出用) */}
                                        <div style={{ width: '300px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#3c4043', margin: '0 0 16px 0' }}>あなたの課題</h3>
                                             <button onClick={() => alert('提出用のファイル選択などを表示')} style={{ width: '100%', padding: '12px', border: '1px solid #1976d2', backgroundColor: 'transparent', color: '#1976d2', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                                                 ＋ 追加または作成
                                             </button>
                                             <button onClick={() => alert('提出処理を実行')} style={{ width: '100%', padding: '12px', border: 'none', backgroundColor: '#1976d2', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginTop: '12px' }}>
                                                 提出
                                             </button>
                                         </div>
                                    </div>
                                )}
                            </div>
                        )}

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

export default MemberGroupPage;