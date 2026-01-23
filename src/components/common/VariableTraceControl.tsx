/**
 * @file 変数表示とトレース操作を行うUIコンポーネントです。
 * @description
 * このコンポーネントは、問題ページの右側（または中央下部）に配置され、以下の機能を提供します。
 * 1. プログラム内の変数の現在の値をリアルタイムで表示します。
 * 2. 「次のトレース」「もう一度トレース」ボタンでトレースを操作します。
 * 3. 特定の問題では、トレース開始時の初期値をユーザーが選択できるボタンを表示します。
 * 
 * 元の basic_info_b_problem バージョンをベースに共通化したものです。
 */

// --- React / Next.js のコア機能 ---
import React from 'react';

// --- 型定義 ---
import type { SerializableProblem } from '@/lib/data';

// 共通化のためにローカルで型定義 (元は ../data/problems からインポートしていた)
export interface QueueItem {
    value: string;
    prio: number;
}

export type VariablesState = Record<string, any>;

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
    onPrevTrace?: () => void; // Optional for simple variants
    canGoBack?: boolean;      // Optional
    currentTraceLine: number;
    language: 'ja' | 'en';
    textResources: any;
    // 以下、機能切り替え用のOptional Props
    onSetNum?: (num: number) => void;
    onSetData?: (data: Record<string, any>, label: string) => void;
    isPresetSelected?: boolean;
    selectedLogicVariant?: string | null;
    onSetLogicVariant?: (variant: string) => void;
    selectedPresetLabel?: string | null;
}

/**
 * 変数表示とトレース操作エリアのメインコンポーネント (共通版)
 * 
 * 指定された変数状態 (`variables`) を表示し、トレースバック/フォワードの操作ボタンを提供します。
 * 問題の種類に応じて、プリセットデータ選択やロジック選択などの追加UIも表示します。
 */
