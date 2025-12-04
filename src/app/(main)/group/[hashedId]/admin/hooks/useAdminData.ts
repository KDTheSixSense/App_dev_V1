'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
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

            // 2つのAPIを並列で呼び出して高速化
            const [dashboardRes, submissionsRes] = await Promise.all([
                fetch(`/api/groups/${hashedId}/admin-dashboard`),
                fetch(`/api/groups/${hashedId}/assignments-with-submissions`)
            ]);

            const dashboardResult = await dashboardRes.json();
            const submissionsResult = await submissionsRes.json();

            if (!isMounted.current) return;

            if (dashboardResult.success) {
                const { group, members, memberStats, posts, assignments } = dashboardResult.data;

                setGroup(group);
                setMembers(members);
                setMemberStats(memberStats);

                const formattedPosts = posts.map((post: any) => ({
                    ...post,
                    date: post.createdAt,
                    showMenu: false,
                    comments: [],
                    showComments: false,
                    isEditing: false
                }));
                setPosts(formattedPosts);

                setAssignments(assignments);

                // 提出状況一覧のデータもここでセット
                if (submissionsResult.success) {
                    setAssignmentsWithSubmissions(submissionsResult.data);
                }
            } else {
                setError(dashboardResult.message || 'データの取得に失敗しました');
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
        } catch (e) {
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
        // 管理者からメンバーへ変更しようとしている場合（currentStatusがtrueで、反転させるのでfalseになる場合）
        if (currentStatus === true) {
            // 現在の管理者数をカウント
            const adminCount = members.filter(m => m.isAdmin).length;

            // 管理者が1人しかいない場合は変更をブロック
            if (adminCount <= 1) {
                toast.error('グループには最低1人の管理者が必要です。最後の管理者の権限は変更できません。');
                return; // ここで処理を終了し、APIリクエストを送らない
            }
        }
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
                toast.error(data.message || '権限の変更に失敗しました');
            } else {
                // 統計情報だけ再取得する（全体リロードはしない）
                fetchGroupMembers();
            }
        } catch (error) {
            setMembers(previousMembers);
            console.error('権限変更エラー:', error);
            toast.error('権限の変更中にエラーが発生しました');
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
            author: {
                username: result.data.author.username || '不明なユーザー',
                icon: result.data.author.icon || null
            },
            date: new Date().toISOString(),
            showMenu: false,
            comments: [],
            showComments: false,
            isEditing: false,
        };
        setPosts([newPost, ...posts]);
    };

    const updatePost = async (postId: number, content: string) => {
        try {
            const response = await fetch(`/api/groups/${hashedId}/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            setPosts(posts.map(post => post.id === postId ? { ...post, content, isEditing: false } : post));
            toast.success('お知らせを更新しました');
        } catch (error) {
            console.error('お知らせ更新エラー:', error);
            toast.error('お知らせの更新に失敗しました');
        }
    };

    const deletePost = async (postId: number) => {
        if (!confirm('この投稿を削除しますか？')) return;

        try {
            const response = await fetch(`/api/groups/${hashedId}/posts/${postId}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            setPosts(posts.filter(p => p.id !== postId));
            toast.success('お知らせを削除しました');
        } catch (error) {
            console.error('お知らせ削除エラー:', error);
            toast.error('お知らせの削除に失敗しました');
        }
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

        const newAssignment: Assignment = {
            id: result.data.id,
            title, description, due_date: dueDate, created_at: new Date().toISOString(),
            programmingProblemId: body.programmingProblemId,
            selectProblemId: body.selectProblemId,
            programmingProblem: problem && problem.type !== 'select' ? problem : undefined,
            selectProblem: problem && problem.type === 'select' ? problem : undefined,
            author: { username: 'あなた', icon: null },
            comments: []
        };
        setAssignments([newAssignment, ...assignments]);
    };

    const updateAssignment = async (assignment: Assignment) => {
        try {
            const body: any = {
                title: assignment.title,
                description: assignment.description,
                dueDate: assignment.due_date
            };

            // 問題のIDを設定
            if (assignment.programmingProblem) {
                body.programmingProblemId = assignment.programmingProblem.id;
                body.selectProblemId = null;
            } else if (assignment.selectProblem) {
                body.selectProblemId = assignment.selectProblem.id;
                body.programmingProblemId = null;
            } else {
                body.programmingProblemId = null;
                body.selectProblemId = null;
            }

            const response = await fetch(`/api/groups/${hashedId}/assignments/${assignment.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error('サーバーエラーが発生しました');
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            // ローカルステート更新
            setAssignments(assignments.map(a => a.id === assignment.id ? {
                ...a,
                ...result.data,
                // プレビュー用のオブジェクトも更新
                programmingProblem: assignment.programmingProblem,
                selectProblem: assignment.selectProblem
            } : a));

            toast.success('課題を更新しました');
        } catch (error) {
            console.error('課題更新エラー:', error);
            toast.error('課題の更新に失敗しました');
            throw error;
        }
    };

    const deleteAssignment = async (assignment: Assignment) => {
        if (!confirm('この課題を削除しますか？提出状況もすべて削除されます。')) return;

        try {
            const response = await fetch(`/api/groups/${hashedId}/assignments/${assignment.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('サーバーエラーが発生しました');
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            // ローカルステート更新
            setAssignments(assignments.filter(a => a.id !== assignment.id));
            toast.success('課題を削除しました');
        } catch (error) {
            console.error('課題削除エラー:', error);
            toast.error('課題の削除に失敗しました');
        }
    };

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
                .then(() => toast.success(`招待コード「${group.invite_code}」をコピーしました！`));
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
        fetchAvailableSelectionProblems: () => { }, // 上記でまとめて取得するので空関数でOK
        toggleAdmin,
        refreshData: fetchAllInitialData
    };
};