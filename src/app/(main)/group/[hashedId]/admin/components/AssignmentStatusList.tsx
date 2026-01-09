'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
type AssignmentWithSubmissions = any;
import { AssignmentStatusCard } from './AssignmentStatusCard';

import { SubmissionDetailModal } from './SubmissionDetailModal';

interface AssignmentStatusListProps {
  assignments: AssignmentWithSubmissions[];
  loading: boolean;
  groupId: string;
}

export const AssignmentStatusList: React.FC<AssignmentStatusListProps> = ({ assignments, loading, groupId }) => {
  const searchParams = useSearchParams();
  const selectedIdFromQuery = searchParams.get('selectedAssignment');
  const initialSelectedId = selectedIdFromQuery ? parseInt(selectedIdFromQuery, 10) : null;

  // クリックされた課題のIDを管理するためのState
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(initialSelectedId);

  // モーダル用のState
  const [viewingSubmissionId, setViewingSubmissionId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // カードがクリックされたときの処理
  const handleSelectAssignment = (assignmentId: number) => {
    // すでに選択されているカードを再度クリックしたら、選択を解除する（トグル機能）
    if (selectedAssignmentId === assignmentId) {
      setSelectedAssignmentId(null);
    } else {
      setSelectedAssignmentId(assignmentId);
    }
  };

  const handleViewSubmission = (submissionId: number) => {
    setViewingSubmissionId(submissionId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setViewingSubmissionId(null);
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
          groupId={groupId}
          onViewSubmission={handleViewSubmission}
        />
      ))}

      <SubmissionDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        submissionId={viewingSubmissionId}
      />
    </div>
  );
};