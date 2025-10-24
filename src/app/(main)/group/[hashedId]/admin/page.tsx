'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import { AssignmentStatusList } from './components/AssignmentStatusList';
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
        assignmentsWithSubmissions,
        submissionsLoading,
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
        fetchAvailableSelectionProblems
    } = useAdminData(hashedId);

    // UI関連のstate
    const [activeTab, setActiveTab] = useState<TabType>('お知らせ');
    const [assignmentViewMode, setAssignmentViewMode] = useState<AssignmentViewMode>('list');
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isAssignmentEditorExpanded, setIsAssignmentEditorExpanded] = useState(false);
    const [isProblemSelectModalOpen, setIsProblemSelectModalOpen] = useState(false);
    const [problemPreview, setProblemPreview] = useState<ProgrammingProblem | null>(null);

    // クエリパラメータの処理 - 問題作成後の遷移時に使用
    const searchParams = useSearchParams();
    useEffect(() => {
        // クエリパラメータから初期状態を設定（問題作成後の自動遷移用）
        const tabParam = searchParams.get('tab');
        const expandParam = searchParams.get('expand');
        const problemParam = searchParams.get('problem');

        // タブの設定（課題タブが指定された場合）
        if (tabParam === '課題') {
            setActiveTab('課題'); // 課題タブに自動的に切り替え
        }

        // エディター展開の設定（課題作成エディターを展開）
        if (expandParam === 'true') {
            setIsAssignmentEditorExpanded(true); // 課題エディターを展開状態に設定
        }

        // 問題プレビューの設定（作成した問題をプレビュー表示）
        if (problemParam) {
            try {
                const problemData = JSON.parse(decodeURIComponent(problemParam));
                setProblemPreview({
                    id: problemData.id,
                    title: problemData.title,
                    difficulty: 1, // デフォルトの難易度を設定（実際の難易度は後で取得可能）
                    type: problemData.type
                });
                console.log('問題プレビューを設定しました:', problemData.title);
            } catch (error) {
                console.error('問題データの解析に失敗しました。URLパラメータが不正です:', error);
            }
        }
    }, [searchParams]);

    // === イベントハンドラ ===
    // 課題エディター展開 - 新しい課題を作成する際にエディターを開く
    const handleAssignmentEditorExpand = () => {
        setIsAssignmentEditorExpanded(true);
    };

    // 課題エディター縮小 - 課題作成完了後にエディターを閉じてプレビューをクリア
    const handleAssignmentEditorCollapse = () => {
        setIsAssignmentEditorExpanded(false);
        setProblemPreview(null); // 問題プレビューも同時にクリア
    };

    // 課題作成 - タイトル、説明、期限、問題IDを指定して課題を作成
    const handleAssignmentCreate = async (assignmentData: { title: string, description: string, dueDate: string, problem: ProgrammingProblem | null }) => {
        await createAssignment(assignmentData.title, assignmentData.description, assignmentData.dueDate, assignmentData.problem);
        handleAssignmentEditorCollapse(); // 作成後にエディターを閉じる
        alert('課題を作成しました。');
    };

    // 課題編集 - 既存の課題を編集モードで開く
    const handleAssignmentEdit = (assignment: Assignment) => {
        updateAssignment(assignment);
        setIsAssignmentEditorExpanded(true); // 編集のためにエディターを開く
    };

    // 課題詳細表示 - 課題の詳細ビューに切り替え
    const handleAssignmentDetail = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setAssignmentViewMode('detail'); // 詳細表示モードに変更
    };

    // 課題一覧に戻る - 詳細ビューから一覧ビューに戻る
    const handleAssignmentBackToList = () => {
        setSelectedAssignment(null);
        setAssignmentViewMode('list'); // 一覧表示モードに戻す
    };

    // プログラミング問題作成ページへ遷移 - 新しい問題を作成するために別ページへ移動
    const navigateToCreateProgrammingProblem = () => {
        router.push(`/group/${hashedId}/assignments/create-programming?type=programming`);
    };

    // 選択問題作成ページへ遷移
    const navigateToCreateSelectionProblem = () => {
        router.push(`/group/${hashedId}/assignments/create-programming?type=select`);
    };

    // 問題選択モーダルを開く - 既存の問題を選択するためのモーダルを表示
    const handleOpenProblemSelectModal = () => {
        fetchAvailableProblems(); // 利用可能なプログラミング問題を取得
        fetchAvailableSelectionProblems(); // 利用可能な選択問題を取得
        setIsProblemSelectModalOpen(true); // モーダルを開く
    };

    // 問題選択処理 - モーダルで選択された問題をプレビューに設定
    const handleProblemSelect = (problem: ProgrammingProblem) => {
        setProblemPreview(problem); // 選択された問題をプレビューに設定
        setIsAssignmentEditorExpanded(true); // エディターを展開
        setIsProblemSelectModalOpen(false); // モーダルを閉じる
    };

    // 問題プレビュー削除処理 - 添付された問題を削除
    const handleRemoveProblemPreview = () => {
        setProblemPreview(null); // 問題プレビューをクリア
    };

    // === レンダリング処理 ===
    return (
        <GroupLayout>
            {/* ローディング状態の表示 */}
            {loading && <div style={{padding: '2rem'}}>読み込み中...</div>}
            {/* エラー状態の表示 */}
            {error && <div style={{padding: '2rem', color: 'red'}}>エラー: {error}</div>}
            {/* グループが見つからない場合の表示 */}
            {!loading && !group && <div style={{padding: '2rem'}}>グループが見つかりません。</div>}

            {/* グループが存在する場合のメインコンテンツ */}
            {group && (
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    {/* グループ詳細ヘッダー - グループ名と説明を表示 */}
                    <div style={{ backgroundColor: '#b2dfdb', padding: '24px', position: 'relative' }}>
                        {/* 戻るボタン - グループ一覧ページに戻る */}
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
                        {/* グループ名と説明の表示 */}
                        <h1 style={{ fontSize: '24px', color: '#2e7d32', margin: '0 0 8px 0', fontWeight: '500' }}>
                            {group.name}
                        </h1>
                        <p style={{ fontSize: '14px', color: '#2e7d32', margin: '0', opacity: '0.8' }}>
                            {group.description}
                        </p>
                    </div>

                    {/* タブナビゲーション - お知らせ、課題、メンバーの切り替え */}
                    <div style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff', padding: '0 24px' }}>
                        {(['お知らせ', '課題', 'メンバー', '提出状況一覧'] as const).map(tab => (
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

                    {/* タブコンテンツ - 選択されたタブに応じたコンテンツを表示 */}
                    <div style={{ padding: '24px', backgroundColor: '#fff' }}>
                        {/* お知らせセクション - 投稿の作成と一覧表示 */}
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

                        {/* 課題セクション - 課題の作成、一覧、詳細表示 */}
                        {activeTab === '課題' && (
                            <div>
                                {/* 一覧表示モード */}
                                {assignmentViewMode === 'list' && (
                                    <div>
                                        {/* 課題エディター - 新しい課題を作成 */}
                                        <AssignmentEditor
                                            isExpanded={isAssignmentEditorExpanded}
                                            onExpand={handleAssignmentEditorExpand}
                                            onCollapse={handleAssignmentEditorCollapse}
                                            onCreateAssignment={handleAssignmentCreate}
                                            onNavigateToCreateProblem={navigateToCreateProgrammingProblem}
                                            onNavigateToCreateSelectionProblem={navigateToCreateSelectionProblem}
                                            onOpenProblemSelectModal={handleOpenProblemSelectModal}
                                            problemPreview={problemPreview}
                                            onRemoveProblemPreview={handleRemoveProblemPreview}
                                        />
                                        {/* 課題一覧 - 既存の課題を表示 */}
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

                                {/* 詳細表示モード */}
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

                        {/* メンバーセクション - グループメンバーの管理 */}
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

                        {activeTab === '提出状況一覧' && (
                          <AssignmentStatusList
                            assignments={assignmentsWithSubmissions}
                            loading={submissionsLoading}
                          />
                        )}
                    </div>

                    {/* 問題選択モーダル - 既存の問題を選択 */}
                    <ProblemSelectModal
                        isOpen={isProblemSelectModalOpen}
                        problems={availableProblems}
                        selectionProblems={availableSelectionProblems}
                        isLoading={isLoadingProblems || isLoadingSelectionProblems}
                        onClose={() => setIsProblemSelectModalOpen(false)}
                        onSelectProblem={handleProblemSelect}
                        onSelectSelectionProblem={handleProblemSelect}
                    />
                </div>
            )}
        </GroupLayout>
    );
};

export default GroupDetailPage;
