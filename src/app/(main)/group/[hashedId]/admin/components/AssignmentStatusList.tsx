'use client';

import React from 'react';
import { AssignmentWithSubmissions } from '../types/AdminTypes';

interface AssignmentStatusListProps {
  assignments: AssignmentWithSubmissions[];
  loading: boolean;
}

export const AssignmentStatusList: React.FC<AssignmentStatusListProps> = ({ assignments, loading }) => {
  if (loading) {
    return <div>課題状況を読み込み中...</div>;
  }

  if (assignments.length === 0) {
    return <div>表示する課題がありません。</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {assignments.map((assignment) => {
        const submitted = assignment.Submissions.filter(sub => sub.status === '提出済み');
        const notSubmitted = assignment.Submissions.filter(sub => sub.status === '未提出');

        return (
          <div key={assignment.id} style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {/* 課題タイトル */}
            <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>{assignment.title}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5f6368' }}>
                期限: {new Date(assignment.due_date).toLocaleString('ja-JP')}
              </p>
            </div>

            {/* 提出状況 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* 提出済みカラム */}
              <div style={{ padding: '16px', borderRight: '1px solid #e0e0e0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#38a169' }}>
                  提出済み ({submitted.length}人)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {submitted.map(sub => (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#c6f6d5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                        {sub.user.username?.charAt(0)}
                      </div>
                      <span style={{ fontSize: '14px' }}>{sub.user.username}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 未提出カラム */}
              <div style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#e53e3e' }}>
                  未提出 ({notSubmitted.length}人)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notSubmitted.map(sub => (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                        {sub.user.username?.charAt(0)}
                      </div>
                      <span style={{ fontSize: '14px' }}>{sub.user.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};