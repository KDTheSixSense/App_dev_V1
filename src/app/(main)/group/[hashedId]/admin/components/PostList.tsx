'use client';

import React, { useState } from 'react';
import { Post } from '../types/AdminTypes';
import DOMPurify from 'dompurify';

interface PostListProps {
    posts: Post[];
    onEditPost: (postId: number, content: string) => void;
    onDeletePost: (postId: number) => void;
    onAddComment: (postId: number, content: string) => void;
    onEditComment: (postId: number, commentId: number, content: string) => void;
    onDeleteComment: (postId: number, commentId: number) => void;
}

export const PostList: React.FC<PostListProps> = ({
    posts,
    onEditPost,
    onDeletePost,
    onAddComment,
    onEditComment,
    onDeleteComment
}) => {
    const [editingPosts, setEditingPosts] = useState<{ [postId: number]: string }>({});
    const [editingComments, setEditingComments] = useState<{ [commentId: number]: string }>({});
    const [commentInputs, setCommentInputs] = useState<{ [postId: number]: string }>({});

    // 投稿編集開始
    const startEditPost = (postId: number, currentContent: string) => {
        setEditingPosts(prev => ({ ...prev, [postId]: currentContent }));
    };

    // 投稿編集保存
    const saveEditPost = (postId: number) => {
        const editedContent = editingPosts[postId];
        if (!editedContent || !editedContent.trim()) {
            alert('投稿内容を入力してください');
            return;
        }
        onEditPost(postId, editedContent);
        setEditingPosts(prev => {
            const newState = { ...prev };
            delete newState[postId];
            return newState;
        });
    };

    // 投稿編集キャンセル
    const cancelEditPost = (postId: number) => {
        setEditingPosts(prev => {
            const newState = { ...prev };
            delete newState[postId];
            return newState;
        });
    };

    // コメント編集開始など（省略せず記述）
    const startEditComment = (commentId: number, currentContent: string) => {
        setEditingComments(prev => ({ ...prev, [commentId]: currentContent }));
    };

    const saveEditComment = (postId: number, commentId: number) => {
        const editedContent = editingComments[commentId];
        if (!editedContent || !editedContent.trim()) {
            alert('コメントを入力してください');
            return;
        }
        onEditComment(postId, commentId, editedContent);
        setEditingComments(prev => {
            const newState = { ...prev };
            delete newState[commentId];
            return newState;
        });
    };

    const cancelEditComment = (commentId: number) => {
        setEditingComments(prev => {
            const newState = { ...prev };
            delete newState[commentId];
            return newState;
        });
    };

    const handleAddComment = (postId: number) => {
        const commentText = commentInputs[postId];
        if (!commentText || !commentText.trim()) {
            alert('コメントを入力してください');
            return;
        }
        onAddComment(postId, commentText);
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    };

    // リンクコピー
    const copyPostLink = (postId: number) => {
        const link = `${window.location.origin}${window.location.pathname}#post-${postId}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('リンクをコピーしました');
        });
    };

    if (posts.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#5f6368',
                fontSize: '14px'
            }}>
                まだ投稿がありません。最初の投稿を作成してみましょう。
            </div>
        );
    }

    return (
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
                                fontWeight: 'bold',
                                overflow: 'hidden'
                            }}>
                                {post.author?.icon ? (
                                    <img
                                        src={post.author.icon}
                                        alt={post.author?.username || 'User'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    (post.author?.username || 'U').charAt(0)
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#202124' }}>
                                    {post.author?.username || 'Unknown User'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#5f6368' }}>
                                    {new Date(post.date).toLocaleString('ja-JP')}
                                </div>
                            </div>
                        </div>
                        {/* 編集・削除ボタン */}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => startEditPost(post.id, post.content)} style={{ marginRight: '8px', border: 'none', background: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '12px' }}>編集</button>
                            <button onClick={() => onDeletePost(post.id)} style={{ border: 'none', background: 'none', color: '#d93025', cursor: 'pointer', fontSize: '12px' }}>削除</button>
                            <button onClick={() => copyPostLink(post.id)} style={{ marginLeft: '8px', border: 'none', background: 'none', color: '#5f6368', cursor: 'pointer', fontSize: '12px' }}>リンク</button>
                        </div>
                    </div>

                    {/* 投稿内容 */}
                    {post.isEditing || editingPosts[post.id] !== undefined ? (
                        // 編集モード
                        <div style={{ marginBottom: '16px' }}>
                            <textarea
                                value={editingPosts[post.id] || ''}
                                onChange={(e) => setEditingPosts(prev => ({ ...prev, [post.id]: e.target.value }))}
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
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};