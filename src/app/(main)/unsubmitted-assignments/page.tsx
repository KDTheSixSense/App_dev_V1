import Link from 'next/link';
import { getUnsubmittedAssignments } from '@/lib/data'; // サーバーサイドのデータ取得関数をインポート
import type { UnsubmittedAssignment } from '@/lib/data'; // 型定義をインポート

// リンク先を決定するヘルパー関数
const getAssignmentLink = (assignment: UnsubmittedAssignment): string => {
  if (assignment.programmingProblemId) {
    return `/issue_list/programming_problem/${assignment.programmingProblemId}`; //後でここのURLを変更する
  }
  if (assignment.selectProblemId) {
    return `/issue_list/select_problem/${assignment.selectProblemId}`; //後でここのURLを変更する
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-2">未提出の課題</h1>
      
      {groups.length > 0 ? (
        <div className="space-y-6">
          {/* グループごとにループ処理 */}
          {groups.map((groupName) => (
            <div key={groupName} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              {/* グループ名ヘッダー */}
              <div className="bg-cyan-400 p-4">
                <h2 className="text-2xl font-bold text-white">{groupName}</h2>
              </div>
              
              {/* 各グループの課題リスト */}
              <div className="divide-y divide-gray-200">
                {groupedAssignments[groupName].map((assignment) => {
                  const href = getAssignmentLink(assignment);
                  return (
                    <Link 
                      key={assignment.id} 
                      href={href}
                      className="block p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{assignment.title}</h3>
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

