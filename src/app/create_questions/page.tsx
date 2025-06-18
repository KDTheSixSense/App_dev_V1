//クライアントコンポーネント
'use client';
import React from "react";
import { useRouter } from 'next/navigation'; // useRouter をインポート



const CreateQuestionsPage: React.FC = () => {
  const router = useRouter(); // useRouter フックを初期化

  // 課題作成ボタンのクリックハンドラ
  const handleCreateAssignmentClick = () => {
    // 指定されたパスに遷移
    // /create_questions/assignment_creation は、
    // /workspaces/my-next-app/src/app/create_questions/assignment_creation/page.tsx にマッピングされます。
    router.push('/create_questions/assignment_creation');
  };

  // 資格作成ボタンのクリックハンドラ
  const handleCreateQualificationClick = () => {
    // 指定されたパスに遷移
    // /create_questions/assignment_creation は、
    // /workspaces/my-next-app/src/app/create_questions/assignment_creation/page.tsx にマッピングされます。
    router.push('/create_questions/qualification_creation');
  };

  // カスタム問題作成ボタンのクリックハンドラ
  const handleCreateCustomClick = () => {
    // 指定されたパスに遷移
    // /create_questions/assignment_creation は、
    // /workspaces/my-next-app/src/app/create_questions/assignment_creation/page.tsx にマッピングされます。
    router.push('/create_questions/custom_creation');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* This div represents the main content area, similar to the white background in the image */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md flex flex-col items-center">
        {/* Button 1: 課題作成 (Create Assignment) */}
        <button
          onClick={handleCreateAssignmentClick} // クリックイベントハンドラを追加
          className="w-full py-4 px-6 mb-6 text-xl font-semibold text-gray-800 bg-blue-200 rounded-lg shadow-sm
                     hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75
                     transition-colors duration-200"
        >
          課題作成
        </button>

        {/* Button 2: 資格問題作成 (Create Qualification Questions) */}
        <button
          onClick={handleCreateQualificationClick} // クリックイベントハンドラを追加
          className="w-full py-4 px-6 mb-6 text-xl font-semibold text-gray-800 bg-blue-200 rounded-lg shadow-sm
                     hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75
                     transition-colors duration-200"
        >
          資格問題作成
        </button>

        {/* Button 3: カスタム問題作成 (Create Custom Questions) */}
        <button
          onClick={handleCreateCustomClick} // クリックイベントハンドラを追加
          className="w-full py-4 px-6 text-xl font-semibold text-gray-800 bg-blue-200 rounded-lg shadow-sm
                     hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75
                     transition-colors duration-200"
        >
          カスタム問題作成
        </button>
      </div>
    </div>
  );
};

export default CreateQuestionsPage;