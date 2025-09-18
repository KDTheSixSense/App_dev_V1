'use client';

import React from 'react';
import { ProgrammingProblem } from '../types/AdminTypes';

interface ProblemSelectModalProps {
    isOpen: boolean;
    problems: ProgrammingProblem[];
    selectionProblems: any[];
    isLoading: boolean;
    onClose: () => void;
    onSelectProblem: (problem: ProgrammingProblem) => void;
    onSelectSelectionProblem: (problem: any) => void;
}

export const ProblemSelectModal: React.FC<ProblemSelectModalProps> = ({
    isOpen,
    problems,
    selectionProblems,
    isLoading,
    onClose,
    onSelectProblem,
    onSelectSelectionProblem
}) => {
    const [activeFilter, setActiveFilter] = React.useState<'programming' | 'selection'>('programming');
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

                {/* 問題フィルターボタンセクション */}
                <div style={{
                    padding: '1rem 0',
                    borderBottom: '1px solid #e0e0e0',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center'
                    }}>
                        <button
                            onClick={() => setActiveFilter('programming')}
                            style={{
                                padding: '12px 24px',
                                border: activeFilter === 'programming' ? 'none' : '2px solid #4fd1c7',
                                background: activeFilter === 'programming' 
                                    ? 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)' 
                                    : 'transparent',
                                color: activeFilter === 'programming' ? 'white' : '#4fd1c7',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: activeFilter === 'programming' 
                                    ? '0 4px 15px rgba(79, 209, 199, 0.3)' 
                                    : 'none',
                                minWidth: '160px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                if (activeFilter === 'programming') {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 209, 199, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeFilter === 'programming') {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 209, 199, 0.3)';
                                }
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                            </svg>
                            プログラム問題作成
                        </button>
                        
                        <button
                            onClick={() => setActiveFilter('selection')}
                            style={{
                                padding: '12px 24px',
                                border: activeFilter === 'selection' ? 'none' : '2px solid #667eea',
                                background: activeFilter === 'selection' 
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                    : 'transparent',
                                color: activeFilter === 'selection' ? 'white' : '#667eea',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: activeFilter === 'selection' 
                                    ? '0 4px 15px rgba(102, 126, 234, 0.3)' 
                                    : 'none',
                                minWidth: '160px',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                if (activeFilter === 'selection') {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeFilter === 'selection') {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                                }
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            選択問題作成
                        </button>
                    </div>
                    
                    <div style={{
                        textAlign: 'center',
                        marginTop: '1rem',
                        color: '#718096',
                        fontSize: '12px'
                    }}>
                        問題タイプを選択して既存の問題から選んでください
                    </div>
                </div>

                {/* モーダルコンテンツ */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                        margin: '0 0 1rem 0',
                        fontSize: '16px',
                        color: '#3c4043',
                        fontWeight: '600'
                    }}>
                        {activeFilter === 'programming' ? 'プログラミング問題' : '選択問題 (4択)'}
                    </h3>
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
                            {(() => {
                                const currentProblems = activeFilter === 'programming' ? (problems || []) : (selectionProblems || []);
                                const currentHandler = activeFilter === 'programming' ? onSelectProblem : onSelectSelectionProblem;

                                return currentProblems.length > 0 ? (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        {currentProblems.map(problem => (
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
                                                                        backgroundColor: index < (problem.difficulty || problem.difficultyId || 1) ? '#ff9800' : '#e0e0e0'
                                                                    }}
                                                                />
                                                            ))}
                                                            <span style={{ marginLeft: '4px' }}>
                                                                ({typeof (problem.difficulty || problem.difficultyId) === 'object' 
                                                                    ? (problem.difficulty?.id || problem.difficultyId?.id || 1)
                                                                    : (problem.difficulty || problem.difficultyId || 1)}/5)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => currentHandler(problem)}
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
                                            選択可能な{activeFilter === 'programming' ? 'プログラミング問題' : '選択問題'}がありません
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#9e9e9e'
                                        }}>
                                            先に問題を作成してください
                                        </div>
                                    </div>
                                );
                            })()}
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
