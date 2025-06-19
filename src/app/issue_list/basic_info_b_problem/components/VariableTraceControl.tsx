/**
 * @file 変数表示とトレース操作を行うUIコンポーネントです。
 * @description
 * このコンポーネントは、問題ページの右側（または中央下部）に配置され、以下の機能を提供します。
 * 1. プログラム内の変数の現在の値をリアルタイムで表示します。
 * 2. 「次のトレース」「もう一度トレース」ボタンでトレースを操作します。
 * 3. 特定の問題（例: FizzBuzz）では、トレース開始時の初期値をユーザーが選択できるボタンを表示します。
 */

// --- React / Next.js のコア機能 ---
import React from 'react';

// --- 型定義 ---
// 外部ファイルから、このコンポーネントが必要とするデータの型定義をインポートします。
import { Problem } from '../data/problems';

/**
 * @interface VariableTraceControlProps
 * @description このコンポーネントが親コンポーネント（page.tsx）から受け取るProps（データや関数）の型を定義します。
 */
interface VariableTraceControlProps {
  problem: Problem;                                           // 現在表示中の問題データ全体
  variables: Record<string, number | null | string | number[]>; // プログラム内の変数の状態 (例: { x: 1, y: 2 })
  onNextTrace: () => void;                                    // 「次のトレース」ボタンが押されたときに実行される関数
  isTraceFinished: boolean;                                   // トレースが完了したかどうかのフラグ
  onResetTrace: () => void;                                   // 「もう一度トレース」ボタンが押されたときに実行される関数
  currentTraceLine: number;                                   // 現在のトレースのステップ数
  language: 'ja' | 'en';                                      // 現在の表示言語
  textResources: any;                                         // UIに表示するテキスト集
  onSetNum: (num: number) => void;                            // FizzBuzz問題などで、初期値を設定するために実行される関数
}

/**
 * 変数表示とトレース操作エリアのメインコンポーネント
 */
const VariableTraceControl: React.FC<VariableTraceControlProps> = ({
  problem,
  variables,
  onNextTrace,
  isTraceFinished,
  onResetTrace,
  currentTraceLine,
  language,
  textResources: t, // propsで受け取ったtextResourcesを、テンプレート内で `t` という短い名前で使えるようにします。
  onSetNum,
}) => {
  // --- 算出プロパティ ---
  // propsやstateから計算して得られる値を定義します。

  // FizzBuzz問題のように、問題データに `traceOptions.presets` が設定されているかどうかを確認します。
  const showPresets = problem.traceOptions?.presets;
  
  // 変数 `num` が設定されているか（nullでないか）を確認します。
  // これにより、「次のトレース」ボタンを有効化/無効化する条件として使います。
  const isNumSet = variables.num !== null;

  // --- Render (画面描画) ---
  // 画面の構造をJSX（HTMLに似た記法）で記述します。
  return (
    // コンポーネント全体のコンテナ
    <div className="p-4 flex flex-col items-center">
      
      {/* --- タイトル --- */}
      <h3 className="text-xl font-bold mb-4 text-gray-800">{t.variableSectionTitle}</h3>

      {/* --- 初期値選択ボタンエリア (特定の条件下でのみ表示) --- */}
      {/* `showPresets` が存在する場合、つまり問題データにプリセットが定義されている場合のみ、このエリアを表示します。 */}
      {showPresets && (
        <div className="w-full bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-center font-semibold mb-3 text-gray-700">
            1. `num` の値を選択
          </p>
          <div className="flex gap-3 justify-center">
            {/* プリセット値の配列をループして、値ごとにボタンを生成します。 */}
            {showPresets.map((num) => (
              <button
                key={num} // Reactがリスト内の各要素を効率的に管理するために必要な、一意の `key` を設定します。
                onClick={() => onSetNum(num)} // ボタンがクリックされたら、親から渡された`onSetNum`関数を実行します。
                // 選択中のボタンのスタイルを動的に変更します。
                className={`flex-1 px-4 py-2 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105
                  ${variables.num === num 
                    ? 'bg-emerald-500 ring-2 ring-emerald-300' // 現在選択されている値のボタンの色
                    : 'bg-indigo-500 hover:bg-indigo-600'      // それ以外のボタンの色
                  }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* --- 変数表示エリア --- */}
      <div className="w-full mb-6">
        <p className="text-center font-semibold mb-3 text-gray-700">2. 変数の状態</p>
        <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
          {/* `variables` オブジェクトのキーと値を一つずつ取り出して表示します。 */}
          {/* これにより、どんな名前や数の変数にも対応できる、汎用的な表示が可能になります。 */}
          {Object.entries(variables).map(([name, value]) => (
            <div key={name} className="flex items-center justify-between bg-white p-2 rounded border">
              {/* 変数名を表示 (例: "num", "x", "out") */}
              <span className="font-semibold mr-2 capitalize">{name}</span>
              {/* 変数の値を表示 */}
              <span className="font-mono bg-gray-100 border border-gray-300 px-3 py-1 rounded w-32 text-center overflow-x-auto">
                { 
                  // 値が配列の場合 (例: [3, 5, 6]) は、カンマ区切りの文字列に変換して表示
                  Array.isArray(value) 
                    ? `[${value.join(', ')}]` 
                    // 値がnullの場合はハイフン'―'を、それ以外の場合はそのまま値を表示
                    : (value !== null ? value.toString() : '―')
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* --- トレース操作ボタン --- */}
      <div className="w-full">
        <p className="text-center font-semibold mb-3 text-gray-700">3. トレース実行</p>
        <div className="flex w-full gap-4">
          
          {/* 「もう一度トレース」ボタン */}
          <button
            onClick={onResetTrace} // クリックで親から渡された`onResetTrace`関数を実行
            className="flex-1 py-3 px-6 text-xl font-semibold rounded-lg shadow-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            {t.resetTraceButton}
          </button>
          
          {/* 「次のトレース」ボタン */}
          <button
            onClick={onNextTrace} // クリックで親から渡された`onNextTrace`関数を実行
            // 特定の条件下でボタンを非活性化(disabled)します。
            // 1. `isNumSet`がfalse (FizzBuzz問題でnumが未選択)
            // 2. `isTraceFinished`がtrue (トレースが完了した)
            disabled={!isNumSet || isTraceFinished} 
            className={`flex-1 py-3 px-6 text-xl font-semibold text-white rounded-lg shadow-sm transition-colors
              ${(!isNumSet || isTraceFinished)
                ? 'bg-gray-400 cursor-not-allowed' // 非活性時のスタイル (グレーアウト)
                : 'bg-blue-500 hover:bg-blue-600'    // 有効時のスタイル
              }`}
          >
            {/* トレースが完了しているかどうかでボタンのテキストを切り替えます */}
            {isTraceFinished ? t.traceCompletedButton : t.nextTraceButton}
          </button>
        </div>
      </div>
    </div>
  );
};

// このコンポーネントを他のファイルからインポートして使用できるようにします。
export default VariableTraceControl;