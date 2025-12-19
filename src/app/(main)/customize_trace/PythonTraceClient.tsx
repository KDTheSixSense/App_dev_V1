'use client';

import dynamic from 'next/dynamic';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { recordStudyTimeAction, updateLoginStreakAction } from '@/lib/actions';
import { generatePythonCodeFromAI, runPythonTraceAction } from '@/lib/actions/traceActions';
const AceEditorWrapper = dynamic(() => import('@/components/AceEditorWrapper'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">エディタを読み込み中...</div>
});
import toast from 'react-hot-toast';
import { lintCode, Annotation } from '@/lib/lint';

// --- 型定義 ---
interface TraceStepData {
    line: number;
    variables: Record<string, any>;
    stdout: string;
    error?: string;
    event?: string;
}

const sampleCode = `counter = 3

while counter > 0:
    print(counter)
    counter = counter - 1

print("ループが終了しました")
`;

// ★追加: 表示から除外するシステム変数のリスト
// ★追加: 表示から除外するシステム変数のリスト
const IGNORED_VARS = new Set([
    '__name__',
    '__doc__',
    '__package__',
    '__loader__',
    '__spec__',
    '__annotations__',
    '__builtins__',
    'credits',
    'license',
    'help'
]);

// --- 定数定義 ---
const THEME_OPTIONS = [
    { value: 'github', label: 'GitHub (Light)' },
    { value: 'tomorrow_night', label: 'Tomorrow Night (Dark)' },
    { value: 'monokai', label: 'Monokai (Dark)' },
    { value: 'dracula', label: 'Dracula (Dark)' },
    { value: 'solarized_light', label: 'Solarized Light' },
    { value: 'chrome', label: 'Chrome (Light)' },
    { value: 'nord_dark', label: 'Nord (Dark)' },
    { value: 'xcode', label: 'Xcode (Light)' },
    { value: 'textmate', label: 'TextMate (Light)' },
    { value: 'terminal', label: 'Terminal (Dark)' },
    { value: 'merbivore_soft', label: 'Merbivore Soft (Dark)' },
    { value: 'kuroir', label: 'Kuroir (Light)' },
];

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const PythonTraceClient = () => {


    const [code, setCode] = useState(sampleCode);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('1から10までの合計を計算する');

    const [isTraceStarted, setIsTraceStarted] = useState(false);
    const [traceSteps, setTraceSteps] = useState<TraceStepData[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const [error, setError] = useState<string | null>(null);

    const [currentLine, setCurrentLine] = useState(-1);
    const [variables, setVariables] = useState<Record<string, any>>({});
    const [output, setOutput] = useState<string>("");

    // Customization State
    const [editorTheme, setEditorTheme] = useState('github');
    const [arrowColor, setArrowColor] = useState('#ff0000');
    const [highlightColor, setHighlightColor] = useState('#ff0000');

    const [traceStartedAt, setTraceStartedAt] = useState<number | null>(null);
    const hasRecordedTime = useRef(false);
    const [lintAnnotations, setLintAnnotations] = useState<Annotation[]>([]);
    const lintTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Editor instance ref
    const editorRef = useRef<any>(null);
    // Track previous line to remove decoration
    const prevLineRef = useRef<number>(-1);

    const handleEditorLoad = (editor: any) => {
        editorRef.current = editor;
    };

    // Update gutter decorations when currentLine changes
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || !editor.session) return;

        // Remove from previous line
        if (prevLineRef.current >= 0) {
            editor.session.removeGutterDecoration(prevLineRef.current - 1, 'ace_execution_gutter');
        }

        // Add to new line
        if (currentLine > 0) {
            editor.session.addGutterDecoration(currentLine - 1, 'ace_execution_gutter');
            prevLineRef.current = currentLine;
        } else {
            prevLineRef.current = -1;
        }
    }, [currentLine]);

    // エディタへの入力があるたびに呼ばれます
    const handleCodeChange = (newCode: string) => {
        setCode(newCode);

        // 以前のタイマーがあればキャンセル（連打対策）
        if (lintTimerRef.current) {
            clearTimeout(lintTimerRef.current);
        }

        // 入力が止まってから 800ms 後にAPIを実行
        lintTimerRef.current = setTimeout(async () => {
            // コードが空ならエラーもクリア
            if (!newCode.trim()) {
                setLintAnnotations([]);
                return;
            }

            // APIを呼び出してPythonの構文チェック
            const annotations = await lintCode(newCode, 'python');
            setLintAnnotations(annotations);
        }, 800);
    };

    // 最後まで一気にスキップする関数
    const handleJumpToEnd = () => {
        if (traceSteps.length > 0) {
            const lastIndex = traceSteps.length - 1;
            setCurrentStepIndex(lastIndex);
            updateDisplay(traceSteps[lastIndex]);

            // 完了通知と時間記録
            toast.success('トレースが完了しました');
            recordStudyTime();
            updateLoginStreakAction(); // ログイン日数を更新
        }
    };

    const recordStudyTime = useCallback(() => {
        if (traceStartedAt !== null && !hasRecordedTime.current) {
            const endTime = Date.now();
            const timeSpentMs = endTime - traceStartedAt;
            if (timeSpentMs > 3000) {
                recordStudyTimeAction(timeSpentMs);
                hasRecordedTime.current = true;
            }
        }
    }, [traceStartedAt]);

    useEffect(() => {
        return () => { recordStudyTime(); };
    }, [recordStudyTime]);

    const handleGenerateCode = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        setError(null);
        try {
            const generatedText = await generatePythonCodeFromAI(aiPrompt);
            setCode(generatedText);
        } catch (error: any) {
            setError(`AIコード生成エラー: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStartTrace = async () => {
        try {
            setError(null);
            // 前回のセッションの時間を記録
            recordStudyTime();
            setIsTraceStarted(true);

            const steps = await runPythonTraceAction(code) as TraceStepData[];

            if (!steps || steps.length === 0) {
                throw new Error("トレース結果が取得できませんでした。");
            }

            setTraceSteps(steps);
            setCurrentStepIndex(0);
            updateDisplay(steps[0]);

            setTraceStartedAt(Date.now());
            hasRecordedTime.current = false;

        } catch (e: any) {
            setError(`実行エラー: ${e.message}`);
            setIsTraceStarted(false);
        }
    };

    const updateDisplay = (step: TraceStepData) => {
        setCurrentLine(step.line);
        setVariables(step.variables || {});
        setOutput(step.stdout || "");

        if (step.error) {
            setError(`Runtime Error: ${step.error}`);
        }
    };

    const handleNextStep = () => {
        if (currentStepIndex < traceSteps.length - 1) {
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            updateDisplay(traceSteps[nextIndex]);

            if (nextIndex === traceSteps.length - 1) {
                toast.success('トレースが完了しました');
                recordStudyTime();
                updateLoginStreakAction(); // ログイン日数を更新
            }
        }
    };

    const handlePrevStep = () => {
        if (currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1;
            setCurrentStepIndex(prevIndex);
            updateDisplay(traceSteps[prevIndex]);
        }
    };

    const handleReset = () => {
        recordStudyTime();
        setIsTraceStarted(false);
        setTraceSteps([]);
        setCurrentStepIndex(0);
        setCurrentLine(-1);
        setVariables({});
        setOutput("");
        setError(null);
    };

    const isTraceFinished = traceSteps.length > 0 && currentStepIndex >= traceSteps.length - 1;

    // ★追加: 変数フィルタリング関数
    const getVisibleVariables = (vars: Record<string, any>) => {
        return Object.entries(vars).filter(([key, val]) => {
            // 無視リストに含まれるキーは除外
            if (IGNORED_VARS.has(key)) return false;
            // 必要であれば、関数やモジュールオブジェクトなどもここで除外可能
            return true;
        });
    };

    // 表示用にフィルタリングされた変数リストを取得
    const visibleVariables = getVisibleVariables(variables);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* --- スタイル定義 --- */}
            <style jsx global>{`
                .ace_execution_line {
                    position: absolute;
                    background-color: ${hexToRgba(highlightColor, 0.5)} !important; /* Customizable, Darker opacity */
                    border-bottom: 1px solid ${hexToRgba(highlightColor, 0.8)};
                    z-index: 20;
                }
                /* Remove arrow from content marker */
                
                /* Gutter Decoration */
                .ace_execution_gutter {
                    position: relative;
                }
                .ace_execution_gutter::before {
                    content: "ー▶";
                    position: absolute;
                    left: 2px;
                    color: ${arrowColor}; /* Customizable */
                    font-weight: bold;
                    font-size: 12px;
                    line-height: 1;
                    top: 4px; /* Adjust vertically */
                    z-index: 999;
                }
                .ace_active-line {
                    background: transparent !important;
                }
            `}</style>

            {/* 左パネル */}
            <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col">
                <div className="mb-6">
                    <label className="block text-lg font-semibold mb-2 text-gray-700">
                        コハクがPythonコードを生成
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="flex-grow p-3 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500"
                            placeholder="例: フィボナッチ数列を計算する"
                            disabled={isGenerating || isTraceStarted}
                        />
                        <button
                            onClick={handleGenerateCode}
                            disabled={isGenerating || isTraceStarted}
                            className="py-3 px-5 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition"
                        >
                            {isGenerating ? '生成中...' : '生成'}
                        </button>
                    </div>
                </div>

                {/* 設定エリア */}
                <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">表示設定</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <span className="text-xs text-gray-500 block mb-1">テーマ</span>
                            <select
                                value={editorTheme}
                                onChange={(e) => setEditorTheme(e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                            >
                                {THEME_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block mb-1">矢印の色</span>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={arrowColor}
                                    onChange={(e) => setArrowColor(e.target.value)}
                                    className="h-9 w-full p-0 border rounded cursor-pointer"
                                    title="色を自由に選択"
                                />
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block mb-1">ハイライト色</span>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={highlightColor}
                                    onChange={(e) => setHighlightColor(e.target.value)}
                                    className="h-9 w-full p-0 border rounded cursor-pointer"
                                    title="色を自由に選択"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-grow mb-4 relative">
                    <label className="block text-lg font-semibold mb-2 text-gray-700">Pythonコード</label>
                    <div className="border rounded-md overflow-hidden" style={{ height: '500px' }}>
                        <AceEditorWrapper
                            mode="python"
                            theme={editorTheme}
                            name="python-trace-editor"
                            value={code}
                            onChange={handleCodeChange}
                            fontSize={14}
                            width="100%"
                            height="100%"
                            readOnly={isTraceStarted}
                            annotations={lintAnnotations}
                            setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: true,
                                showLineNumbers: true,
                                showPrintMargin: false, // Turn off the vertical line
                                tabSize: 4,
                            }}
                            onLoad={handleEditorLoad}
                            markers={isTraceStarted && currentLine > 0 ? [{
                                startRow: currentLine - 1,
                                startCol: 0,
                                endRow: currentLine - 1,
                                endCol: 100,
                                className: 'ace_execution_line',
                                type: 'text'
                            }] : []}
                        />
                    </div>
                </div>

                <div className="flex space-x-4 mt-auto">
                    <button
                        onClick={handleStartTrace}
                        disabled={isTraceStarted || !code.trim()}
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        トレース開始
                    </button>
                    <button onClick={handleReset} className="flex-1 py-3 bg-gray-600 text-white font-bold rounded-md hover:bg-gray-700">
                        リセット
                    </button>
                </div>
            </div>

            {/* 右パネル */}
            <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col h-full">
                <div className="flex space-x-2 mb-6">
                    <button onClick={handlePrevStep} disabled={!isTraceStarted || currentStepIndex === 0} className="flex-1 py-3 bg-yellow-500 text-white font-bold rounded-md hover:bg-yellow-600 disabled:bg-gray-300">
                        前のトレース
                    </button>
                    <button onClick={handleNextStep} disabled={!isTraceStarted || isTraceFinished} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-300">
                        次のトレース
                    </button>
                    <button onClick={handleJumpToEnd} disabled={!isTraceStarted || isTraceFinished} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-300">
                        トレース結果
                    </button>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{error}</div>}

                <div className="flex-1 min-h-0 flex flex-col mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">変数</h3>
                    {/* flex-grow: 親のflex-1に合わせて伸びる */}
                    {/* maxHeightの制限を削除し、エリア全体を使ってスクロール可能にする */}
                    <div className="flex-grow p-4 bg-gray-50 border rounded-md overflow-y-auto overflow-x-hidden">
                        {visibleVariables.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {visibleVariables.map(([key, val]) => (
                                    <div key={key} className="flex flex-col sm:flex-row sm:items-center text-sm border-b pb-1 last:border-0">
                                        <span className="font-semibold mr-2 w-32 truncate text-gray-700">{key}:</span>
                                        <span className="font-mono text-blue-700 break-all">
                                            {JSON.stringify(val)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">変数はまだありません。</p>
                        )}
                    </div>
                </div>

                {/* --- 出力エリア (サブ: 高さを固定して小さくする) --- */}
                <div className="flex-none flex flex-col">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">出力</h3>
                    {/* 高さを150pxに固定 */}
                    <div className="p-4 bg-gray-900 text-green-400 font-mono text-sm border rounded-md overflow-auto whitespace-pre-wrap break-all" style={{ height: '150px' }}>
                        {output ? output : <span className="text-gray-500">まだ出力はありません。</span>}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default PythonTraceClient;