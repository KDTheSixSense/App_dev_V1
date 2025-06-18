import React from 'react';

interface IssueCardProps { // QuestionCardProps から IssueCardProps に変更
  title: string;
  description: string;
  onClick?: () => void; // クリックハンドラを追加
  isSelected?: boolean; // 選択状態を示すプロップを追加 (オプション)
}

const IssueCard: React.FC<IssueCardProps> = ({ title, description, onClick, isSelected }) => {
  return (
    <button
      className={`
        bg-gray-50 border rounded-lg p-6 shadow-sm
        hover:bg-gray-100 hover:shadow-md transition-all duration-200
        flex flex-col items-start text-left focus:outline-none focus:ring-2
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200 focus:ring-blue-400'}
      `}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 whitespace-pre-line">{description}</p>
    </button>
  );
};

export default IssueCard; // QuestionCard から IssueCard に変更