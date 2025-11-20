import Link from 'next/link';
import { getUnsubmittedAssignments } from '@/lib/data'; // サーバーサイドのデータ取得関数をインポート
import type { UnsubmittedAssignment } from '@/lib/data'; // 型定義をインポート

// リンク先を決定するヘルパー関数
const getAssignmentLink = (assignment: UnsubmittedAssignment): string => {
  if (assignment.programmingProblemId) {
    return `/group/coding-page/${assignment.programmingProblemId}?assignmentId=${assignment.id}&hashedId=${assignment.groupHashedId}`;
  }
  if (assignment.selectProblemId) {
    return `/group/select-page/${assignment.selectProblemId}?assignmentId=${assignment.id}&hashedId=${assignment.groupHashedId}`;
  }
  // どちらのIDもない場合のフォールバック（グループの課題タブへ）
  return `/group/${assignment.groupHashedId}?tab=課題`;
};

const UnsubmittedAssignmentsPage = async () => {
  // groupedAssignments に Record<string, UnsubmittedAssignment[]> という明確な型を指定します
  const groupedAssignments: Record<string, UnsubmittedAssignment[]> = await getUnsubmittedAssignments();
  const groups = Object.keys(groupedAssignments);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-2">未提出・差し戻し 課題一覧</h1>
      
      {groups.length > 0 ? (
        <div className="space-y-8">
          {/* 差し戻し済み課題セクション */}
          <div className="remanded-assignments-section">
            <h2 className="text-2xl font-bold text-orange-700 mb-4 border-b-2 border-orange-300 pb-2">差し戻し課題</h2>
            {Object.keys(groupedAssignments).some(groupName => 
              groupedAssignments[groupName].some(assignment => assignment.submissionStatus === '差し戻し')
            ) ? (
              <div className="space-y-6">
                {groups.map((groupName) => {
                  const remandedAssignments = groupedAssignments[groupName].filter(assignment => assignment.submissionStatus === '差し戻し');
                  if (remandedAssignments.length === 0) return null;
                  return (
                    <div key={groupName} className="bg-orange-50 rounded-lg shadow-lg overflow-hidden border border-orange-300">
                      <div className="bg-orange-400 p-4">
                        <h3 className="text-xl font-bold text-white">{groupName}</h3>
                      </div>
                      <div className="divide-y divide-orange-200">
                        {remandedAssignments.map((assignment) => {
                          const href = getAssignmentLink(assignment);
                          return (
                            <Link 
                              key={assignment.id} 
                              href={href}
                              className="block p-6 hover:bg-orange-100 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="text-xl font-semibold text-orange-800">{assignment.title}</h4>
                                  <p className="text-sm text-orange-600 font-bold mt-1">状態: 差し戻し済み</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                  <p className="text-sm text-gray-500">提出期限</p>
                                  <p className="font-semibold text-red-600">
                                    {new Date(assignment.dueDate).toLocaleString('ja-JP', { 
                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center bg-orange-50 border border-orange-200 p-6 rounded-lg text-orange-700">
                <p className="text-lg">差し戻しされたの課題はありません。</p>
              </div>
            )}
          </div>

          {/* 未提出課題セクション */}
          <div className="not-submitted-assignments-section">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">未提出の課題</h2>
            {Object.keys(groupedAssignments).some(groupName => 
              groupedAssignments[groupName].some(assignment => assignment.submissionStatus !== '差し戻し')
            ) ? (
              <div className="space-y-6">
                {groups.map((groupName) => {
                  const notSubmittedAssignments = groupedAssignments[groupName].filter(assignment => assignment.submissionStatus !== '差し戻し');
                  if (notSubmittedAssignments.length === 0) return null;
                  return (
                    <div key={groupName} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                      <div className="bg-cyan-400 p-4">
                        <h3 className="text-xl font-bold text-white">{groupName}</h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {notSubmittedAssignments.map((assignment) => {
                          const href = getAssignmentLink(assignment);
                          return (
                            <Link 
                              key={assignment.id} 
                              href={href}
                              className="block p-6 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="text-xl font-semibold text-gray-800">{assignment.title}</h4>
                                  <p className="text-sm text-gray-500 mt-1">状態: 未提出</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                  <p className="text-sm text-gray-500">提出期限</p>
                                  <p className="font-semibold text-red-600">
                                    {new Date(assignment.dueDate).toLocaleString('ja-JP', { 
                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center bg-green-50 border border-green-200 p-6 rounded-lg text-green-700">
                <p className="text-lg">未提出の課題はありません。</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="text-center bg-green-50 border border-green-200 p-8 rounded-lg">
          <p className="text-xl text-green-700">🎉 提出・差し戻しが必要な課題はありません！</p>
        </div>
      )}
    </div>
  );
};

export default UnsubmittedAssignmentsPage;