const VariableTraceControl: React.FC<VariableTraceControlProps> = ({
    problem,
    variables,
    onNextTrace,
    onPrevTrace,
    isTraceFinished,
    canGoBack = false, // Default false
    onResetTrace,
    currentTraceLine,
    language,
    textResources: t,
    onSetNum,
    onSetData,
    isPresetSelected = false,
    selectedLogicVariant = null,
    onSetLogicVariant,
    selectedPresetLabel = null,
}) => {

    const showPresets = problem.traceOptions?.presets;
    const showArrayPresets = problem.traceOptions?.presets_array;
    const showLogicVariants = problem.traceOptions?.logicVariants;

    // プリセットが選択されたかを判定するフラグ
    // variables?.num が存在しない場合もあるのでチェック
    const isNumSet = variables && variables.num !== null && variables.num !== undefined;

    // listData が存在するかどうかで判定するように
    const isDataSet = variables && (variables.listData !== null && variables.listData !== undefined ||
        variables.data !== null && variables.data !== undefined && (
            (variables.target !== null && variables.target !== undefined) ||
            (variables.qVal !== null && variables.qVal !== undefined) ||
            (variables.c1 !== null && variables.c1 !== undefined) ||
            (variables.edgeList !== null && variables.edgeList !== undefined)
        ));

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
    // onPrevTraceがない場合は常にDisabled扱い（あるいはボタン自体非表示）
    const isPrevButtonDisabled = !onPrevTrace || !canGoBack || !isReadyToTrace;

    // ステップ番号を動的に計算
    let stepCounter = 1;
    const logicStepNum = showLogicVariants ? stepCounter++ : null;
    const dataStepNum = (showPresets || showArrayPresets) ? stepCounter++ : null;
    const varStepNum = dataStepNum ? dataStepNum : stepCounter++; // データ選択があればその後、なければ1番目(あるいはロジックの次)
    // 修正: varStepNumの計算ロジックを整理
    // ステップ1: ロジック選択 (あれば) -> Counter++
    // ステップ2: データ選択 (あれば) -> Counter++
    // ステップ3: 変数表示 -> Counter++
    // ステップ4: トレース実行 -> Counter++
    // 上記の実装だと varStepNum = dataStepNum ? dataStepNum : stepCounter++ 
    // dataStepNumがある(例:2) -> varStepNum = 2 ? これは重複するのでは？
    // 元のコードを再確認すると: 
    // const dataStepNum = (showPresets || showArrayPresets) ? stepCounter++ : null;
    // const varStepNum = dataStepNum ? dataStepNum : stepCounter++; 
    // これだと dataStepNum がある場合、 varStepNum も同じ値になるバグに見えますが、
    // UI上は「1. データ選択」「2. 変数状態」としたいはず。

    // ロジックを再構築します
    let currentStep = 1;
    const stepLogic = showLogicVariants ? currentStep++ : null;
    const stepData = (showPresets || showArrayPresets) ? currentStep++ : null;
    const stepVars = currentStep++;
    const stepTrace = currentStep++;


    return (
        <div className="p-4 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{t.variableSectionTitle}</h3>

            {/* ロジック選択ボタン */}
            {showLogicVariants && onSetLogicVariant && (
                <div className="w-full bg-gray-100 p-4 rounded-lg mb-6">
                    <p className="text-center font-semibold mb-3 text-gray-700">{stepLogic}. トレースするロジックを選択</p>
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

            {/* プリセット選択 */}
            {(showPresets || showArrayPresets) && (
                <div className="w-full bg-gray-100 p-4 rounded-lg mb-6">
                    <p className="text-center font-semibold mb-3 text-gray-700">
                        {stepData}. {showPresets ? '`num` の値を選択' : '入力データを選択してトレース'}
                    </p>

                    {/* (配列プリセットのボタン) */}
                    {showArrayPresets && onSetData && (
                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                            {(showArrayPresets as { label: string, value: any }[]).map((preset) => {
                                const isActive = selectedPresetLabel === preset.label;

                                return (
                                    <button
                                        key={preset.label}
                                        onClick={() => onSetData(preset.value, preset.label)}
                                        className={`px-3 py-2 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105 ${isActive
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
                    {showPresets && onSetNum && (
                        <div className="flex gap-3 justify-center">
                            {showPresets.map((num) => (
                                <button
                                    key={num}
                                    onClick={() => onSetNum(num)}
                                    className={`flex-1 px-4 py-2 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105
                    ${String(variables.num) === String(num)
                                            ? 'bg-emerald-500 ring-2 ring-emerald-300'
                                            : 'bg-indigo-500 hover:bg-indigo-600'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- 変数表示エリア --- */}
            <div className="w-full mb-6">
                <p className="text-center font-semibold mb-3 text-gray-700">{stepVars}. 変数の状態</p>
                <div className="grid grid-cols-1 gap-2 w-full px-5">
                    {Object.entries(variables || {})
                        .sort(([keyA], [keyB]) => {
                            const order = problem.initialVariables ? Object.keys(problem.initialVariables) : [];
                            const indexA = order.indexOf(keyA);
                            const indexB = order.indexOf(keyB);

                            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                            if (indexA !== -1) return -1;
                            if (indexB !== -1) return 1;
                            return 0;
                        })
                        .flatMap(([name, value]) => {
                            const items: [string, any][] = [[name, value]];

                            if (name === 'prev' && variables.listData && typeof value === 'number') {
                                const prevNode = variables.listData[value];
                                if (prevNode) {
                                    items.push(['prev.next', prevNode.next]);
                                }
                            }
                            return items;
                        })
                        .map(([name, value]) => {
                            if ([
                                'initialized',
                                'problemId',
                                'currentLine',
                                '_variant',
                                'p_values',
                                'current_p',
                                'isReturning',
                                '_calc_i'
                            ].includes(name)) return null;

                            let displayValue: string;

                            if (['prev', 'curr', 'listHead', 'prev.next'].includes(name) && variables.listData) {
                                if (value === null) {
                                    displayValue = 'null';
                                } else if (typeof value === 'number') {
                                    const node = variables.listData[value];
                                    if (node) {
                                        const nextStr = node.next === null ? 'null' : node.next;
                                        displayValue = `{ data: "${node.val}", next: ${nextStr} }`;
                                    } else {
                                        displayValue = String(value);
                                    }
                                } else {
                                    displayValue = String(value);
                                }
                            }
                            else if (value === null || typeof value === 'undefined') {
                                displayValue = '―';
                            } else if (Array.isArray(value)) {
                                if (value.length === 0) {
                                    displayValue = '[]';
                                }
                                // QueueItem型チェックの代わりに、オブジェクト構造でチェック
                                else if (name === 'queue' && typeof value[0] === 'object' && value[0] !== null && 'value' in value[0] && 'prio' in value[0]) {
                                    const queueItems = value as QueueItem[];
                                    displayValue = `[${queueItems.map(item => `"${item.value}"(${item.prio})`).join(', ')}]`;
                                }
                                else if (name === 'listData' && typeof value[0] === 'object' && value[0] !== null) {
                                    const listItems = value as { val: string, next: number | null }[];
                                    displayValue = `[${listItems.map((item, idx) => `(idx:${idx}, val:${item.val}, next:${item.next === null ? 'null' : item.next})`).join(', ')}]`;
                                }
                                else if (name === 'callStack' && Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                                    const stackFrames = value as any[];
                                    displayValue = `[${stackFrames.map(f => {
                                        if ('func' in f && 'returnTo' in f) {
                                            const returnLineDisplay = f.returnTo === 99 ? 'End' : `L${f.returnTo + 1}`;
                                            return `${f.func}(ret: ${returnLineDisplay})`;
                                        }
                                        if ('n' in f && 'pc' in f) {
                                            return `order(${f.n}, pc:${f.pc})`;
                                        }
                                        return JSON.stringify(f);
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

            {/* --- トレース操作ボタン --- */}
            <div className="w-full">
                <p className="text-center font-semibold mb-3 text-gray-700">{stepTrace}. トレース実行</p>

                {/* ボタンレイアウト (3つボタン or 2つボタン) */}
                {/* onPrevTraceがある場合は3カラム、なければ2カラム(あるいはflex)で表示制御 */}
                <div className={`grid ${onPrevTrace ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>

                    {/* 1. リセットボタン */}
                    <button
                        onClick={onResetTrace}
                        className="py-3 text-sm sm:text-base font-semibold rounded-lg shadow-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                        {t.resetTraceButton}
                    </button>

                    {/* 2. 前へボタン (Optional) */}
                    {onPrevTrace && (
                        <button
                            onClick={onPrevTrace}
                            disabled={isPrevButtonDisabled}
                            className={`py-3 text-sm sm:text-base font-semibold text-white rounded-lg shadow-sm transition-colors
                ${isPrevButtonDisabled
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-600'
                                }`}
                        >
                            {t.prevTraceButton}
                        </button>
                    )}

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
