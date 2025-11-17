'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Assignment } from '../types/AdminTypes';

interface AssignmentDetailProps {
    assignment: Assignment;
    onBackToList: () => void;
}

export const AssignmentDetail: React.FC<AssignmentDetailProps> = ({ assignment, onBackToList }) => {
    const params = useParams();
    const problemTitle = assignment.programmingProblem?.title || assignment.selectProblem?.title;

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
                                管理者 • {new Date(assignment.created_at).toLocaleDateString('ja-JP')}
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
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetail;