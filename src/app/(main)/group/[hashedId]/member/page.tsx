'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupLayout } from '../../GroupLayout';
import type { AssignmentComment } from '../admin/types/AdminTypes';
import { AssignmentDetailView } from './components/AssignmentDetailView';

export const dynamic = 'force-dynamic';

// === 型定義 ===
interface Post {
    id: number;
    content: string;
    authorName: string; 
    authorAvatar: string; // 頭文字
    authorIcon: string | null; // 画像URL
    createdAt: string;
}

interface Kadai {
    id: number;
    title: string;
    description: string;
    dueDate: string; 
    createdAt: string;
    completed?: boolean;
    programmingProblemId?: number;
    selectProblemId?: number;
    author?: {
        username: string | null;
        icon: string | null;
    } | null;
    submissionStatus?: string;
    Submissions?: any[];
}

interface GroupDetail {
    id: number;
    hashedId: string;
    name: string;
    description: string;
    memberCount: number;
    teacher: string;
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
    const [activeTab, setActiveTab] = useState<'お知らせ' | '課題'>('お知らせ');

    // お知らせのページネーションstate
    const [postsPage, setPostsPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(false);
    const [loadingMorePosts, setLoadingMorePosts] = useState(false);

    // 課題のページネーションstate
    const [kadaiPage, setKadaiPage] = useState(1);
    const [hasMoreKadai, setHasMoreKadai] = useState(false);
    const [loadingMoreKadai, setLoadingMoreKadai] = useState(false);

    // 課題表示関連
    const [selectedKadai, setSelectedKadai] = useState<Kadai | null>(null);
    const [kadaiViewMode, setKadaiViewMode] = useState<'list' | 'detail'>('list');

    // === データ取得 ===
    useEffect(() => {
        if (hashedId) {
            const fetchGroupData = async () => {
                try {
                    setLoading(true);
                    // APIリクエスト（withSubmissions=falseで軽量化）
                    const [groupRes, postsRes, assignmentsRes] = await Promise.all([
                        fetch(`/api/groups/${hashedId}`),
                        fetch(`/api/groups/${hashedId}/posts?page=1&limit=20`),
                        fetch(`/api/groups/${hashedId}/assignments?page=1&limit=20&withSubmissions=false`)
                    ]);

                    if (!groupRes.ok) throw new Error('グループの読み込みに失敗しました');
                    const groupData = await groupRes.json();
                    setGroup({ teacher: '管理者', ...groupData });

                    if (postsRes.ok) {
                        const postsData = await postsRes.json();
                        // 取得したデータをPost型に整形
                        const formattedPosts: Post[] = postsData.data.map((post: any) => ({
                            id: post.id,
                            content: post.content,
                            authorName: post.author.username || '不明なユーザー',
                            authorAvatar: post.author.username?.charAt(0) || '?',
                            // ★ここでAPIから返ってきた icon をセットしています
                            authorIcon: post.author.icon || null, 
                            createdAt: new Date(post.createdAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
                        }));
                        setPosts(formattedPosts);
                        setPostsPage(postsData.page);
                        setHasMorePosts(postsData.page < postsData.totalPages);
                    }
                    
                    if (assignmentsRes.ok) {
                        const assignmentsData = await assignmentsRes.json();
                        const formattedKadai: Kadai[] = assignmentsData.data.map((kadai: any) => ({
                            id: kadai.id,
                            title: kadai.title,
                            description: kadai.description,
                            dueDate: kadai.due_date,
                            createdAt: kadai.created_at,
                            completed: kadai.Submissions?.some(
                                (sub: any) => sub.status === '提出済み'
                            ),
                            submissionStatus: kadai.Submissions?.[0]?.status || null,
                            programmingProblemId: kadai.programmingProblemId,
                            selectProblemId: kadai.selectProblemId,
                            author: kadai.author,
                        }));
                        setKadaiList(formattedKadai);
                        setKadaiPage(assignmentsData.page);
                        setHasMoreKadai(assignmentsData.page < assignmentsData.totalPages);
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
    const handleLoadMorePosts = useCallback(async () => {
        if (loadingMorePosts || !hasMorePosts) return;
        setLoadingMorePosts(true);
        try {
            const nextPage = postsPage + 1;
            const res = await fetch(`/api/groups/${hashedId}/posts?page=${nextPage}&limit=20`);
            const newData = await res.json();
            const formattedPosts: Post[] = newData.data.map((post: any) => ({
                id: post.id,
                content: post.content,
                authorName: post.author.username || '不明なユーザー',
                authorAvatar: post.author.username?.charAt(0) || '?',
                authorIcon: post.author.icon || null, // ★ここでもセット
                createdAt: new Date(post.createdAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
            }));
            setPosts(prev => [...prev, ...formattedPosts]);
            setPostsPage(newData.page);
            setHasMorePosts(newData.page < newData.totalPages);
        } catch (err) {
            console.error("お知らせの追加読み込みに失敗しました", err);
        } finally {
            setLoadingMorePosts(false);
        }
    }, [postsPage, hasMorePosts, loadingMorePosts, hashedId]);

    const handleLoadMoreKadai = useCallback(async () => {
        if (loadingMoreKadai || !hasMoreKadai) return;
        setLoadingMoreKadai(true);
        try {
            const nextPage = kadaiPage + 1;
            const res = await fetch(`/api/groups/${hashedId}/assignments?page=${nextPage}&limit=20&withSubmissions=false`);
            const newData = await res.json();
            const formattedKadai: Kadai[] = newData.data.map((kadai: any) => ({
                id: kadai.id,
                title: kadai.title,
                description: kadai.description,
                dueDate: kadai.due_date,
                createdAt: kadai.created_at,
                completed: kadai.Submissions?.some(
                    (sub: any) => sub.status === '提出済み'
                ),
                submissionStatus: kadai.Submissions?.[0]?.status || null,
                programmingProblemId: kadai.programmingProblemId,
                selectProblemId: kadai.selectProblemId,
                author: kadai.author,
            }));
            setKadaiList(prev => [...prev, ...formattedKadai]);
            setKadaiPage(newData.page);
            setHasMoreKadai(newData.page < newData.totalPages);
        } catch (err) {
            console.error("課題の追加読み込みに失敗しました", err);
        } finally {
            setLoadingMoreKadai(false);
        }
    }, [kadaiPage, hasMoreKadai, loadingMoreKadai, hashedId]);

    const handleKadaiDetail = (kadai: Kadai): void => {
        setSelectedKadai(kadai);
        setKadaiViewMode('detail');
    };

    const handleBackToKadaiList = (): void => {
        setSelectedKadai(null);
        setKadaiViewMode('list');
    };

    const handleAssignmentSubmit = (kadaiId: number, newStatus: string) => {
        setKadaiList(prev => prev.map(k => k.id === kadaiId ? { ...k, completed: true, submissionStatus: newStatus } : k));
        handleBackToKadaiList();
    };

    // === レンダリング処理 ===
    return (
        <GroupLayout>
            {loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>読み込み中...</div>}
            {error && <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>エラー: {error}</div>}
            {!loading && !group && <div style={{ padding: '2rem', textAlign: 'center' }}>グループが見つかりません。</div>}
            
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2e7d32"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
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
                        {(['お知らせ', '課題'] as const).map(tab => (
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
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                            
                                            {/* ★ 修正箇所: アイコン表示ロジック */}
                                            <div style={{ 
                                                width: '32px', height: '32px', borderRadius: '50%', 
                                                backgroundColor: '#4CAF50', color: 'white', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                marginRight: '8px', fontWeight: 'bold', overflow: 'hidden' 
                                            }}>
                                                {post.authorIcon ? (
                                                    // アイコンがある場合はimgタグを表示
                                                    <img 
                                                        src={post.authorIcon} 
                                                        alt={post.authorName} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    />
                                                ) : (
                                                    // アイコンがない場合は頭文字を表示
                                                    post.authorAvatar
                                                )}
                                            </div>

                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{post.authorName}</div>
                                                <div style={{ fontSize: '12px', color: '#888' }}>{post.createdAt}</div>
                                            </div>
                                        </div>
                                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                                    </div>
                                )) : <p style={{ textAlign: 'center', color: '#666' }}>お知らせはありません。</p>}

                                {hasMorePosts && (
                                    <button onClick={handleLoadMorePosts} disabled={loadingMorePosts} style={{ marginTop: '16px', padding: '10px 16px', border: '1px solid #00bcd4', color: '#00bcd4', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                                        {loadingMorePosts ? '読み込み中...' : 'もっと見る'}
                                    </button>
                                )}
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
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        backgroundColor: kadai.completed ? '#4caf50' : '#d32f2f',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', flexShrink: 0
                                                    }}>
                                                        {kadai.completed ? (
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                                                        ) : (
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 style={{ margin: '0 0 4px 0' }}>{kadai.title}</h3>
                                                        <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>期限: {kadai.dueDate ? new Date(kadai.dueDate).toLocaleString('ja-JP') : '未設定'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : <p style={{ textAlign: 'center', color: '#666' }}>課題はありません。</p>}

                                        {hasMoreKadai && (
                                            <button onClick={handleLoadMoreKadai} disabled={loadingMoreKadai} style={{ marginTop: '16px', padding: '10px 16px', border: '1px solid #00bcd4', color: '#00bcd4', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                                                {loadingMoreKadai ? '読み込み中...' : 'もっと見る'}
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                                {kadaiViewMode === 'detail' && selectedKadai && (
                                    <AssignmentDetailView
                                        kadai={selectedKadai}
                                        hashedId={hashedId}
                                        onBack={handleBackToKadaiList}
                                        onAssignmentSubmit={handleAssignmentSubmit}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </GroupLayout>
    );
};

export default MemberGroupPage;