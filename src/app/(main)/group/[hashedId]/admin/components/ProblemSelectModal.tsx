'use client';

import React from 'react';
import { ProgrammingProblem } from '../types/AdminTypes';

interface ProblemSelectModalProps {
    isOpen: boolean;
    problems: ProgrammingProblem[];
    isLoading: boolean;
    onClose: () => void;
    onSelectProblem: (problem: ProgrammingProblem) => void;
}

export const ProblemSelectModal: React.FC<ProblemSelectModalProps> = ({
    isOpen,
    problems,
    isLoading,
    onClose,
    onSelectProblem
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'hidden',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* モーダルヘッダー */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #ccc'
                }}>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#3c4043' }}>
                        既存の問題を選択して課題に追加
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                {/* モーダルコンテンツ */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {isLoading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '2rem',
                            color: '#5f6368'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid #e0e0e0',
                                    borderTop: '2px solid #1976d2',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                問題リストを読み込み中...
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            margin: '1rem 0'
                        }}>
                            {problems.length > 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    {problems.map(problem => (
                                        <div
                                            key={problem.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px 16px',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                backgroundColor: '#fff',
                                                transition: 'background-color 0.2s, border-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                e.currentTarget.style.borderColor = '#1976d2';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#fff';
                                                e.currentTarget.style.borderColor = '#e0e0e0';
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: '500',
                                                    color: '#3c4043',
                                                    marginBottom: '4px'
                                                }}>
                                                    {problem.title}
                                                </div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#5f6368',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span>難易度:</span>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        {[...Array(5)].map((_, index) => (
                                                            <div
                                                                key={index}
                                                                style={{
                                                                    width: '12px',
                                                                    height: '12px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: index < problem.difficulty ? '#ff9800' : '#e0e0e0'
                                                                }}
                                                            />
                                                        ))}
                                                        <span style={{ marginLeft: '4px' }}>
                                                            ({problem.difficulty}/5)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onSelectProblem(problem)}
                                                style={{
                                                    padding: '8px 16px',
                                                    border: '1px solid #1976d2',
                                                    background: '#1976d2',
                                                    color: 'white',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                                            >
                                                選択
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    color: '#5f6368'
                                }}>
                                    <div style={{
                                        fontSize: '48px',
                                        marginBottom: '16px',
                                        opacity: 0.5
                                    }}>
                                        📝
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        marginBottom: '8px'
                                    }}>
                                        選択可能なプログラミング問題がありません
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#9e9e9e'
                                    }}>
                                        先に問題を作成してください
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* モーダルフッター */}
                <div style={{
                    borderTop: '1px solid #e0e0e0',
                    paddingTop: '1rem',
                    textAlign: 'right'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#fff',
                            color: '#5f6368',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                    >
                        閉じる
                    </button>
                </div>
            </div>

            {/* CSS アニメーション */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
