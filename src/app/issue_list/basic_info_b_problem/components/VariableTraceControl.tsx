// Reactライブラリをインポートします。
import React from 'react';

// --- プロップスの型定義 ---

/**
 * VariableTraceControl コンポーネントが受け取るプロップスの型を定義するインターフェース。
 */
interface VariableTraceControlProps {
  variables: { x: number | null; y: number | null; z: number | null }; // x, y, z変数の現在の値（数値またはnull）
  onNextTrace: () => void;                                         // 「次のトレース」ボタンクリック時に呼び出される関数
  isTraceFinished: boolean;                                        // トレースが完了しているかどうかのフラグ
  onResetTrace: () => void;                                        // 「もう一度トレース」ボタンクリック時に呼び出される関数
  currentTraceLine: number;                                        // 現在トレースしている行番号（0-indexed）
  language: 'ja' | 'en';                                           // 現在の表示言語（日本語 'ja' または英語 'en'）
  textResources: any;                                              // 親コンポーネントから渡される、現在の言語に応じたUIテキスト集
}

// VariableTraceControl コンポーネントの定義
// このコンポーネントは、変数の現在値の表示と、トレース操作（次のステップ、リセット）のボタンを提供します。
const VariableTraceControl: React.FC<VariableTraceControlProps> = ({
  variables,        // 現在の変数オブジェクト
  onNextTrace,      // 次のトレースへ進むハンドラ
  isTraceFinished,  // トレース完了フラグ
  onResetTrace,     // トレースリセットハンドラ
  currentTraceLine, // 現在のトレース行
  language,         // 現在の言語
  textResources: t, // 言語に応じたテキストリソース（tというエイリアスで参照）
}) => {
  return (
    // コンポーネントの最上位コンテナ。内部要素を中央に縦方向に配置し、パディングを設定
    <div className="p-4 flex flex-col items-center">
      {/* 変数セクションのタイトル */}
      <h3 className="text-lg font-bold mb-4 text-gray-700">{t.variableSectionTitle}</h3>

      {/* 変数表示エリア。1列のグリッドで各変数を表示 */}
      <div className="grid grid-cols-1 gap-2 mb-6 w-full max-w-xs">
        {/* 変数 x の表示 */}
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
          <span className="font-semibold mr-2">{t.varX}</span> {/* 変数xのラベル（言語対応） */}
          {/* 変数の値を表示。nullの場合は「―」を表示 */}
          <span className="font-mono bg-white border border-gray-300 px-3 py-1 rounded w-20 text-center">
            {variables.x !== null ? variables.x : '―'}
          </span>
        </div>
        {/* 変数 y の表示 */}
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
          <span className="font-semibold mr-2">{t.varY}</span> {/* 変数yのラベル（言語対応） */}
          <span className="font-mono bg-white border border-gray-300 px-3 py-1 rounded w-20 text-center">
            {variables.y !== null ? variables.y : '―'}
          </span>
        </div>
        {/* 変数 z の表示 */}
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
          <span className="font-semibold mr-2">{t.varZ}</span> {/* 変数zのラベル（言語対応） */}
          <span className="font-mono bg-white border border-gray-300 px-3 py-1 rounded w-20 text-center">
            {variables.z !== null ? variables.z : '―'}
          </span>
        </div>
      </div>

      {/* トレース操作ボタン群。横並びで配置し、均等な幅にする */}
      <div className="flex w-full gap-4">
        {/* 「もう一度トレース」ボタン */}
        <button
          onClick={onResetTrace} // クリックでトレースをリセットするハンドラを呼び出す
          // ボタンの有効/無効状態を制御
          // トレース開始前（currentTraceLineが0で、かつトレースが完了していない）の場合は無効化
          disabled={currentTraceLine === 0 && !isTraceFinished}
          className={`flex-1 py-3 px-6 text-xl font-semibold rounded-lg shadow-sm
                     ${(currentTraceLine === 0 && !isTraceFinished)
                       ? 'bg-gray-400 text-gray-700 cursor-not-allowed' // 無効時のスタイル
                       : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75'} // 有効時のスタイル
                     transition-colors duration-200`} // スタイル変更時のアニメーション
        >
          {t.resetTraceButton} {/* 言語に応じたボタンテキスト */}
        </button>

        {/* 「次のトレース」ボタン */}
        <button
          onClick={onNextTrace} // クリックで次のトレースステップへ進むハンドラを呼び出す
          // ボタンの有効/無効状態を制御
          // トレースが完了している場合は無効化
          disabled={isTraceFinished}
          className={`flex-1 py-3 px-6 text-xl font-semibold text-white rounded-lg shadow-sm
                     ${isTraceFinished
                       ? 'bg-gray-400 cursor-not-allowed' // 無効時のスタイル
                       : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-75'} // 有効時のスタイル
                     transition-colors duration-200`} // スタイル変更時のアニメーション
        >
          {/* トレース完了時は「トレース完了」、それ以外は「次のトレース」と表示 */}
          {isTraceFinished ? t.traceCompletedButton : t.nextTraceButton}
        </button>
      </div>
    </div>
  );
};

export default VariableTraceControl;