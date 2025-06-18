'use client'; // useRouter を使うため、クライアントコンポーネントであることを明示

import React from 'react';
import { useRouter } from 'next/navigation'; // useRouter をインポート
import IssueCard from './components/IssueCard'; // QuestionCard から IssueCard に変更
import AdviceSection from './components/AdviceSection';

// カードのデータ
const questionCategories = [
  { title: 'ITパスポート', description: 'Title\nDescription', path: '/issue_list/it_passport_problem' },
  { title: '基本情報 科目A', description: 'Title\nDescription', path: '/issue_list/basic_info_a_problem' },
  { title: '基本情報 科目B', description: 'Title\nDescription', path: '/issue_list/basic_info_b_problem' }, // ★遷移先パスを追加★
  { title: '応用情報 午前', description: 'Title\nDescription', path: '/issue_list/applied_info_morning_problem' },
  { title: '応用情報 午後', description: 'Title\nDescription', path: '/issue_list/applied_info_afternoon_problem' },
  { title: '情報検定', description: 'Title\nDescription', path: '/issue_list/information_exam_problem' },
  { title: '学校課題', description: 'Title\nDescription', path: '/issue_list/school_assignment_problem' },
  { title: 'Java', description: 'Title\nDescription', path: '/issue_list/java_problem' },
  { title: 'Python', description: 'Title\nDescription', path: '/issue_list/python_problem' },
];

const QuestionsPage: React.FC = () => {
  const router = useRouter(); // useRouter フックを初期化

  // カードがクリックされたときのハンドラ
  const handleCardClick = (path: string) => {
    if (path) {
      router.push(path); // 指定されたパスに遷移
    } else {
      console.log('このカテゴリには遷移パスが設定されていません。');
      // ここで、パスが設定されていない場合のフォールバック処理やアラートなどを表示できます
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* 上部のナビゲーションバー部分は、このコンポーネントのスコープ外にあると仮定します。
          通常はLayoutコンポーネントや別のヘッダーコンポーネントで管理されます。 */}

      {/* メインコンテンツエリア */}
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
        {/* 左側の出題項目（9つのカード）エリア */}
        <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-6 text-gray-700">出題項目</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionCategories.map((category, index) => (
              <IssueCard // QuestionCard から IssueCard に変更
                key={index}
                title={category.title}
                description={category.description}
                onClick={() => handleCardClick(category.path)} // ★onClick ハンドラを追加★
                // isSelected={category.title === '基本情報 科目B'} // ★基本情報 科目Bが選択されているスタイルを適用するためのpropsを追加（オプション）★
              />
            ))}
          </div>
        </div>

        {/* 右側のコハクとアドバイスエリア */}
        <div className="w-full lg:w-96"> {/* 画面幅が広い場合に固定幅になるように設定 */}
          <AdviceSection />
        </div>
      </div>

      {/* 下部のライトブルーのフッターのような部分 (もしあれば) */}
      {/* <div className="w-full h-20 bg-blue-400 mt-10"></div> */}
    </div>
  );
};

export default QuestionsPage;