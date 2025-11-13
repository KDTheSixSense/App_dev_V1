'use client';

import React, { useState } from 'react';
import { Member, MemberStats } from '../types/AdminTypes';

interface MemberListProps {
    members: Member[];
    memberStats: MemberStats | null;
    loading: boolean;
    error: string | null;
    inviteCode?: string;
    onAddMember: (email: string) => Promise<void>;
    onCopyInviteCode: () => void;
}

export const MemberList: React.FC<MemberListProps> = ({
    members,
    memberStats,
    loading,
    error,
    inviteCode,
    onAddMember,
    onCopyInviteCode
}) => {
    const [emailInput, setEmailInput] = useState('');

    

    return (
        <div>
            {/* メンバー統計情報 */}
            {memberStats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                            {memberStats.totalMembers}
                        </div>
                        <div style={{ fontSize: '14px', color: '#5f6368' }}>グループ参加人数</div>
                    </div>
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                            {memberStats.adminCount}
                        </div>
                        <div style={{ fontSize: '14px', color: '#5f6368' }}>管理者数</div>
                    </div>
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                            {memberStats.studentCount}
                        </div>
                        <div style={{ fontSize: '14px', color: '#5f6368' }}>メンバー数</div>
                    </div>
                </div>
            )}

            
            {/* メンバー一覧ヘッダー */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
            }}>
                <h3 style={{ fontSize: '18px', color: '#3c4043', margin: '0', fontWeight: '500' }}>
                    メンバー一覧 ({members.length}人)
                </h3>
                {inviteCode && (
                    <button
                        onClick={onCopyInviteCode}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #1976d2',
                            backgroundColor: 'transparent',
                            color: '#1976d2',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        招待コードをコピー
                    </button>
                )}
            </div>

            {/* メンバー一覧 */}
            {loading ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#5f6368',
                    fontSize: '14px'
                }}>
                    メンバー情報を読み込み中...
                </div>
            ) : error ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#d32f2f',
                    fontSize: '14px'
                }}>
                    エラー: {error}
                </div>
            ) : members.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#5f6368',
                    fontSize: '14px'
                }}>
                    メンバーがいません。
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px'
                }}>
                    {members.map(member => (
                        <div
                            key={member.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px',
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                position: 'relative'
                            }}
                        >
                            {/* メンバーアバター */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                backgroundColor: member.isAdmin ? '#4caf50' : '#00bcd4',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                position: 'relative'
                            }}>
                                {member.avatar || member.name.charAt(0)}

                                {/* 管理者バッジ */}
                                {member.isAdmin && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-2px',
                                        right: '-2px',
                                        width: '16px',
                                        height: '16px',
                                        backgroundColor: '#ff9800',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #fff'
                                    }}>
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* メンバー情報 */}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '4px'
                                }}>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#3c4043'
                                    }}>
                                        {member.name}
                                    </span>

                                    {/* 役割バッジ */}
                                    <span style={{
                                        fontSize: '10px',
                                        padding: '2px 6px',
                                        borderRadius: '12px',
                                        backgroundColor: member.isAdmin ? '#4caf50' : '#e0e0e0',
                                        color: member.isAdmin ? '#fff' : '#5f6368',
                                        fontWeight: '500'
                                    }}>
                                        {member.isAdmin ? '管理者' : 'メンバー'}
                                    </span>

                                    
                                </div>

                                {/* メンバー統計 */}
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    fontSize: '11px',
                                    color: '#5f6368'
                                }}>
                                    
                                </div>
                            </div>

                            {/* メンバー管理メニュー */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        alert(`${member.name}の管理メニュー（実装予定）`);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '50%',
                                        opacity: 0.7
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
