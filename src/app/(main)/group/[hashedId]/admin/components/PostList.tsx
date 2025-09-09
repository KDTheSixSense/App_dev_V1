'use client';

import React, { useState } from 'react';
import { Post, Comment } from '../types/AdminTypes';

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
    const [editingPosts, setEditingPosts] = useState<{[postId: number]: string}>({});
    const [editingComments, setEditingComments] = useState<{[commentId: number]: string}>({});
    const [commentInputs, setCommentInputs] = useState<{[postId: number]: string}>({});

    // 投稿メニュー操作
    const togglePostMenu = (postId: number) => {
        // この機能は親コンポーネントで管理する必要があります
        // 今回は簡略化のため、直接操作します
    };

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

    // コメント編集開始
    const startEditComment = (commentId: number, currentContent: string) => {
        setEditingComments(prev => ({ ...prev, [commentId]: currentContent }));
    };

    // コメント編集保存
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

    // コメント編集キャンセル
    const cancelEditComment = (commentId: number) => {
        setEditingComments(prev => {
            const newState = { ...prev };
            delete newState[commentId];
            return newState;
        });
    };

    // コメント追加
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
                                fontWeight: 'bold'
                            }}>
                                {post.author.charAt(0)}
                            </div>

                            {/* 投稿者情報 */}
                            <div>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    color: '#3c4043',
                                    marginBottom: '2px'
                                }}>
                                    {post.author}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#5f6368'
                                }}>
                                    {post.date}
                                </div>
                            </div>
                        </div>

                        {/* 投稿メニューボタン */}
                        {!post.isEditing && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => togglePostMenu(post.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '50%',
                                        opacity: 0.7
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                    </svg>
                                </button>

                                {/* ドロップダウンメニュー */}
                                {post.showMenu && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        backgroundColor: '#fff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                        zIndex: 1000,
                                        minWidth: '150px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ padding: '8px 0' }}>
                                            <button
                                                onClick={() => copyPostLink(post.id)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    fontSize: '14px',
                                                    color: '#3c4043',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '12px' }}>
                                                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.9C4.29 7 2.2 9.09 2.2 11.7s2.09 4.7 4.7 4.7H11v-1.9H6.9c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.1c2.61 0 4.7 2.09 4.7 4.7s-2.09 4.7-4.7 4.7H13v1.9h4.1c2.61 0 4.7-2.09 4.7-4.7S19.71 7 17.1 7H13v1.9z"/>
                                                </svg>
                                                リンクをコピー
                                            </button>

                                            <button
                                                onClick={() => startEditPost(post.id, post.content)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    fontSize: '14px',
                                                    color: '#3c4043',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '12px' }}>
                                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                                </svg>
                                                編集
                                            </button>

                                            <button
                                                onClick={() => onDeletePost(post.id)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    fontSize: '14px',
                                                    color: '#d32f2f',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '12px' }}>
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                                </svg>
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    )}

                    {/* コメント表示切り替えボタン */}
                    {!post.isEditing && !editingPosts[post.id] && post.comments && post.comments.length > 0 && (
                        <button
                            onClick={() => {/* コメント表示切り替え処理 */}}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#1976d2',
                                cursor: 'pointer',
                                fontSize: '14px',
                                marginBottom: '12px',
                                padding: '4px 0'
                            }}
                        >
                            {post.showComments ? 'コメントを非表示' : `${post.comments.length}件のコメントを表示`}
                        </button>
                    )}

                    {/* コメント一覧表示 */}
                    {post.showComments && post.comments && post.comments.length > 0 && (
                        <div style={{
                            marginBottom: '16px',
                            paddingLeft: '16px',
                            borderLeft: '2px solid #f0f0f0'
                        }}>
                            {post.comments.map((comment) => (
                                <div key={comment.id} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    padding: '8px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    position: 'relative'
                                }}>
                                    {/* コメント投稿者のアバター */}
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: '#1976d2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        color: '#fff',
                                        flexShrink: 0
                                    }}>
                                        {comment.avatar || comment.author.charAt(0)}
                                    </div>

                                    {/* コメント内容 */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#5f6368',
                                            marginBottom: '2px'
                                        }}>
                                            {comment.author} • {comment.date}
                                        </div>

                                        {comment.isEditing || editingComments[comment.id] !== undefined ? (
                                            // 編集モード
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    value={editingComments[comment.id] || ''}
                                                    onChange={(e) => setEditingComments(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                    style={{
                                                        padding: '4px 8px',
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: '4px',
                                                        fontSize: '14px'
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => saveEditComment(post.id, comment.id)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            border: 'none',
                                                            backgroundColor: '#1976d2',
                                                            color: '#fff',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        保存
                                                    </button>
                                                    <button
                                                        onClick={() => cancelEditComment(comment.id)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            border: '1px solid #e0e0e0',
                                                            backgroundColor: '#fff',
                                                            color: '#5f6368',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        キャンセル
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // 通常表示モード
                                            <div style={{
                                                fontSize: '14px',
                                                color: '#3c4043',
                                                lineHeight: '1.4'
                                            }}>
                                                {comment.content}
                                            </div>
                                        )}
                                    </div>

                                    {/* コメントメニューボタン */}
                                    {!comment.isEditing && editingComments[comment.id] === undefined && (
                                        <button
                                            onClick={() => startEditComment(comment.id, comment.content)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '2px',
                                                borderRadius: '50%',
                                                opacity: 0.7,
                                                fontSize: '12px',
                                                color: '#1976d2'
                                            }}
                                        >
                                            編集
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* コメント入力エリア */}
                    {!post.isEditing && !editingPosts[post.id] && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid #f0f0f0'
                        }}>
                            {/* ユーザーアバター */}
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

                            {/* コメント入力フィールド */}
                            <input
                                type="text"
                                placeholder="クラスのコメントを追加..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddComment(post.id);
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />

                            {/* コメント送信ボタン */}
                            <button
                                onClick={() => handleAddComment(post.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    color: '#1976d2'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
