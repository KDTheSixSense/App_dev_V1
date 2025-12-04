'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { AssignmentComment } from '../../admin/types/AdminTypes';
import DOMPurify from 'dompurify';

// page.tsxから型定義を移動またはインポート
interface Kadai {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    createdAt: string;
    completed?: boolean;
    submissionStatus?: string; // 提出状況を追加
    programmingProblemId?: number;
    selectProblemId?: number;
}

type CommentWithAuthor = AssignmentComment & {
    author: { username: string | null; icon: string | null; };
};

interface AssignmentDetailViewProps {
    kadai: Kadai;
    hashedId: string;
    onBack: () => void;
    onAssignmentSubmit: (kadaiId: number, newStatus: string) => void; // newStatusを受け取るように変更
}

export const AssignmentDetailView: React.FC<AssignmentDetailViewProps> = ({ kadai, hashedId, onBack, onAssignmentSubmit }) => {
    // コメント関連
    const [comments, setComments] = useState<CommentWithAuthor[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // ファイル提出関連
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

    // 提出状況に応じてボタンのテキストと状態を決定
    const isSubmitted = kadai.submissionStatus === '提出済み';
    const isRemanded = kadai.submissionStatus === '差し戻し';
    const submitButtonText = isSubmitted ? '提出済み' : isRemanded ? '再提出' : '提出';
    const isSubmitButtonDisabled = isSubmitted || isSubmittingAssignment || !selectedFile;

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`/api/groups/${hashedId}/assignments/${kadai.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error("コメントの取得に失敗しました", err);
        }
    }, [kadai.id, hashedId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmittingComment(true);
        try {
            const response = await fetch(`/api/groups/${hashedId}/assignments/${kadai.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            if (!response.ok) throw new Error('コメントの投稿に失敗しました');
            await fetchComments();
            setNewComment('');
        } catch (error) {
            console.error(error);
            alert('コメントの投稿に失敗しました。');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleFileSelect = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleAssignmentSubmit = async () => {
        if (!selectedFile) {
            alert('提出するファイルを選択してください。');
            return;
        }
        setIsSubmittingAssignment(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch(`/api/submit-assignment?assignmentId=${kadai.id}`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('課題の提出に失敗しました。');
            alert('課題を提出しました！');
            onAssignmentSubmit(kadai.id, '提出済み'); // 提出ステータスを渡す
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : '予期せぬエラーが発生しました。');
        } finally {
            setIsSubmittingAssignment(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flex: 1 }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                    課題一覧に戻る
                </button>
                <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#3c4043', margin: '0' }}>{kadai.title}</h1>
                        {kadai.submissionStatus === '提出済み' && (
                            <span style={{
                                marginLeft: '12px', padding: '4px 8px', borderRadius: '4px',
                                backgroundColor: '#e6fffa', color: '#38a169', fontSize: '12px', fontWeight: 'bold'
                            }}>
                                提出済み
                            </span>
                        )}
                        {kadai.submissionStatus === '差し戻し' && (
                            <span style={{
                                marginLeft: '12px', padding: '4px 8px', borderRadius: '4px',
                                backgroundColor: '#fffaf0', color: '#dd6b20', fontSize: '12px', fontWeight: 'bold'
                            }}>
                                差し戻し済み
                            </span>
                        )}
                        {kadai.submissionStatus === null && (
                            <span style={{
                                marginLeft: '12px', padding: '4px 8px', borderRadius: '4px',
                                backgroundColor: '#fee2e2', color: '#e53e3e', fontSize: '12px', fontWeight: 'bold'
                            }}>
                                未提出
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '14px', color: '#5f6368', marginBottom: '16px' }}>期限: {kadai.dueDate ? new Date(kadai.dueDate).toLocaleString('ja-JP') : '未設定'}</div>

                    {kadai.description && <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(kadai.description) }} style={{ lineHeight: '1.6' }} />}
                    {(kadai.programmingProblemId || kadai.selectProblemId) && (
                        <div style={{ marginTop: '24px' }}>
                            {kadai.selectProblemId ? (
                                <Link href={{ pathname: `/group/select-page/${kadai.selectProblemId}`, query: { assignmentId: kadai.id, hashedId: hashedId } }} style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                                    問題に挑戦する
                                </Link>
                            ) : kadai.programmingProblemId ? (
                                <Link href={{ pathname: `/group/coding-page/${kadai.programmingProblemId}`, query: { assignmentId: kadai.id, hashedId: hashedId } }} style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                                    問題に挑戦する
                                </Link>
                            ) : null}
                        </div>
                    )}

                    {/* コメント機能 */}
                    <div style={{ marginTop: '32px', borderTop: '1px solid #e0e0e0', paddingTop: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#3c4043', margin: '0 0 16px 0' }}>コメント</h3>
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
                        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="コメントを追加..." rows={3} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
                                <button type="submit" disabled={isSubmittingComment || !newComment.trim()} style={{ marginTop: '8px', padding: '8px 16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (isSubmittingComment || !newComment.trim()) ? 0.5 : 1 }}>
                                    {isSubmittingComment ? '投稿中...' : '投稿'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* ファイル提出サイドバー */}
            <div style={{ width: '300px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', alignSelf: 'flex-start' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#3c4043', margin: '0 0 16px 0' }}>あなたの課題</h3>
                {kadai.submissionStatus === '提出済み' && (
                    <p style={{ color: '#38a169', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>提出済みです。</p>
                )}
                {kadai.submissionStatus === '差し戻し' && (
                    <p style={{ color: '#dd6b20', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                        差し戻し済みです。再提出してください。
                    </p>
                )}
                {kadai.submissionStatus === null && (
                    <p style={{ color: '#e53e3e', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>未提出です。</p>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

                {selectedFile && (
                    <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                        <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#777' }}>×</button>
                    </div>
                )}

                <button onClick={handleFileSelect} style={{ width: '100%', padding: '12px', border: '1px solid #1976d2', backgroundColor: 'transparent', color: '#1976d2', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    ＋ 追加または作成
                </button>
                <button
                    onClick={handleAssignmentSubmit}
                    disabled={isSubmitButtonDisabled}
                    style={{
                        width: '100%', padding: '12px', border: 'none',
                        backgroundColor: '#1976d2', color: '#fff', borderRadius: '4px',
                        cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginTop: '12px',
                        opacity: isSubmitButtonDisabled ? 0.5 : 1
                    }}
                >
                    {submitButtonText}
                </button>
            </div>
        </div>
    );
};
