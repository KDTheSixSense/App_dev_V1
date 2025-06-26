/**
 * @file 変数表示とトレース操作を行うUIコンポーネントです。
 * @description
 * このコンポーネントは、問題ページの右側（または中央下部）に配置され、以下の機能を提供します。
 * 1. プログラム内の変数の現在の値をリアルタイムで表示します。
 * 2. 「次のトレース」「もう一度トレース」ボタンでトレースを操作します。
 * 3. 特定の問題では、トレース開始時の初期値をユーザーが選択できるボタンを表示します。
 */

// --- React / Next.js のコア機能 ---
import React from 'react';

// --- 型定義 ---
import type { SerializableProblem } from '@/lib/data';
import type { VariablesState, QueueItem } from '../data/problems';


/**
 * @interface VariableTraceControlProps
 * @description このコンポーネントが親コンポーネントから受け取るPropsの型を定義します。
 */
interface VariableTraceControlProps {
  problem: SerializableProblem;                                         
  variables: VariablesState; 
  onNextTrace: () => void;
  isTraceFinished: boolean;
  onResetTrace: () => void;   
  currentTraceLine: number;
  language: 'ja' | 'en';
  textResources: any;
  onSetNum: (num: number) => void;
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
  textResources: t,
  onSetNum,
}) => {
  
  const showPresets = problem.traceOptions?.presets;
  const isNumSet = variables?.num !== null;

  return (
    <div className="p-4 flex flex-col items-center">
      <h3 className="text-xl font-bold mb-4 text-gray-800">{t.variableSectionTitle}</h3>
      {showPresets && (
        <div className="w-full bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-center font-semibold mb-3 text-gray-700">
            1. `num` の値を選択
          </p>
          <div className="flex gap-3 justify-center">
            {showPresets.map((num) => (
              <button
                key={num}
                onClick={() => onSetNum(num)}
                className={`flex-1 px-4 py-2 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105
                  ${variables.num === num 
                    ? 'bg-emerald-500 ring-2 ring-emerald-300' 
                    : 'bg-indigo-500 hover:bg-indigo-600'
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
          {/* 修正: 様々な型の変数を表示できるようにロジックを更新 */}
          {Object.entries(variables).map(([name, value]) => {
            let displayValue: string;
            
            if (value === null || typeof value === 'undefined') {
                displayValue = '―';
            } else if (Array.isArray(value)) {
                if (value.length === 0) {
                    displayValue = '[]';
                } 
                else if (name === 'queue' && typeof value[0] === 'object' && value[0] !== null) {
                    const queueItems = value as QueueItem[];
                    displayValue = `[${queueItems.map(item => `"${item.value}"(${item.prio})`).join(', ')}]`;
                }
                // 【追加】callStackを分かりやすく表示するロジック
                else if (name === 'callStack' && typeof value[0] === 'object' && value[0] !== null) {
                    const stackFrames = value as {n: number, pc: number}[];
                    displayValue = `[${stackFrames.map(f => `order(${f.n}, pc:${f.pc})`).join(', ')}]`;
                }
                else {
                    // ネストした配列も考慮して再帰的に文字列化
                    displayValue = JSON.stringify(value, null, 0).replace(/"/g, '');
                }
            } else {
                displayValue = value.toString();
            }

            return (
                <div key={name} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="font-semibold mr-2 capitalize">{name}</span>
                    <span className="font-mono bg-gray-100 border border-gray-300 px-3 py-1 rounded w-48 text-center overflow-x-auto custom-scrollbar">
                        {displayValue}
                    </span>
                </div>
            );
          })}
        </div>
      </div>

      {/* --- トレース操作ボタン --- */}
      <div className="w-full">
        <p className="text-center font-semibold mb-3 text-gray-700">3. トレース実行</p>
        <div className="flex w-full gap-4">
          <button
            onClick={onResetTrace}
            className="flex-1 py-3 px-6 text-xl font-semibold rounded-lg shadow-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            {t.resetTraceButton}
          </button>
          <button
            onClick={onNextTrace}
            disabled={showPresets ? (!isNumSet || isTraceFinished) : isTraceFinished}
            className={`flex-1 py-3 px-6 text-xl font-semibold text-white rounded-lg shadow-sm transition-colors
              ${ (showPresets ? (!isNumSet || isTraceFinished) : isTraceFinished)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
              }`}
          >
            {isTraceFinished ? t.traceCompletedButton : t.nextTraceButton}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariableTraceControl;
