//app/(main)/group/[hashedId]/admin/components/AssignmentDetail.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Assignment, AssignmentComment, User } from '../types/AdminTypes';

interface AssignmentDetailProps {
    assignment: Assignment;
    onBackToList: () => void;
}

// コメントの型定義（APIから受け取るデータ構造に合わせます）
type CommentWithAuthor = AssignmentComment & {
    author: {
        id: number;
        username: string | null;
        icon: string | null;
    };
};

export const AssignmentDetail: React.FC<AssignmentDetailProps> = ({ assignment, onBackToList }) => {
    const params = useParams();
    const problemTitle = assignment.programmingProblem?.title || assignment.selectProblem?.title;
    
    const [comments, setComments] = useState<CommentWithAuthor[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // isSubmittingCommentからisSubmittingに変更
    const fetchComments = React.useCallback(async () => {
        try {
            const res = await fetch(`/api/groups/${params.hashedId}/assignments/${assignment.id}/comments`);
            if (!res.ok) throw new Error('コメントの取得に失敗しました');
            const data = await res.json();
            setComments(data);
        } catch (error) {
            console.error(error);
        }
    }, [assignment.id, params.hashedId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/groups/${params.hashedId}/assignments/${assignment.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            if (!res.ok) throw new Error('コメントの投稿に失敗しました');
            // 投稿後にコメントを再取得
            await fetchComments();
            setNewComment('');
        } catch (error) {
            console.error(error);
            alert('コメントの投稿に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

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

                <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#38b2ac',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px',
                            flexShrink: 0, color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        }}>
                            {assignment.author?.icon ? <img src={assignment.author.icon} alt={assignment.author.username || ''} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : assignment.author?.username?.charAt(0) || '？'}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#3c4043', margin: '0 0 4px 0' }}>
                                {assignment.title}
                            </h1>
                            <div style={{ fontSize: '14px', color: '#5f6368' }}>
                                {new Date(assignment.created_at).toLocaleDateString('ja-JP')}
                            </div>
                            
                        </div>
                    </div>

                    <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '16px' }}>
                        期限: {assignment.due_date ? (() => {
                            const date = new Date(assignment.due_date);
                            const formatter = new Intl.DateTimeFormat('ja-JP', {
                                timeZone: 'Asia/Tokyo',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                            });
                            return formatter.format(date);
                        })() : '未設定'}
                    </div>

                    <div
                        style={{ fontSize: '14px', color: '#3c4043', marginBottom: '24px', lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{ __html: assignment.description }}
                    />

                    <div style={{ marginTop: '24px' }}>
                        {assignment.selectProblemId ? (
                           <Link
                               href={`/group/select-page/${assignment.selectProblemId}?assignmentId=${assignment.id}&hashedId=${params.hashedId as string}`}
                               style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#58A8fdff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}
                           >
                               {problemTitle ? ` ${problemTitle}` : '問題に挑戦する'}
                           </Link>
                        ) : assignment.programmingProblemId ? (
                            <Link
                                href={`/group/coding-page/${assignment.programmingProblemId}?assignmentId=${assignment.id}&hashedId=${params.hashedId as string}`}
                                style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#58A8fdff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}
                            >
                                {problemTitle ? ` ${problemTitle}` : '問題に挑戦する'}
                            </Link>
                        ) :  (
                            <p style={{
                                fontSize: '14px', color: '#718096', backgroundColor: '#f8f9fa',
                                padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0'
                            }}>
                                この課題には問題が添付されていません。
                            </p>
                        )}
                    </div>

                    {/* --- ▼▼▼ コメント機能 ▼▼▼ --- */}
                    <div style={{ marginTop: '32px', borderTop: '1px solid #e0e0e0', paddingTop: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#3c4043', margin: '0 0 16px 0' }}>コメント</h3>
                        
                        {/* コメントリスト */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxHeight: '300px', overflowY: 'scroll', paddingRight: '10px' }}>
                            {comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                                        <img src={comment.author.icon || '/default-icon.png'} alt={comment.author.username || 'user'} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                        <div>
                                            <span style={{ fontWeight: '500', fontSize: '14px' }}>{comment.author.username || '名無しさん'}</span>
                                            <span style={{ color: '#5f6368', fontSize: '12px', marginLeft: '8px' }}>{new Date(comment.createdAt).toLocaleString('ja-JP')}</span>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#5f6368', fontSize: '14px' }}>まだコメントはありません。</p>
                            )}
                        </div>

                        {/* コメント投稿フォーム */}
                        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            {/* 現在のユーザーアイコンなどを表示 (必要に応じてcurrentUserから取得) */}
                            {/* <img src={'/default-icon.png'} style={{ width: '40px', height: '40px', borderRadius: '50%' }} /> */}
                            <div style={{ flex: 1 }}>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="コメントを追加..."
                                    rows={3}
                                    style={{ 
                                        width: '100%', 
                                        padding: '8px 12px', 
                                        border: '1px solid #ccc', 
                                        borderRadius: '4px', 
                                        fontSize: '14px', 
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || !newComment.trim()} 
                                    style={{ 
                                        marginTop: '8px', 
                                        padding: '8px 16px', 
                                        backgroundColor: '#1976d2', 
                                        color: 'white', border: 'none', 
                                        borderRadius: '4px', cursor: 'pointer', 
                                        opacity: (isSubmitting || !newComment.trim()) ? 0.5 : 1 
                                    }}>
                                    {isSubmitting ? '投稿中...' : '投稿'}
                                </button>
                            </div>
                        </form>
                    </div>
                    {/* --- ▲▲▲ コメント機能 ▲▲▲ --- */}
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetail;