'use client';

import React from 'react';
import { AssignmentDetail } from './AssignmentDetail'; // 詳細コンポーネントをインポート
import { Assignment, Comment, AssignmentViewMode } from '../types/AdminTypes';

interface AssignmentListProps {
    // hashedId: string; // これはuseParamsで取得するため不要になります
    assignments: Assignment[];
    viewMode: AssignmentViewMode;
    selectedAssignment: Assignment | null;
    onEditAssignment: (assignment: Assignment) => void;
    onDeleteAssignment: (assignment: Assignment) => void;
    onViewAssignmentDetail: (assignment: Assignment) => void;
    onBackToList: () => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
    assignments,
    viewMode,
    selectedAssignment,
    onEditAssignment,
    onDeleteAssignment,
    onViewAssignmentDetail,
    onBackToList
}) => {
    // 課題詳細表示の場合
    if (viewMode === 'detail' && selectedAssignment) {
        return (
            <AssignmentDetail assignment={selectedAssignment} onBackToList={onBackToList} />
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
                                        borderRadius: '50%', // 枠を円形に
                                        backgroundColor: '#38b2ac', // アイコンがない場合の背景色
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '16px',
                                        flexShrink: 0,
                                        color: '#fff', // 文字色を白に
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                    }}>
                                        {/* アイコンがあれば表示、なければユーザー名の頭文字を表示 */}
                                        {assignment.author?.icon ? <img src={assignment.author.icon} alt={assignment.author.username || ''} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : assignment.author?.username?.charAt(0) || '？'}
                                    </div>
                                    <div>
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

                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
