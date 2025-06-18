import React from 'react';
import QuestionCard from './components/IssueCard';
import AdviceSection from './components/AdviceSection';

// カードのデータ
const questionCategories = [
  { title: 'ITパスポート', description: 'Title\nDescription' },
  { title: '基本情報 科目A', description: 'Title\nDescription' },
  { title: '基本情報 科目B', description: 'Title\nDescription' },
  { title: '応用情報 午前', description: 'Title\nDescription' },
  { title: '応用情報 午後', description: 'Title\nDescription' },
  { title: '情報検定', description: 'Title\nDescription' },
  { title: '学校課題', description: 'Title\nDescription' },
  { title: 'Java', description: 'Title\nDescription' },
  { title: 'Python', description: 'Title\nDescription' },
];

const QuestionsPage: React.FC = () => {
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
              <QuestionCard
                key={index}
                title={category.title}
                description={category.description}
                // onClickハンドラを必要に応じて追加
                // onClick={() => console.log(`${category.title} clicked`)}
              />
            ))}
          </div>
        </div>

        {/* 右側のコハクとアドバイスエリア */}
        <div className="w-full lg:w-96"> {/* 画面幅が広い場合に固定幅になるように設定 */}
          <AdviceSection />
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage;