'use client';

import React from 'react';
import { AssignmentWithSubmissions } from '../types/AdminTypes';

interface AssignmentStatusCardProps {
  assignment: AssignmentWithSubmissions;
  isSelected: boolean;
  onSelect: () => void;
}

export const AssignmentStatusCard: React.FC<AssignmentStatusCardProps> = ({
  assignment,
  isSelected,
  onSelect,
}) => {
  const submitted = assignment.Submissions.filter(sub => sub.status === '提出済み');
  const notSubmitted = assignment.Submissions.filter(sub => sub.status === '未提出');

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* カードのヘッダー部分（常に表示） */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#d32f2f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#3c4043',
              margin: '4px 0 0 0',
            }}>
              {assignment.title}
            </h3>
            <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '8px' }}>
              投稿日: {new Date(assignment.created_at).toLocaleDateString('ja-JP')}
            </div>
            <div style={{ fontSize: '12px', color: '#5f6368' }}>
              期限: {new Date(assignment.due_date).toLocaleString('ja-JP')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', paddingTop: '12px', borderTop: '1px solid #f0f0f0', marginTop: '12px' }}>
            <div>
                <span style={{ fontSize: '12px', color: '#5f6368' }}>提出済み</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38a169' }}>
                    {submitted.length}
                </div>
            </div>
            <div>
                <span style={{ fontSize: '12px', color: '#5f6368' }}>未提出</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e53e3e' }}>
                    {notSubmitted.length}
                </div>
            </div>
        </div>

      </div>

      {/* 展開される詳細部分 */}
      {isSelected && (
        <div style={{
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* 提出済みカラム */}
            <div style={{ padding: '16px', borderRight: '1px solid #e0e0e0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#38a169' }}>
                提出済み ({submitted.length}人)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {submitted.map(sub => (
                  <div key={sub.user.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#c6f6d5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#276749' }}>
                      {sub.user.username?.charAt(0)}
                    </div>
                    <span style={{ fontSize: '14px' }}>{sub.user.username}</span>
                  </div>
                ))}
                {submitted.length === 0 && <span style={{fontSize: '12px', color: '#718096'}}>まだ誰も提出していません。</span>}
              </div>
            </div>

            {/* 未提出カラム */}
            <div style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#e53e3e' }}>
                未提出 ({notSubmitted.length}人)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notSubmitted.map(sub => (
                  <div key={sub.user.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#9b2c2c' }}>
                      {sub.user.username?.charAt(0)}
                    </div>
                    <span style={{ fontSize: '14px' }}>{sub.user.username}</span>
                  </div>
                ))}
                {notSubmitted.length === 0 && <span style={{fontSize: '12px', color: '#718096'}}>全員が提出済みです！</span>}
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};