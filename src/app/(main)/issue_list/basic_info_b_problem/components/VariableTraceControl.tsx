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
  onPrevTrace: () => void;
  canGoBack: boolean;
  currentTraceLine: number;
  language: 'ja' | 'en';
  textResources: any;
  onSetNum: (num: number) => void;
  onSetData: (data: Record<string, any>, label: string) => void;  isPresetSelected: boolean;
  selectedLogicVariant: string | null;
  onSetLogicVariant: (variant: string) => void;
  selectedPresetLabel: string | null;
}

/**
 * 変数表示とトレース操作エリアのメインコンポーネント
 */
const VariableTraceControl: React.FC<VariableTraceControlProps> = ({
  problem,
  variables,
  onNextTrace,
  onPrevTrace,
  isTraceFinished,
  canGoBack,
  onResetTrace,
  currentTraceLine,
  language,
  textResources: t,
  onSetNum,
  onSetData,
  isPresetSelected,
  selectedLogicVariant,
  onSetLogicVariant,
  selectedPresetLabel,
}) => {
  
  const showPresets = problem.traceOptions?.presets;
  const showArrayPresets = problem.traceOptions?.presets_array;
  const showLogicVariants = problem.traceOptions?.logicVariants;
  // プリセットが選択されたかを判定するフラグ
  const isNumSet = variables?.num !== null;
  // listData が存在するかどうかで判定するように
  const isDataSet = variables.listData !== null ||
                    variables.data !== null && (
                      variables.target !== null || 
                      variables.qVal !== null || 
                      variables.c1 !== null || 
                      variables.edgeList !== null
                    );

  // トレース開始前（プリセット未選択など）はボタンを無効化するためのチェック
  const isReadyToTrace = 
    !((showPresets && !showArrayPresets && !showLogicVariants && !isNumSet) ||
      (showArrayPresets && !showPresets && !showLogicVariants && !isPresetSelected) ||
      (showLogicVariants && !showPresets && !showArrayPresets && !selectedLogicVariant) ||
      (showLogicVariants && showArrayPresets && (!selectedLogicVariant || !isPresetSelected)) ||
      (showLogicVariants && showPresets && (!selectedLogicVariant || !isNumSet)));
  
  // 「次へ」ボタンを無効化する条件
  const isNextButtonDisabled = isTraceFinished || !isReadyToTrace;

  // 「前へ」ボタンを無効化する条件
  const isPrevButtonDisabled = !canGoBack || !isReadyToTrace;
  // ステップ番号を動的に計算
  let stepCounter = 1;
  const logicStepNum = showLogicVariants ? stepCounter++ : null;
  const dataStepNum = (showPresets || showArrayPresets) ? stepCounter++ : null;
  const varStepNum = dataStepNum ? dataStepNum : stepCounter++;
  const traceStepNum = stepCounter++;

  return (
    <div className="p-4 flex flex-col items-center">
      <h3 className="text-xl font-bold mb-4 text-gray-800">{t.variableSectionTitle}</h3>

      {/* ロジック選択ボタン (問4専用) */}
      {showLogicVariants && (
        <div className="w-full bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-center font-semibold mb-3 text-gray-700">{logicStepNum}. トレースするロジックを選択</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {showLogicVariants.map((variant) => (
              <button 
                key={variant.id} 
                onClick={() => onSetLogicVariant(variant.id)}
                className={`px-3 py-2 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105 text-left text-sm
                  ${selectedLogicVariant === variant.id
                    ? 'bg-emerald-500 ring-2 ring-emerald-300'
                    : 'bg-indigo-500 hover:bg-indigo-600'
                  }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* プリセット選択 (番号を動的に) */}
      {(showPresets || showArrayPresets) && (
        <div className="w-full bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-center font-semibold mb-3 text-gray-700">
            {dataStepNum}. {showPresets ? '`num` の値を選択' : '入力データを選択してトレース'}
          </p>
          
          {/* (配列プリセットのボタン) */}
          {showArrayPresets && (
             <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
               {(showArrayPresets as {label: string, value: any}[]).map((preset) => {
                // プリセット(preset.value)内のすべてのキー(例: 'data', 'target')が
                // 現在の変数(variables)と一致するかを判定する
                // const presetValue = preset.value;
                // const isActive = Object.keys(presetValue).every(key => {
                //   // JSON.stringifyで配列やオブジェクトも正しく比較
                //   return JSON.stringify(variables[key]) === JSON.stringify(presetValue[key]);
                // });
                const isActive = selectedPresetLabel === preset.label;

                 return (
                   <button 
                    key={preset.label} 
                    onClick={() => onSetData(preset.value, preset.label)}
                    // classNameの判定を新しい `isActive` 変数に変更
                    className={`px-3 py-2 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105 ${
                      isActive
                        ? 'bg-emerald-500 ring-2 ring-emerald-300' // Green
                        : 'bg-indigo-500 hover:bg-indigo-600' // Blue
                    }`}
                  >
                    {preset.label}
                  </button>
                );
               })}
             </div>
          )}

          {/* (数値プリセットのボタン) */}
          {showPresets && (
            <div className="flex gap-3 justify-center">
              {showPresets.map((num) => (
                <button
                  key={num}
                  onClick={() => onSetNum(num)}
                  className={`flex-1 px-4 py-2 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105
                    ${String(selectedPresetLabel) === String(num)
                      ? 'bg-emerald-500 ring-2 ring-emerald-300' 
                      : 'bg-indigo-500 hover:bg-indigo-600'
                    }`}                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* --- 変数表示エリア --- */}
      <div className="w-full mb-6">
        <p className="text-center font-semibold mb-3 text-gray-700">{varStepNum}. 変数の状態</p>
        <div className="grid grid-cols-1 gap-2 w-full px-5">
          {Object.entries(variables)
          .flatMap(([name, value]) => {
              // まずは現在の変数をリストに入れる
              const items = [[name, value]];

              // もし変数が 'prev' で、かつ listData が存在し、prev が数値を指している場合
              if (name === 'prev' && variables.listData && typeof value === 'number') {
                const prevNode = variables.listData[value];
                // prevノードが存在すれば、その next の値を持つ 'prev.next' エントリを追加
                if (prevNode) {
                  items.push(['prev.next', prevNode.next]);
                }
              }
              return items;
            })
          .map(([name, value]) => {
            // initialized フラグはUIに表示しない
            if (['initialized', 'problemId', 'currentLine'].includes(name)) return null;

            let displayValue: string;
            
            if (['prev', 'curr', 'listHead','prev.next'].includes(name) && variables.listData) {
                // value が null なら "null"
                if (value === null) {
                    displayValue = 'null';
                } else if (typeof value === 'number') {
                    // value が数値(インデックス)の場合、listDataから実体を探して表示
                    const node = variables.listData[value];
                    if (node) {
                        // ユーザーの要望通り prev.data と prev.next の形式で見せる
                        // (内部データが val でも、表示上 data にしたい場合はここで書き換え可能)
                        const nextStr = node.next === null ? 'null' : node.next;
                        // 例: { data: "A", next: 2 } のように整形
                        displayValue = `{ data: "${node.val}", next: ${nextStr} }`;
                        
                        // ※補足: デバッグ用にインデックスも残したい場合は以下のようにしても良い
                        // displayValue = `(idx:${value}) { data: "${node.val}", next: ${nextStr} }`;
                    } else {
                        displayValue = String(value); // 範囲外などでノードが取れない場合
                    }
                } else {
                    // それ以外の型ならそのまま文字列化
                    displayValue = String(value);
                }
            }
            else if (value === null || typeof value === 'undefined') {
                displayValue = '―';
            } else if (Array.isArray(value)) {
                if (value.length === 0) {
                    displayValue = '[]';
                } 
                else if (name === 'queue' && typeof value[0] === 'object' && value[0] !== null) {
                    const queueItems = value as QueueItem[];
                    displayValue = `[${queueItems.map(item => `"${item.value}"(${item.prio})`).join(', ')}]`;
                }
                //listData の表示を改善
                else if (name === 'listData' && typeof value[0] === 'object' && value[0] !== null) {
                    const listItems = value as {val: string, next: number | null}[];
                    displayValue = `[${listItems.map((item, idx) => `(idx:${idx}, val:${item.val}, next:${item.next === null ? 'null' : item.next})`).join(', ')}]`;
                }
                else if (name === 'callStack' && Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
              const stackFrames = value as any[];
              // callStackのフレーム形式を判定して表示を切り替える
              displayValue = `[${stackFrames.map(f => {
                if ('func' in f && 'returnTo' in f) {
                  const returnLineDisplay = f.returnTo === 99 ? 'End' : `L${f.returnTo + 1}`;
                  return `${f.func}(ret: ${returnLineDisplay})`;
                }
                // 後方互換性のため、他の問題の形式も残す
                if ('n' in f && 'pc' in f) {
                  return `order(${f.n}, pc:${f.pc})`;
                }
                return JSON.stringify(f); // 想定外の形式はそのまま表示
              }).join(', ')}]`;
            }
                else {
                    displayValue = JSON.stringify(value, null, 0).replace(/"/g, '');
                }
            } else {
                displayValue = value.toString();
            }

            return (
                <div key={name} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="font-semibold mr-2 capitalize">{name}</span>
                    <span className="font-mono bg-gray-100 border border-gray-300 px-3 py-1 rounded w-60 text-center overflow-x-auto custom-scrollbar">
                        {displayValue}
                    </span>
                </div>
            );
          })}
        </div>
      </div>

      {/* --- トレース操作ボタン（配置変更） --- */}
      <div className="w-full">
        <p className="text-center font-semibold mb-3 text-gray-700">{traceStepNum}. トレース実行</p>
        
        {/* 3つのボタンを横並び配置 */}
        <div className="grid grid-cols-3 gap-2">
          
          {/* 1. リセットボタン */}
          <button
            onClick={onResetTrace}
            className="py-3 text-sm sm:text-base font-semibold rounded-lg shadow-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            {t.resetTraceButton}
          </button>

          {/* 2. 前へボタン (New!) */}
          <button
            onClick={onPrevTrace}
            disabled={isPrevButtonDisabled}
            className={`py-3 text-sm sm:text-base font-semibold text-white rounded-lg shadow-sm transition-colors
              ${isPrevButtonDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600' // 戻るボタンは少し違う色にするとわかりやすい
              }`}
          >
            {t.prevTraceButton}
          </button>

          {/* 3. 次へボタン */}
          <button
            onClick={onNextTrace}
            disabled={isNextButtonDisabled}
            className={`py-3 text-sm sm:text-base font-semibold text-white rounded-lg shadow-sm transition-colors
              ${isNextButtonDisabled
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