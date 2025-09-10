'use client';

import { useState, useEffect } from 'react';
import { 
    GroupDetail, 
    Member, 
    MemberStats, 
    Post, 
    Assignment, 
    ProgrammingProblem,
    Comment 
} from '../types/AdminTypes';

export const useAdminData = (hashedId: string) => {
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
    
    // 課題関連のstate
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    
    // プログラミング問題関連のstate
    const [availableProblems, setAvailableProblems] = useState<ProgrammingProblem[]>([]);
    const [isLoadingProblems, setIsLoadingProblems] = useState(false);

    // 選択問題関連のstate
    const [availableSelectionProblems, setAvailableSelectionProblems] = useState<any[]>([]);
    const [isLoadingSelectionProblems, setIsLoadingSelectionProblems] = useState(false);

    // === API関数 ===
    // グループ詳細を取得
    const fetchGroupData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/groups/${hashedId}`);
            if (!response.ok) {
                throw new Error('グループの読み込みに失敗しました');
            }
            const data = await response.json();
            setGroup(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // メンバー一覧を取得
    const fetchGroupMembers = async () => {
        try {
            setMembersLoading(true);
            setMembersError(null);
            
            const response = await fetch(`/api/groups/${hashedId}/members`);
            const data = await response.json();
            
            if (data.success) {
                setMembers(data.data.members);
                setMemberStats(data.data.stats);
            } else {
                setMembersError(data.message);
            }
        } catch (error) {
            setMembersError('メンバー情報の取得に失敗しました');
        } finally {
            setMembersLoading(false);
        }
    };

    // 投稿一覧を取得
    const fetchPosts = async () => {
        try {
            const response = await fetch(`/api/groups/${hashedId}/posts`);
            if (response.ok) {
                const data = await response.json();
                const formattedPosts = data.data.map((post: any) => ({
                    id: post.id,
                    content: post.content,
                    author: post.author.username || '不明なユーザー',
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
            }
        } catch (error) {
            console.error('お知らせの取得に失敗しました:', error);
        }
    };

    // 課題一覧を取得
    const fetchAssignments = async () => {
        try {
            const response = await fetch(`/api/groups/${hashedId}/assignments`);
            if (response.ok) {
                const data = await response.json();
                setAssignments(data.data);
            }
        } catch (error) {
            console.error('課題の取得に失敗しました:', error);
        }
    };

    // 利用可能なプログラミング問題を取得
    const fetchAvailableProblems = async () => {
        setIsLoadingProblems(true);
        try {
            const response = await fetch('/api/problems?isDraft=false&limit=100');
            if (response.ok) {
                const data = await response.json();
                setAvailableProblems(data.problems);
            }
        } catch (error) {
            console.error('問題一覧の取得に失敗しました:', error);
        } finally {
            setIsLoadingProblems(false);
        }
    };

    // 利用可能な選択問題を取得
    const fetchAvailableSelectionProblems = async () => {
        setIsLoadingSelectionProblems(true);
        try {
            const response = await fetch('/api/selects_problems');
            if (response.ok) {
                const data = await response.json();
                setAvailableSelectionProblems(data);
            }
        } catch (error) {
            console.error('選択問題一覧の取得に失敗しました:', error);
        } finally {
            setIsLoadingSelectionProblems(false);
        }
    };

    // 特定のプログラミング問題を取得
    const fetchProblemById = async (problemId: number): Promise<ProgrammingProblem | null> => {
        try {
            const response = await fetch(`/api/problems/${problemId}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    id: data.id.toString(),
                    title: data.title,
                    description: data.description,
                    difficulty: data.difficulty === 1 ? 'easy' : data.difficulty === 2 ? 'medium' : 'hard',
                    category: data.category,
                    sampleCases: data.sampleCases || []
                };
            }
        } catch (error) {
            console.error('問題の取得に失敗しました:', error);
        }
        return null;
    };

    // 特定の選択問題を取得
    const fetchSelectionProblemById = async (problemId: number): Promise<any | null> => {
        try {
            const response = await fetch(`/api/selects_problems/${problemId}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    id: data.id.toString(),
                    title: data.title,
                    description: data.description,
                    difficulty: data.difficulty === 1 ? 'easy' : data.difficulty === 2 ? 'medium' : 'hard',
                    category: '4択問題',
                    answerOptions: data.answerOptions || []
                };
            }
        } catch (error) {
            console.error('選択問題の取得に失敗しました:', error);
        }
        return null;
    };

    // === CRUD操作 ===
    // 投稿作成
    const createPost = async (content: string) => {
        const response = await fetch(`/api/groups/${hashedId}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '投稿に失敗しました');
        }
        
        const newPost: Post = {
            id: result.data.id,
            content: result.data.content,
            author: result.data.author.username || '不明なユーザー',
            date: new Date(result.data.createdAt).toLocaleDateString('ja-JP', {
                month: 'long',
                day: 'numeric',
            }),
            showMenu: false,
            comments: [],
            showComments: false,
            isEditing: false,
        };
        
        setPosts([newPost, ...posts]);
    };

    // 投稿編集
    const updatePost = (postId: number, content: string) => {
        setPosts(posts.map(post => 
            post.id === postId 
                ? { ...post, content, isEditing: false }
                : post
        ));
    };

    // 投稿削除
    const deletePost = (postId: number) => {
        if (confirm('この投稿を削除しますか？')) {
            setPosts(posts.filter(p => p.id !== postId));
        }
    };

    // コメント追加
    const addComment = (postId: number, content: string) => {
        const newComment: Comment = {
            id: Date.now(),
            content,
            author: 'あなた',
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
    };

    // コメント編集
    const updateComment = (postId: number, commentId: number, content: string) => {
        setPosts(posts.map(post => 
            post.id === postId 
                ? {
                    ...post,
                    comments: post.comments?.map(comment =>
                        comment.id === commentId
                            ? { ...comment, content, isEditing: false }
                            : comment
                    )
                }
                : post
        ));
    };

    // コメント削除
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

    // 課題作成
    const createAssignment = async (title: string, description: string, dueDate: string, programmingProblemId?: number) => {
        const response = await fetch(`/api/groups/${hashedId}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                dueDate: new Date(dueDate).toISOString(),
                programmingProblemId,
            }),
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '課題の作成に失敗しました。');
        }

        setAssignments([result.data, ...assignments]);
    };

    // 課題編集
    const updateAssignment = (assignment: Assignment) => {
        setAssignments(assignments.filter((a) => a.id !== assignment.id));
    };

    // 課題削除
    const deleteAssignment = (assignment: Assignment) => {
        if (confirm('この課題を削除しますか？')) {
            setAssignments(assignments.filter((a) => a.id !== assignment.id));
        }
    };

    // メンバー追加
    const addMember = async (email: string) => {
        const response = await fetch(`/api/groups/${hashedId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, isAdmin: false }),
        });
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }

        await fetchGroupMembers(); // リロード
    };

    // 招待コードコピー
    const copyInviteCode = () => {
        if (group && group.invite_code) {
            navigator.clipboard.writeText(group.invite_code)
                .then(() => {
                    alert(`招待コード「${group.invite_code}」をクリップボードにコピーしました！`);
                })
                .catch(() => {
                    alert('コピーに失敗しました。');
                });
        } else {
            alert('招待コードを取得できませんでした。');
        }
    };

    // === 初期データ取得 ===
    useEffect(() => {
        if (hashedId) {
            fetchGroupData();
            fetchGroupMembers();
            fetchPosts();
            fetchAssignments();
        }
    }, [hashedId]);

    return {
        // State
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

        // Actions
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
        fetchSelectionProblemById,

        // Refresh functions
        refreshData: () => {
            fetchGroupData();
            fetchGroupMembers();
            fetchPosts();
            fetchAssignments();
        }
    };
};
