'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Assignment, Comment, AssignmentViewMode } from '../types/AdminTypes';

interface AssignmentListProps {
    assignments: Assignment[];
    viewMode: AssignmentViewMode;
    selectedAssignment: Assignment | null;
    onEditAssignment: (assignment: Assignment) => void;
    onDeleteAssignment: (assignment: Assignment) => void;
    onViewAssignmentDetail: (assignment: Assignment) => void;
    onBackToList: () => void;
    onAddComment: (assignmentId: number, content: string) => void;
    onEditComment: (assignmentId: number, commentId: number, content: string) => void;
    onDeleteComment: (assignmentId: number, commentId: number) => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
    assignments,
    viewMode,
    selectedAssignment,
    onEditAssignment,
    onDeleteAssignment,
    onViewAssignmentDetail,
    onBackToList,
    onAddComment,
    onEditComment,
    onDeleteComment
}) => {
    const [commentInputs, setCommentInputs] = useState<{[assignmentId: number]: string}>({});
    const [editingComments, setEditingComments] = useState<{[commentId: number]: string}>({});
    const [showKadaiOptions, setShowKadaiOptions] = useState(false);

    // コメント入力値更新
    const updateCommentInput = (assignmentId: number, value: string) => {
        setCommentInputs(prev => ({ ...prev, [assignmentId]: value }));
    };

    // コメント追加
    const handleAddComment = (assignmentId: number) => {
        const commentText = commentInputs[assignmentId];
        if (!commentText || !commentText.trim()) {
            alert('コメントを入力してください');
            return;
        }
        onAddComment(assignmentId, commentText);
        setCommentInputs(prev => ({ ...prev, [assignmentId]: '' }));
    };

    // コメント編集開始
    const startEditComment = (commentId: number, currentContent: string) => {
        setEditingComments(prev => ({ ...prev, [commentId]: currentContent }));
    };

    // コメント編集保存
    const saveEditComment = (assignmentId: number, commentId: number) => {
        const editedContent = editingComments[commentId];
        if (!editedContent || !editedContent.trim()) {
            alert('コメントを入力してください');
            return;
        }
        onEditComment(assignmentId, commentId, editedContent);
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

    // 課題詳細表示の場合
    if (viewMode === 'detail' && selectedAssignment) {
        // ★ 修正点 1: 問題の種類に応じたリンク先を格納する変数を定義
        let problemLink = '';

        if (selectedAssignment.programmingProblemId) {
            // プログラミング問題の場合のリンクを生成
            problemLink = `/issue_list/programming_problem/${selectedAssignment.programmingProblemId}?assignmentId=${selectedAssignment.id}`;
        } else if (selectedAssignment.selectProblemId) {
            // 選択問題の場合のリンクを生成
            problemLink = `/issue_list/selects_problems/${selectedAssignment.selectProblemId}?assignmentId=${selectedAssignment.id}`;
        }
        
        return (
            <div style={{ display: 'flex', gap: '24px' }}>
                {/* メインコンテンツ */}
                <div style={{ flex: 1 }}>
                    <button
                        onClick={onBackToList}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#1976d2',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                        課題一覧に戻る
                    </button>

                    <div style={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '24px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: selectedAssignment.completed ? '#4caf50' : '#d32f2f',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '16px',
                                flexShrink: 0,
                            }}>
                                {selectedAssignment.completed ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: '24px',
                                    fontWeight: '500',
                                    color: '#3c4043',
                                    margin: '0 0 4px 0'
                                }}>
                                    {selectedAssignment.title}
                                </h1>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#5f6368'
                                }}>
                                    管理者 • {new Date(selectedAssignment.created_at).toLocaleDateString('ja-JP')}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#5f6368'
                                }}>
                                    100 点
                                </div>
                            </div>
                        </div>

                        <div style={{
                            fontSize: '14px',
                            color: '#5f6368',
                            marginBottom: '16px'
                        }}>
                            期限: {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleString('ja-JP') : '未設定'}
                        </div>

                        <div style={{
                            fontSize: '14px',
                            color: '#3c4043',
                            marginBottom: '24px',
                            lineHeight: '1.6'
                        }}
                            dangerouslySetInnerHTML={{ __html: selectedAssignment.description }}
                        />

                        <div style={{ marginTop: '24px' }}>
                            {problemLink ? (
                                <Link 
                                    href={problemLink}
                                    style={{ 
                                        display: 'inline-block', 
                                        padding: '10px 20px', 
                                        backgroundColor: '#28a745', 
                                        color: 'white', 
                                        textDecoration: 'none', 
                                        borderRadius: '5px' 
                                    }}
                                >
                                    問題に挑戦する
                                </Link>
                            ) : (
                                <p style={{
                                    fontSize: '14px',
                                    color: '#718096',
                                    backgroundColor: '#f8f9fa',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    この課題には問題が添付されていません。
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* サイドバー */}
                <div style={{
                    width: '300px',
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px',
                    position: 'relative'
                }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#3c4043',
                        margin: '0 0 16px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        あなたの課題
                        <span style={{
                            fontSize: '12px',
                            color: '#34a853',
                            fontWeight: 'normal'
                        }}>
                            割り当て済み
                        </span>
                    </h3>

                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowKadaiOptions(!showKadaiOptions)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #1976d2',
                                backgroundColor: 'transparent',
                                color: '#1976d2',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            追加または作成
                        </button>

                        {showKadaiOptions && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                minWidth: '200px',
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '8px 0' }}>
                                    {['Google ドライブ', 'リンク', 'ファイル', 'link copy'].map((option) => (
                                        <div
                                            key={option}
                                            onClick={() => alert(option)}
                                            style={{
                                                padding: '12px 16px',
                                                fontSize: '14px',
                                                color: '#3c4043',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368" style={{ marginRight: '12px' }}>
                                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                            </svg>
                                            {option}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: 'none',
                            backgroundColor: '#1976d2',
                            color: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '16px'
                        }}
                    >
                        完了としてマーク
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#5f6368',
                        marginBottom: '8px'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        限定公開のコメント
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: '#1976d2',
                        cursor: 'pointer'
                    }}>
                        管理者 先生へのコメントを追加する
                    </div>
                </div>
            </div>
        );
    }

    // 課題一覧表示
    return (
        <div>
            <h2 style={{
                fontSize: '20px',
                fontWeight: '500',
                color: '#3c4043',
                marginBottom: '24px'
            }}>
                課題一覧
            </h2>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                {assignments.length === 0 ? (
                    <div style={{
                        backgroundColor: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '32px',
                        textAlign: 'center',
                        color: '#5f6368'
                    }}>
                        現在課題はありません。
                    </div>
                ) : (
                    assignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            style={{
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'box-shadow 0.2s'
                            }}
                            onClick={() => onViewAssignmentDetail(assignment)}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: assignment.completed ? '#4caf50' : '#d32f2f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '16px',
                                        flexShrink: 0,
                                    }}>
                                        {assignment.completed ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                                                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#5f6368'
                                        }}>
                                            管理者さんが新しい課題を投稿しました:
                                        </div>
                                        <h3 style={{
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            color: '#3c4043',
                                            margin: '4px 0 0 0'
                                        }}>
                                            {assignment.title}
                                        </h3>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditAssignment(assignment);
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            border: '1px solid #1976d2',
                                            backgroundColor: 'transparent',
                                            color: '#1976d2',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        編集
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteAssignment(assignment);
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            border: '1px solid #d32f2f',
                                            backgroundColor: 'transparent',
                                            color: '#d32f2f',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        削除
                                    </button>
                                </div>
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: '#5f6368',
                                marginLeft: '44px'
                            }}>
                                投稿日: {new Date(assignment.created_at).toLocaleDateString('ja-JP')}
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: '#5f6368',
                                marginLeft: '44px'
                            }}>
                                期限: {assignment.due_date ? new Date(assignment.due_date).toLocaleString('ja-JP') : '未設定'}
                            </div>

                            {/* コメント表示切り替えボタン */}
                            {assignment.comments && assignment.comments.length > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // コメント表示切り替え処理
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#1976d2',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        marginBottom: '12px',
                                        padding: '4px 0',
                                        marginLeft: '44px'
                                    }}
                                >
                                    {assignment.showComments ? 'コメントを非表示' : `${assignment.comments.length}件のコメントを表示`}
                                </button>
                            )}

                            {/* コメント一覧表示 */}
                            {assignment.showComments && assignment.comments && assignment.comments.length > 0 && (
                                <div style={{
                                    marginBottom: '16px',
                                    paddingLeft: '60px',
                                    borderLeft: '2px solid #f0f0f0'
                                }}>
                                    {assignment.comments.map((comment) => (
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
                                            
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#5f6368',
                                                    marginBottom: '2px'
                                                }}>
                                                    {comment.author} • {comment.date}
                                                </div>
                                                
                                                {comment.isEditing || editingComments[comment.id] !== undefined ? (
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    saveEditComment(assignment.id, comment.id);
                                                                }}
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    cancelEditComment(comment.id);
                                                                }}
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
                                                    <div style={{
                                                        fontSize: '14px',
                                                        color: '#3c4043',
                                                        lineHeight: '1.4'
                                                    }}>
                                                        {comment.content}
                                                    </div>
                                                )}
                                            </div>

                                            {!comment.isEditing && editingComments[comment.id] === undefined && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditComment(comment.id, comment.content);
                                                    }}
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
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid #f0f0f0',
                                marginLeft: '44px'
                            }}>
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
                                
                                <input
                                    type="text"
                                    placeholder="クラスのコメントを追加..."
                                    value={commentInputs[assignment.id] || ''}
                                    onChange={(e) => updateCommentInput(assignment.id, e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.stopPropagation();
                                            handleAddComment(assignment.id);
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddComment(assignment.id);
                                    }}
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
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
