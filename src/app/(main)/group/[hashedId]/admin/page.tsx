'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GroupLayout } from '../../GroupLayout';

// 分離したコンポーネントをインポート
import { PostEditor } from './components/PostEditor';
import { PostList } from './components/PostList';
import { AssignmentEditor } from './components/AssignmentEditor';
import { AssignmentList } from './components/AssignmentList';
import { MemberList } from './components/MemberList';
import { ProblemSelectModal } from './components/ProblemSelectModal';

// 型定義とカスタムフックをインポート
import { TabType, AssignmentViewMode, Assignment, ProgrammingProblem } from './types/AdminTypes';
import { useAdminData } from './hooks/useAdminData';

const GroupDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const hashedId = params.hashedId as string;

    // カスタムフックでデータ管理を集約
    const {
        group,
        loading,
        error,
        members,
        memberStats,
        membersLoading,
        membersError,
        posts,
        assignments,
        availableProblems,
        isLoadingProblems,
        availableSelectionProblems,
        isLoadingSelectionProblems,
        createPost,
        updatePost,
        deletePost,
        addComment,
        updateComment,
        deleteComment,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        addMember,
        copyInviteCode,
        fetchAvailableProblems,
        fetchAvailableSelectionProblems,
        fetchProblemById,
        fetchSelectionProblemById
    } = useAdminData(hashedId);

    // UI関連のstate
    const [activeTab, setActiveTab] = useState<TabType>('お知らせ');
    const [assignmentViewMode, setAssignmentViewMode] = useState<AssignmentViewMode>('list');
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isAssignmentEditorExpanded, setIsAssignmentEditorExpanded] = useState(false);
    const [isProblemSelectModalOpen, setIsProblemSelectModalOpen] = useState(false);
    const [problemPreview, setProblemPreview] = useState<ProgrammingProblem | null>(null);

    // URLパラメータの処理
    React.useEffect(() => {
        const handleUrlParams = async () => {
            const urlParams = new URLSearchParams(window.location.search);

            // タブパラメータの処理
            const tabParam = urlParams.get('tab');
            if (tabParam === '課題') {
                setActiveTab('課題');
            }

            // 展開パラメータの処理
            const expandParam = urlParams.get('expand');
            if (expandParam === 'true') {
                setIsAssignmentEditorExpanded(true);
            }

            // 問題パラメータの処理
            const problemParam = urlParams.get('problem');
            if (problemParam) {
                try {
                    const problemInfo = JSON.parse(decodeURIComponent(problemParam));
                    const problemId = parseInt(problemInfo.id);

                    if (!isNaN(problemId)) {
                        let fetchedProblem = null;

                        // 問題タイプに応じて適切なAPIを呼び出す
                        if (problemInfo.type === '4択問題') {
                            fetchedProblem = await fetchSelectionProblemById(problemId);
                        } else {
                            fetchedProblem = await fetchProblemById(problemId);
                        }

                        if (fetchedProblem) {
                            setProblemPreview(fetchedProblem);
                            setIsAssignmentEditorExpanded(true);
                            setActiveTab('課題');
                        }
                    }
                } catch (error) {
                    console.error('問題情報の解析に失敗しました:', error);
                }
            }
        };

        handleUrlParams();
    }, []);

    // === イベントハンドラ ===
    // 課題エディター展開
    const handleAssignmentEditorExpand = () => {
        setIsAssignmentEditorExpanded(true);
    };

    // 課題エディター縮小
    const handleAssignmentEditorCollapse = () => {
        setIsAssignmentEditorExpanded(false);
        setProblemPreview(null);
    };

    // 問題プレビュー削除
    const handleRemoveProblemPreview = () => {
        setProblemPreview(null);
    };

    // 課題作成
    const handleAssignmentCreate = async (title: string, description: string, dueDate: string, programmingProblemId?: number) => {
        // 選択問題の場合はprogrammingProblemIdをnullにする
        const isSelectionProblem = problemPreview && 'answerOptions' in problemPreview;
        const finalProgrammingProblemId = isSelectionProblem ? undefined : programmingProblemId;

        await createAssignment(title, description, dueDate, finalProgrammingProblemId);
        handleAssignmentEditorCollapse();
        alert('課題を作成しました。');
    };

    // 課題編集
    const handleAssignmentEdit = (assignment: Assignment) => {
        updateAssignment(assignment);
        setIsAssignmentEditorExpanded(true);
    };

    // 課題詳細表示
    const handleAssignmentDetail = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setAssignmentViewMode('detail');
    };

    // 課題一覧に戻る
    const handleAssignmentBackToList = () => {
        setSelectedAssignment(null);
        setAssignmentViewMode('list');
    };

    // プログラミング問題作成ページへ遷移
    const navigateToCreateProgrammingProblem = () => {
        router.push(`/group/${hashedId}/assignments/create-programming`);
    };

    // 問題選択モーダルを開く
    const handleOpenProblemSelectModal = () => {
        fetchAvailableProblems();
        fetchAvailableSelectionProblems();
        setIsProblemSelectModalOpen(true);
    };

    // 問題選択処理
    const handleProblemSelect = (problem: ProgrammingProblem) => {
        setProblemPreview(problem);
        setIsAssignmentEditorExpanded(true);
        setIsProblemSelectModalOpen(false);
    };

    // 選択問題選択処理
    const handleSelectionProblemSelect = (problem: any) => {
        setProblemPreview(problem);
        setIsAssignmentEditorExpanded(true);
        setIsProblemSelectModalOpen(false);
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
                                <PostEditor onPost={createPost} />
                                <PostList
                                    posts={posts}
                                    onEditPost={updatePost}
                                    onDeletePost={deletePost}
                                    onAddComment={addComment}
                                    onEditComment={updateComment}
                                    onDeleteComment={deleteComment}
                                />
                            </div>
                        )}

                        {/* 課題セクション */}
                        {activeTab === '課題' && (
                            <div>
                                {assignmentViewMode === 'list' && (
                                    <div>
                                        <AssignmentEditor
                                            isExpanded={isAssignmentEditorExpanded}
                                            onExpand={handleAssignmentEditorExpand}
                                            onCollapse={handleAssignmentEditorCollapse}
                                            onCreateAssignment={handleAssignmentCreate}
                                            onNavigateToCreateProblem={navigateToCreateProgrammingProblem}
                                            onOpenProblemSelectModal={handleOpenProblemSelectModal}
                                            problemPreview={problemPreview}
                                            onRemoveProblemPreview={handleRemoveProblemPreview}
                                        />
                                        <AssignmentList
                                            assignments={assignments}
                                            viewMode={assignmentViewMode}
                                            selectedAssignment={selectedAssignment}
                                            onEditAssignment={handleAssignmentEdit}
                                            onDeleteAssignment={deleteAssignment}
                                            onViewAssignmentDetail={handleAssignmentDetail}
                                            onBackToList={handleAssignmentBackToList}
                                            onAddComment={addComment}
                                            onEditComment={updateComment}
                                            onDeleteComment={deleteComment}
                                        />
                                    </div>
                                )}

                                {assignmentViewMode === 'detail' && (
                                    <AssignmentList
                                        assignments={assignments}
                                        viewMode={assignmentViewMode}
                                        selectedAssignment={selectedAssignment}
                                        onEditAssignment={handleAssignmentEdit}
                                        onDeleteAssignment={deleteAssignment}
                                        onViewAssignmentDetail={handleAssignmentDetail}
                                        onBackToList={handleAssignmentBackToList}
                                        onAddComment={addComment}
                                        onEditComment={updateComment}
                                        onDeleteComment={deleteComment}
                                    />
                                )}
                            </div>
                        )}

                        {/* メンバーセクション */}
                        {activeTab === 'メンバー' && (
                            <MemberList
                                members={members}
                                memberStats={memberStats}
                                loading={membersLoading}
                                error={membersError}
                                inviteCode={group.invite_code}
                                onAddMember={addMember}
                                onCopyInviteCode={copyInviteCode}
                            />
                        )}
                    </div>

                    {/* プログラミング問題選択モーダル */}
                    <ProblemSelectModal
                        isOpen={isProblemSelectModalOpen}
                        problems={availableProblems}
                        selectionProblems={availableSelectionProblems}
                        isLoading={isLoadingProblems || isLoadingSelectionProblems}
                        onClose={() => setIsProblemSelectModalOpen(false)}
                        onSelectProblem={handleProblemSelect}
                        onSelectSelectionProblem={handleSelectionProblemSelect}
                    />
                </div>
            )}
        </GroupLayout>
    );
};

export default GroupDetailPage;
