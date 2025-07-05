import React from 'react';

interface ProfileFormProps {
  user: {
    name?: string;
    furigana?: string; // このフィールドは現在表示されていませんが、interfaceには残っています
    dateOfBirth?: string;
    gender?: string;
    schoolName?: string; // このフィールドは現在表示されていません
    department?: string; // このフィールドは現在表示されていません
  } | null;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  return (
    // フォーム全体を囲む div を追加し、スタイルを適用
    <div className="flex flex-col bg-gray-100 p-6 rounded-lg shadow-lg border-white-200 "> {/* 水色の背景、パディング、角丸、影、ボーダー */}
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">基本情報</h2> {/* タイトルを追加 */}
      <form className="space-y-6"> {/* フォームグループ間にスペースを追加 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
          <input
            type="text"
            id="name"
            name="name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            defaultValue={user?.name || ''}
            placeholder="テキスト"
          />
        </div>
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
          <input
            type="date" // 日付入力にはtype="date"を使用
            id="dateOfBirth"
            name="dateOfBirth"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            defaultValue={user?.dateOfBirth || ''}
            placeholder="テキスト"
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">性別</label>
          <input
            type="text"
            id="gender"
            name="gender"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            defaultValue={user?.gender || ''}
            placeholder="テキスト"
          />
        </div>
        <div className="flex justify-center mt-8"> {/* ボタンを中央揃え */}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full transition duration-300"
          >
            編集
          </button>
        </div>
      </form>
    </div>
  );
}