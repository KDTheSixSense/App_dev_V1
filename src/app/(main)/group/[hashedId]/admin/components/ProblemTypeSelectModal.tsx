'use client';

import React from 'react';

interface ProblemTypeSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectProgrammingProblem: () => void;
    onSelectSelectionProblem: () => void;
}

export const ProblemTypeSelectModal: React.FC<ProblemTypeSelectModalProps> = ({
    isOpen,
    onClose,
    onSelectProgrammingProblem,
    onSelectSelectionProblem
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
            zIndex: 1001
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* モーダルヘッダー */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e0e0e0'
                }}>
                    <h2 style={{ 
                        margin: 0, 
                        fontSize: '20px', 
                        color: '#3c4043',
                        fontWeight: '600'
                    }}>
                        問題作成タイプを選択
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

                {/* 問題タイプ選択ボタン */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {/* プログラム問題作成ボタン */}
                    <button
                        onClick={() => {
                            onSelectProgrammingProblem();
                            onClose();
                        }}
                        style={{
                            padding: '20px 24px',
                            border: '2px solid #4fd1c7',
                            background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
                            color: 'white',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 4px 15px rgba(79, 209, 199, 0.3)',
                            textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 209, 199, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 209, 199, 0.3)';
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                            </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                                プログラム問題作成
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                コーディング問題やアルゴリズム問題を作成
                            </div>
                        </div>
                    </button>

                    {/* 選択問題作成ボタン */}
                    <button
                        onClick={() => {
                            onSelectSelectionProblem();
                            onClose();
                        }}
                        style={{
                            padding: '20px 24px',
                            border: '2px solid #667eea',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                            textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                                選択問題作成
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                4択問題やITパスポート問題を作成
                            </div>
                        </div>
                    </button>
                </div>

                {/* 説明テキスト */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    color: '#718096',
                    fontSize: '14px',
                    lineHeight: '1.5'
                }}>
                    作成したい問題のタイプを選択してください
                </div>
            </div>
        </div>
    );
};
