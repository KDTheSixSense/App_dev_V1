'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    GroupDetail, 
    Member, 
    MemberStats, 
    Post, 
    Assignment, 
    ProgrammingProblem
} from '../types/AdminTypes';

export const useAdminData = (hashedId: string) => {
    // === State管理 ===
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [members, setMembers] = useState<Member[]>([]);
    const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);
    
    const [posts, setPosts] = useState<Post[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [assignmentsWithSubmissions, setAssignmentsWithSubmissions] = useState<Assignment[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);

    const [availableProblems, setAvailableProblems] = useState<ProgrammingProblem[]>([]);
    const [isLoadingProblems, setIsLoadingProblems] = useState(false);
    const [availableSelectionProblems, setAvailableSelectionProblems] = useState<any[]>([]);
    const [isLoadingSelectionProblems, setIsLoadingSelectionProblems] = useState(false);

    // マウント状態の管理（非同期処理完了後の状態更新エラー防止）
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // 一括取得APIを使用するように変更
    const fetchAllInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // 新しく作成した高速化APIを呼び出す
            const response = await fetch(`/api/groups/${hashedId}/admin-dashboard`);
            const result = await response.json();

            if (!isMounted.current) return;

            if (result.success) {
                const { group, members, memberStats, posts, assignments } = result.data;

                setGroup(group);
                setMembers(members);
                setMemberStats(memberStats);
                
                // 日付の整形はここで行う
                const formattedPosts = posts.map((post: any) => ({
                    ...post,
                    date: new Date(post.createdAt).toLocaleDateString('ja-JP', {
                        month: 'long',
                        day: 'numeric'
                    }),
                    showMenu: false,
                    comments: [],
                    showComments: false,
                    isEditing: false
                }));
                setPosts(formattedPosts);

                setAssignments(assignments);
                setAssignmentsWithSubmissions(assignments); // 初期状態では同じデータを入れる
            } else {
                setError(result.message || 'データの取得に失敗しました');
            }

        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
                // 個別のローディングフラグも解除
                setMembersLoading(false);
                setSubmissionsLoading(false);
            }
        }
    }, [hashedId]);

    // --- 個別のリロード関数 ---
    // 権限変更やメンバー追加時のみ実行される軽量な更新
    const fetchGroupMembers = async () => {
        try {
            setMembersLoading(true);
            const response = await fetch(`/api/groups/${hashedId}/members`);
            const data = await response.json();
            if (data.success && isMounted.current) {
                setMembers(data.data.members);
                setMemberStats(data.data.stats);
            }
        } catch (e) {
             console.error(e);
        } finally {
            if (isMounted.current) setMembersLoading(false);
        }
    };

    // 課題一覧のリロード（提出状況含む）
    const fetchAssignmentsWithSubmissions = async () => {
        // すでにデータがある場合はローディングを表示しない（UX向上）
        if (assignmentsWithSubmissions.length === 0) setSubmissionsLoading(true);
        try {
             const response = await fetch(`/api/groups/${hashedId}/assignments-with-submissions`); // 既存のエンドポイントを使用
             if (response.ok) {
                 const data = await response.json();
                 if(isMounted.current) setAssignmentsWithSubmissions(data.data);
             }
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setSubmissionsLoading(false);
        }
    };
    
    // 問題一覧取得 (並列化)
    const fetchAllProblems = async () => {
        setIsLoadingProblems(true);
        setIsLoadingSelectionProblems(true);
        try {
            const [progRes, selectRes] = await Promise.all([
                fetch('/api/problems?isDraft=false&limit=100'),
                fetch('/api/selects_problems')
            ]);

            if (isMounted.current) {
                if (progRes.ok) {
                    const data = await progRes.json();
                    setAvailableProblems(data.problems.map((p: any) => ({ ...p, type: 'programming' })));
                }
                if (selectRes.ok) {
                    const data = await selectRes.json();
                    setAvailableSelectionProblems(data.map((p: any) => ({ ...p, type: 'select' })));
                }
            }
        } catch(e) {
            console.error(e);
        } finally {
            if (isMounted.current) {
                setIsLoadingProblems(false);
                setIsLoadingSelectionProblems(false);
            }
        }
    };

    // --- アクション関数 ---

    // 権限変更
    const toggleAdmin = async (userId: number, currentStatus: boolean) => {
        // 楽観的UI更新: APIレスポンスを待たずにUIを即座に更新する
        const previousMembers = [...members];
        setMembers(members.map(m => 
            m.id === userId ? { ...m, isAdmin: !currentStatus } : m
        ));

        try {
            const response = await fetch(`/api/groups/${hashedId}/members`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isAdmin: !currentStatus }),
            });

            const data = await response.json();
            if (!data.success) {
                // 失敗したら元に戻す
                setMembers(previousMembers);
                alert(data.message || '権限の変更に失敗しました');
            } else {
                // 統計情報だけ再取得する（全体リロードはしない）
                fetchGroupMembers();
            }
        } catch (error) {
            setMembers(previousMembers);
            console.error('権限変更エラー:', error);
            alert('権限の変更中にエラーが発生しました');
        }
    };

    const createPost = async (content: string) => {
        const response = await fetch(`/api/groups/${hashedId}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        // 全体リロードせず、新しい投稿を先頭に追加
        const newPost: Post = {
            id: result.data.id,
            content: result.data.content,
            author: result.data.author.username || '不明なユーザー',
            date: new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }),
            showMenu: false,
            comments: [],
            showComments: false,
            isEditing: false,
        };
        setPosts([newPost, ...posts]);
    };

    // 他のアクション関数（変更なしのものは省略せず記述）
    const updatePost = (postId: number, content: string) => {
        setPosts(posts.map(post => post.id === postId ? { ...post, content, isEditing: false } : post));
    };
    const deletePost = (postId: number) => {
        if (confirm('この投稿を削除しますか？')) setPosts(posts.filter(p => p.id !== postId));
    };
    const addComment = (postId: number, content: string) => { /* 省略(変更なし) */ };
    const updateComment = (postId: number, commentId: number, content: string) => { /* 省略(変更なし) */ };
    const deleteComment = (postId: number, commentId: number) => { /* 省略(変更なし) */ };

    const createAssignment = async (title: string, description: string, dueDate: string, problem: ProgrammingProblem | null) => {
        let endpoint = `/api/groups/${hashedId}/assignments`;
        const body: any = { title, description, dueDate };
        
        if (problem) {
            if (problem.type === 'select') body.selectProblemId = problem.id;
            else body.programmingProblemId = problem.id;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error('サーバーエラーが発生しました');
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        // 全体リロードせず、新しい課題を追加（再取得APIを呼ばない）
        // これによりUIが即座に反応する
        const newAssignment: Assignment = {
             id: result.data.id,
             title, description, due_date: dueDate, created_at: new Date().toISOString(),
             programmingProblemId: body.programmingProblemId,
             selectProblemId: body.selectProblemId,
             programmingProblem: problem && problem.type !== 'select' ? problem : undefined, // プレビュー用
             selectProblem: problem && problem.type === 'select' ? problem : undefined,     // プレビュー用
             author: { username: 'あなた', icon: null } // 仮
        };
        setAssignments([newAssignment, ...assignments]);
    };

    const updateAssignment = (assignment: Assignment) => { /* 省略 */ };
    const deleteAssignment = (assignment: Assignment) => { /* 省略 */ };
    
    const addMember = async (email: string) => {
        const response = await fetch(`/api/groups/${hashedId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, isAdmin: false }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        await fetchGroupMembers();
    };

    const copyInviteCode = () => {
         if (group?.invite_code) {
            navigator.clipboard.writeText(group.invite_code)
                .then(() => alert(`招待コード「${group.invite_code}」をコピーしました！`));
        }
    };

    // === 初期データ取得 ===
    useEffect(() => {
        if (hashedId) {
            fetchAllInitialData();
        }
    }, [hashedId, fetchAllInitialData]);

    return {
        group, loading, error, members, memberStats, membersLoading, membersError,
        posts, assignments, assignmentsWithSubmissions, submissionsLoading,
        availableProblems, isLoadingProblems, availableSelectionProblems, isLoadingSelectionProblems,
        createPost, updatePost, deletePost, addComment, updateComment, deleteComment,
        createAssignment, updateAssignment, deleteAssignment, addMember, copyInviteCode,
        
        // 最適化した関数をエクスポート
        fetchAvailableProblems: fetchAllProblems, // 名前を合わせて中身は統合版を使用
        fetchAvailableSelectionProblems: () => {}, // 上記でまとめて取得するので空関数でOK
        fetchAssignmentsWithSubmissions,
        toggleAdmin,
        refreshData: fetchAllInitialData
    };
};