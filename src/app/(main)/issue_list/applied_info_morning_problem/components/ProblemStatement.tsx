import React from 'react';

interface AnswerOption {
  label: string;
  value: string;
}

interface ProblemStatementProps {
  description: string;
  // programText: string; // 削除: 午前問題には不要
  imagePath?: string | null; // 追加: 画像パスを受け取る
  answerOptions: AnswerOption[];
  onSelectAnswer: (selectedValue: string) => void;
  selectedAnswer: string | null;
  correctAnswer: string;
  isAnswered: boolean;
  explanation: string;
  language: 'ja' | 'en';
  textResources: any;
}

const ProblemStatement: React.FC<ProblemStatementProps> = ({
  description,
  imagePath,         // 追加
  // programText,    // 削除
  answerOptions,
  onSelectAnswer,
  selectedAnswer,
  correctAnswer,
  isAnswered,
  explanation,
  language,
  textResources: t,
}) => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 text-gray-700">{t.title}</h2>
      <hr className="mb-6 border-gray-300" />

      {/* 問題文 */}
      <div className="mb-6 text-base text-gray-800 leading-relaxed whitespace-pre-wrap sr-only">
        {description}
      </div>

      {/* 画像表示エリア (画像パスがある場合のみ表示) */}
      {imagePath && (
        <div className="mb-6 flex justify-center">
          {/* Next.jsのImageコンポーネントを使う場合、サイズ指定が必須になるため
              ここでは汎用的なimgタグを使用していますが、必要に応じてnext/imageに置き換えてください */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePath}
            alt="問題画像"
            className="max-w-full h-auto rounded"
            style={{ maxHeight: '500px' }} // 画像が大きすぎないように制限
          />
        </div>
      )}

      {/* 解答群 */}
      <div className="mb-6">
        <p className="font-semibold text-gray-700 mb-3">{t.answerGroup}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base text-gray-800">
          {answerOptions.map((option) => {
            const isCorrect = option.value === correctAnswer;
            const isSelected = option.value === selectedAnswer;

            let buttonClasses = `
              flex items-center justify-start p-3 border rounded-lg transition-all duration-200
              ${isAnswered && isCorrect ? 'bg-green-100 border-green-500 ring-2 ring-green-300' : ''}
              ${isAnswered && isSelected && !isCorrect ? 'bg-red-100 border-red-500 ring-2 ring-red-300' : ''}
              ${!isAnswered ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed'}
              ${isSelected && !isAnswered ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'}
            `;

            return (
              <button
                key={option.label}
                className={buttonClasses}
                onClick={() => !isAnswered && onSelectAnswer(option.value)}
                disabled={isAnswered}
              >
                <span className="font-bold mr-3 inline-block w-6">{option.label}</span>
                <span className="flex-1 text-left">{option.value}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 解説 */}
      {isAnswered && (
        <div className="bg-blue-50 p-6 rounded-lg mt-8 shadow-sm border border-blue-100">
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
            <span className="bg-blue-500 w-1 h-6 mr-3 rounded-full"></span>
            {t.explanationTitle}
          </h3>
          <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
            {explanation}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemStatement;