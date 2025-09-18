'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// APIから受け取るデータの型定義
interface UnsubmittedAssignment {
  id: number;
  title: string;
  dueDate: string;
  groupName: string;
  groupHashedId: string;
}

const UnsubmittedAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<UnsubmittedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnsubmittedAssignments = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/assignments/unsubmitted');
        
        if (!res.ok) {
          throw new Error('課題の取得に失敗しました');
        }
        
        const data = await res.json();
        setAssignments(data.assignments);

      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUnsubmittedAssignments();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">エラー: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-2">未提出の課題</h1>
      
      {assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Link 
              key={assignment.id} 
              href={`/group/${assignment.groupHashedId}`}
              className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-500"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">{assignment.title}</h2>
                  <p className="text-gray-500 mt-1">
                    <span className="font-medium">グループ:</span> {assignment.groupName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">提出期限</p>
                  <p className="font-medium text-red-600">
                    {new Date(assignment.dueDate).toLocaleString('ja-JP', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center bg-green-50 border border-green-200 p-8 rounded-lg">
          <p className="text-xl text-green-700">🎉 未提出の課題はありません！</p>
        </div>
      )}
    </div>
  );
};

export default UnsubmittedAssignmentsPage;