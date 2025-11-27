// Reactライブラリをインポートします。
import React from 'react';
import Image from 'next/image';

// ローカルの AnswerOption 型定義（@/lib/data に存在しないためここで定義）
type AnswerOption = {
  label: string;
  value: string;
};

// --- プロップスの型定義 ---


/**
 * ProblemStatement コンポーネントが受け取るプロップスの型を定義するインターフェース。
 */
interface ProblemStatementProps {
  description: string;
  // programText: string; // Removed as it's not used for Basic Info A
  answerOptions: AnswerOption[];
  onSelectAnswer: (selectedValue: string) => void;
  selectedAnswer: string | null;
  correctAnswer: string;
  isAnswered: boolean;
  explanation: string;
  language: 'ja' | 'en';
  imagePath?: string; // Optional image path
  textResources: any;
}

// ProblemStatement コンポーネントの定義
const ProblemStatement: React.FC<ProblemStatementProps> = ({
  description,
  answerOptions,
  onSelectAnswer,
  selectedAnswer,
  correctAnswer,
  isAnswered,
  explanation,
  imagePath,
  language,
  textResources: t,
}) => {
  // Debugging console logs removed
  // console.log(`[ProblemStatement] Received imagePath prop: "${imagePath}"`);
  // console.log(`[ProblemStatement] Value of imagePath just before return: "${imagePath}"`);

  return (
    // コンポーネントの最上位コンテナ。
    <div className="flex flex-col h-full">
      {/* 問題のタイトルを表示 */}
      <h2 className="text-xl font-bold mb-4 text-gray-700">{t.title}</h2>
      {/* タイトルと問題文の間の区切り線 */}
      <hr className="mb-6 border-gray-300" />

      {/* --- 画像表示エリア (デバッグ要素削除) --- */}
      {imagePath ? (
        // Removed red border and debug text
        <div className="mb-6">
          {/* 画像コンテナ */}
          <div className="relative w-full max-w-lg mx-auto"> {/* Added max-width and centering */}
            <Image
              src={imagePath}
              alt={`問題画像: ${t.title || 'No Title'}`}
              width={500} // Keep width (or adjust)
              height={300} // Keep height (or adjust)
              className="rounded-lg border object-contain mx-auto" // Keep styling
              priority
              // unoptimized={true} // Consider keeping or removing based on testing
              style={{
                maxWidth: '100%',
                height: 'auto', // Keep auto height
              }}
              // Removed onError and onLoad logs if not needed
            />
          </div>
        </div>
      ) : (
        // Keep fallback text, adjusted style
        <p className="text-sm text-gray-500 mb-6 italic">(この問題には画像がありません)</p>
      )}
      {/* --- 画像表示エリアここまで --- */}


      {/* 解答群の表示セクション */}
      <div className="mb-6">
        <p className="font-semibold text-gray-700 mb-3">{t.answerGroup}</p>
        <div className="grid grid-cols-2 gap-4 text-base text-gray-800">
          {answerOptions.map((option) => {
            const isCorrect = option.value === correctAnswer;
            const isSelected = option.value === selectedAnswer;
            let buttonClasses = `
              flex items-center justify-start p-3 border rounded-lg transition-all duration-200
              ${isAnswered && isCorrect ? 'bg-green-100 border-green-500 ring-2 ring-green-300' : ''}
              ${isAnswered && isSelected && !isCorrect ? 'bg-red-100 border-red-500 ring-2 ring-red-300' : ''}
              ${!isAnswered ? 'bg-white hover:bg-gray-100 cursor-pointer' : 'cursor-not-allowed'}
              ${isSelected && !isAnswered ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'}
            `;
            return (
              <button
                key={option.label}
                className={buttonClasses}
                onClick={() => onSelectAnswer(option.value)}
                disabled={isAnswered}
              >
                <span className="font-bold mr-2">{option.label}</span> {option.value}
              </button>
            );
          })}
        </div>
      </div>

      {/* 解説表示エリア */}
      {isAnswered && (
        <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-inner border border-gray-200">
          <h3 className="text-lg font-bold mb-4 text-gray-700">{t.explanationTitle}</h3>
          <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
            {explanation.split('\n').map((line, index) => {
              const highlightedKeywords = ['x ← y', 'y ← z', 'z ← x'];
              const isHighlighted = highlightedKeywords.some(keyword => line.includes(keyword));
              return (
                <React.Fragment key={index}>
                  {isHighlighted ? (
                    <div className="bg-yellow-100 p-2 my-2 inline-block rounded font-mono border border-yellow-200">
                      {line.trim()}
                    </div>
                  ) : (
                    <p>{line.trim()}</p>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemStatement;