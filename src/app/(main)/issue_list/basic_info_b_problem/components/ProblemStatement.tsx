// Reactライブラリをインポートします。
import React from 'react';

// --- プロップスの型定義 ---

/**
 * 解答の選択肢のデータ構造を定義するインターフェース。
 */
interface AnswerOption {
  label: string; // 解答の表示ラベル（例: 'ア', 'A'）
  value: string; // 解答の実際の値（例: '1,2'）。正誤判定に使用。
}

/**
 * ProblemStatement コンポーネントが受け取るプロップスの型を定義するインターフェース。
 */
interface ProblemStatementProps {
  description: string;
  programText: string;               // 表示するプログラム（疑似言語）のテキスト
  answerOptions: AnswerOption[];     // 解答群の選択肢の配列
  onSelectAnswer: (selectedValue: string) => void; // 解答が選択されたときに呼び出される関数
  selectedAnswer: string | null;     // ユーザーが現在選択している解答の値（未選択ならnull）
  correctAnswer: string;             // 問題の正しい解答の値
  isAnswered: boolean;               // ユーザーがすでに問題を解答済みかどうかのフラグ
  explanation: string;               // 問題の解説テキスト
  language: 'ja' | 'en';             // 現在の表示言語（日本語 'ja' または英語 'en'）
  textResources: any;                // 親コンポーネントから渡される、現在の言語に応じたUIテキスト集
}

// ProblemStatement コンポーネントの定義
// このコンポーネントは、問題文、疑似言語プログラム、解答群、そして解答後の解説を表示します。
const ProblemStatement: React.FC<ProblemStatementProps> = ({
  description,
  programText,       // プログラムテキスト
  answerOptions,     // 解答の選択肢
  onSelectAnswer,    // 解答選択時のハンドラ
  selectedAnswer,    // ユーザーが選択した解答
  correctAnswer,     // 正しい解答
  isAnswered,        // 回答済みフラグ
  explanation,       // 解説テキスト
  language,          // 現在の言語
  textResources: t,  // 言語に応じたテキストリソース（tというエイリアスで参照）
}) => {
  return (
    // コンポーネントの最上位コンテナ。高さをいっぱいに使い、中身を縦方向に配置
    <div className="flex flex-col h-full">
      {/* 問題のタイトルを表示 */}
      <h2 className="text-xl font-bold mb-4 text-gray-700">{t.title}</h2>
      {/* タイトルと問題文の間の区切り線 */}
      <hr className="mb-6 border-gray-300" />

      {/* 問題文のエリア */}
      <div className="mb-8 text-lg text-gray-800 leading-loose whitespace-pre-wrap">
        {description}
      </div>

      {/* programText が空でない場合のみ表示する条件を追加 */}
      {programText && programText.trim().length > 0 && (
        <div className="mb-6">
          <p className="font-semibold text-gray-700 mb-2">{t.programTitle}</p>
          {/* `pre`タグで整形済みテキストとしてプログラムコードを表示
              `whitespace-pre-wrap`で改行を保持し、`overflow-x-auto`で横スクロールを可能にする */}
          <pre className="bg-gray-50 p-4 rounded-lg text-base text-gray-800 whitespace-pre-wrap overflow-x-auto font-mono leading-relaxed">
            {programText}
          </pre>
        </div>
      )}

      {/* 解答群の表示セクション */}
      <div className="mb-6">
        <p className="font-semibold text-gray-700 mb-3">{t.answerGroup}</p>
        {/* 解答群を2列グリッドで表示 */}
        <div className="grid grid-cols-2 gap-4 text-lg text-gray-800">
          {/* `answerOptions`配列をマップして、各選択肢をボタンとしてレンダリング */}
          {answerOptions.map((option) => {
            // 各選択肢が正しい答えかどうかを判定
            const isCorrect = option.value === correctAnswer;
            // 各選択肢がユーザーによって現在選択されているか判定
            const isSelected = option.value === selectedAnswer;

            // ボタンに適用するTailwind CSSクラスを動的に構築
            let buttonClasses = `
              flex items-center justify-start p-3 border rounded-lg transition-all duration-200
              ${isAnswered && isCorrect ? 'bg-green-100 border-green-500 ring-2 ring-green-300' : ''}  /* 回答済みで正解の場合のスタイル */
              ${isAnswered && isSelected && !isCorrect ? 'bg-red-100 border-red-500 ring-2 ring-red-300' : ''} /* 回答済みで選択済みかつ不正解の場合のスタイル */
              ${!isAnswered ? 'bg-white hover:bg-gray-100 cursor-pointer' : 'cursor-not-allowed'} /* 未回答時はクリック可能、回答済みは無効化 */
              ${isSelected && !isAnswered ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'} /* 未回答時に選択された場合のスタイル（青い枠） */
            `;

            return (
              // 各解答選択肢のボタン
              <button
                key={option.label} // Reactのリストレンダリングには一意の`key`が必要
                className={buttonClasses} // 動的に生成されたクラスを適用
                onClick={() => onSelectAnswer(option.value)} // クリック時に親コンポーネントのハンドラを呼び出し、選択された値を渡す
                disabled={isAnswered} // 回答済みの場合、ボタンを無効化する
              >
                {/* 選択肢のラベル（例: ア、イ、ウ）と値（例: 1,2）を表示 */}
                <span className="font-bold mr-2">{option.label}</span> {option.value}
              </button>
            );
          })}
        </div>
      </div>

      {/* 解説表示エリア (isAnsweredがtrue、つまり回答済みの場合のみ表示) */}
      {isAnswered && (
        <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-inner border border-gray-200">
          {/* 解説のタイトル */}
          <h3 className="text-lg font-bold mb-4 text-gray-700">{t.explanationTitle}</h3>
          {/* 解説のテキストコンテンツ
              `whitespace-pre-line`で文字列内の改行をHTMLの改行として表示
              `explanation.split('\n').map`で各行を処理し、特定のキーワードを含む行をハイライト */}
          <div className="text-gray-800 text-base leading-loose">
            {explanation.split('\n').map((line, index) => {
              if (line.trim() === '') {
                 return <div key={index} className="h-4" />;
              }
              // ハイライトしたいキーワードのリスト
              const highlightedKeywords = ['x ← y', 'y ← z', 'z ← x'];
              // 現在の行がハイライトキーワードを含んでいるか判定
              const isHighlighted = highlightedKeywords.some(keyword => line.includes(keyword));
              return (
                // React.Fragmentを使って、余分なDOMノードを追加せずにリストの要素をグループ化
                <React.Fragment key={index}>
                  {isHighlighted ? (
                    // ハイライトされた行のスタイル
                    <div className="bg-yellow-100 p-2 my-2 inline-block rounded font-mono border border-yellow-200">
                      {line.trim()} {/* 行頭行末の空白を除去して表示 */}
                    </div>
                  ) : (
                    // 通常の行のスタイル
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