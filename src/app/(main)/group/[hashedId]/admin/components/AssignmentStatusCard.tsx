'use client';

import React, { useState, useEffect } from 'react';
import { returnMultipleSubmissions } from '@/lib/actions/submissionActions';
import { useRouter, usePathname } from 'next/navigation';

type Submission = {
  status: string;
  user: {
    id: string;
    username?: string;
    icon?: string | null;
  };
  file_path?: string;
};

export type AssignmentWithSubmissions = {
  id: number;
  title: string;
  created_at: string;
  due_date: string;
  author?: {
    username?: string;
    icon?: string;
  };
  Submissions: Submission[];
};

interface AssignmentStatusCardProps {
  assignment: AssignmentWithSubmissions;
  isSelected: boolean;
  onSelect: () => void;
  groupId: string;
}

export const AssignmentStatusCard: React.FC<AssignmentStatusCardProps> = ({
  assignment,
  isSelected,
  onSelect,
  groupId,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [isContentVisible, setIsContentVisible] = useState(isSelected);
  const [animationStyle, setAnimationStyle] = useState({ animation: '' });

  useEffect(() => {
    if (isSelected) {
      setIsContentVisible(true);
      setAnimationStyle({ animation: 'fadeIn 0.5s ease' });
    } else {
      setAnimationStyle({ animation: 'fadeOut 0.5s ease forwards' });
      const timer = setTimeout(() => {
        setIsContentVisible(false);
        setSelectedUserIds([]); // 閉じたら選択をクリア
      }, 500); // Animation duration

      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  const submitted = assignment.Submissions.filter(sub => sub.status === '提出済み');
  const notSubmitted = assignment.Submissions.filter(sub => sub.status === '未提出');
  const returned = assignment.Submissions.filter(sub => sub.status === '差し戻し');

  const handleCheckboxChange = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === submitted.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(submitted.map(sub => sub.user.id));
    }
  };

  const handleReturnSelectedSubmissions = async () => {
    if (selectedUserIds.length === 0) {
      alert('差し戻す提出を選択してください。');
      return;
    }
    if (confirm(`${selectedUserIds.length}件の提出を差し戻しますか？`)) {
      const result = await returnMultipleSubmissions(assignment.id, selectedUserIds, groupId);
      if (result.success) {
        alert('選択した提出を差し戻しました。');
        setSelectedUserIds([]);
        window.location.href = `${pathname}?tab=assignments&selectedAssignment=${assignment.id}`;
      } else {
        alert('差し戻しに失敗しました。');
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
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
      <div onClick={onSelect} style={{ padding: '16px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#38b2ac',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '16px',
          }}>
            {assignment.author?.icon ? <img src={assignment.author.icon} alt={assignment.author.username || ''} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : assignment.author?.username?.charAt(0) || '？'}
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
          <div>
            <span style={{ fontSize: '12px', color: '#5f6368' }}>差し戻し</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dd6b20' }}>
              {returned.length}
            </div>
          </div>
        </div>
      </div>

      {/* 展開される詳細部分 */}
      {isContentVisible && (
        <div style={{
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          ...animationStyle
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* 提出済みカラム */}
            <div style={{ padding: '16px', borderRight: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: '0', fontSize: '14px', color: '#38a169' }}>
                  提出済み ({submitted.length}人)
                </h4>
                {submitted.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReturnSelectedSubmissions();
                    }}
                    disabled={selectedUserIds.length === 0}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: '#fff',
                      backgroundColor: selectedUserIds.length > 0 ? '#dd6b20' : '#d1d5db',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedUserIds.length > 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    選択したものを差し戻す ({selectedUserIds.length})
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {submitted.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length === submitted.length && submitted.length > 0}
                      onChange={handleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>すべて選択</span>
                  </div>
                )}
                {submitted.map(sub => (
                  <div key={sub.user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(sub.user.id)}
                        onChange={() => handleCheckboxChange(sub.user.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#c6f6d5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#276749', overflow: 'hidden' }}>
                        {sub.user.icon ? (
                          <img src={sub.user.icon} alt={sub.user.username || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          sub.user.username?.charAt(0)
                        )}
                      </div>
                      <span style={{ fontSize: '14px' }}>
                        {sub.user.username}
                        {sub.file_path && (
                          <a href={sub.file_path} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px', fontSize: '12px', color: '#3182ce' }}>ファイル表示</a>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                {submitted.length === 0 && <span style={{ fontSize: '12px', color: '#718096' }}>まだ誰も提出していません。</span>}
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
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#9b2c2c', overflow: 'hidden' }}>
                      {sub.user.icon ? (
                        <img src={sub.user.icon} alt={sub.user.username || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        sub.user.username?.charAt(0)
                      )}
                    </div>
                    <span style={{ fontSize: '14px' }}>{sub.user.username}</span>
                  </div>
                ))}
                {notSubmitted.length === 0 && <span style={{ fontSize: '12px', color: '#718096' }}>全員が提出済みです！</span>}
              </div>
            </div>
          </div>
          <div style={{ padding: '16px', borderTop: '1px solid #e0e0e0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#dd6b20' }}>
              差し戻し済み ({returned.length}人)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {returned.map(sub => (
                <div key={sub.user.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#feebc8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#9c4221', overflow: 'hidden' }}>
                    {sub.user.icon ? (
                      <img src={sub.user.icon} alt={sub.user.username || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      sub.user.username?.charAt(0)
                    )}
                  </div>
                  <span style={{ fontSize: '14px' }}>{sub.user.username}</span>
                </div>
              ))}
              {returned.length === 0 && <span style={{ fontSize: '12px', color: '#718096' }}>差し戻し済みの提出はありません。</span>}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};