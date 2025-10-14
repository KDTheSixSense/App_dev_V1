'use client';

import React, { useState } from 'react';
import { AssignmentWithSubmissions } from '../types/AdminTypes';
import { AssignmentStatusCard } from './AssignmentStatusCard';

interface AssignmentStatusListProps {
  assignments: AssignmentWithSubmissions[];
  loading: boolean;
}

export const AssignmentStatusList: React.FC<AssignmentStatusListProps> = ({ assignments, loading }) => {
  // クリックされた課題のIDを管理するためのState
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  // カードがクリックされたときの処理
  const handleSelectAssignment = (assignmentId: number) => {
    // すでに選択されているカードを再度クリックしたら、選択を解除する（トグル機能）
    if (selectedAssignmentId === assignmentId) {
      setSelectedAssignmentId(null);
    } else {
      setSelectedAssignmentId(assignmentId);
    }
  };

  // 選択された課題の情報を取得
  if (loading) {
    return <div>課題状況を読み込み中...</div>;
  }

  if (assignments.length === 0) {
    return <div>表示する課題がありません。</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {assignments.map((assignment) => (
        <AssignmentStatusCard
          key={assignment.id}
          assignment={assignment}
          isSelected={selectedAssignmentId === assignment.id}
          onSelect={() => handleSelectAssignment(assignment.id)}
        />
      ))}
    </div>
  );
};