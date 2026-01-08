'use client';

import React, { useEffect, useState } from 'react';
import { getSubmissionContent } from '@/lib/actions/submissionActions';

interface SubmissionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    submissionId: number | null;
}

interface SubmissionData {
    content: string;
    submittedAt: Date;
    username: string | null;
    fileName: string;
    language?: string;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
    isOpen,
    onClose,
    submissionId,
}) => {
    const [data, setData] = useState<SubmissionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && submissionId) {
            setLoading(true);
            setError(null);
            getSubmissionContent(submissionId)
                .then((result) => {
                    if (result.success && result.data) {
                        setData({
                            content: result.data.content,
                            submittedAt: new Date(result.data.submittedAt),
                            username: result.data.username,
                            fileName: result.data.fileName,
                            language: result.data.language
                        });
                    } else {
                        setError(result.message || 'データの取得に失敗しました');
                    }
                })
                .catch(() => setError('サーバーエラーが発生しました'))
                .finally(() => setLoading(false));
        } else {
            setData(null);
            setError(null);
        }
    }, [isOpen, submissionId]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                width: '80%',
                maxWidth: '800px',
                height: '80%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8f9fa'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
                            提出詳細
                        </h2>
                        {data && (
                            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                                {data.username} - {data.submittedAt.toLocaleString('ja-JP')}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#666'
                    }}>×</button>
                </div>

                {/* Content */}
                <div style={{
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1,
                    backgroundColor: '#fff'
                }}>
                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}

                    {error && (
                        <div style={{ color: '#e53e3e', padding: '20px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    {!loading && !error && data && (
                        <div>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 'bold', color: '#555' }}>
                                    {data.fileName !== 'テキスト提出' ? `[${data.fileName}]` : '[テキスト回答]'}
                                </div>
                                {data.language && (
                                    <div style={{
                                        fontSize: '12px',
                                        padding: '2px 8px',
                                        backgroundColor: '#e2e8f0',
                                        borderRadius: '12px',
                                        color: '#4a5568',
                                        border: '1px solid #cbd5e0'
                                    }}>
                                        {data.language}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                backgroundColor: '#1e1e1e',
                                color: '#dedede',
                                padding: '16px',
                                borderRadius: '4px',
                                overflowX: 'auto',
                                fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {data.content}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e0e0e0',
                    textAlign: 'right',
                    backgroundColor: '#f8f9fa'
                }}>
                    <button onClick={onClose} style={{
                        padding: '8px 16px',
                        backgroundColor: '#cbd5e0',
                        color: '#2d3748',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};
