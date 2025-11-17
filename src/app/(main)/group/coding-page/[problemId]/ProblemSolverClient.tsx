//app/(main)/group/coding-page/[problemId]/ProblemSolverClient.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback,memo } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Send, CheckCircle, ChevronDown, Sparkles, FileText, Code, GripVertical } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import dynamic from 'next/dynamic';
import Image from 'next/image';

import type { Problem as SerializableProblem } from '@/lib/types';
import { recordStudyTimeAction } from '@/lib/actions';

// Header.tsx からヘルパー関数と定数をコピー
const MAX_HUNGER = 200; // 満腹度の最大値

const getPetDisplayState = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return {
      icon: '/images/Kohaku/kohaku-full.png',
      colorClass: 'bg-gradient-to-r from-green-400 to-lime-500',
    };
  } else if (hungerLevel >= 100) {
    return {
      icon: '/images/Kohaku/kohaku-normal.png',
      colorClass: 'bg-gradient-to-r from-sky-400 to-cyan-500',
    };
  } else if (hungerLevel >= 50) {
    return {
      icon: '/images/Kohaku/kohaku-hungry.png',
      colorClass: 'bg-gradient-to-r from-amber-400 to-orange-500',
    };
  } else {
    return {
      icon: '/images/Kohaku/kohaku-starving.png',
      colorClass: 'bg-gradient-to-r from-red-500 to-rose-600',
    };
  }
};

const DynamicAceEditor = dynamic(
  () => import('@/components/AceEditorWrapper'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        border: '1px solid #e0e0e0',
        color: '#666',
        fontSize: '14px',
      }}>
        エディタを読み込んでいます...
      </div>
    )
  }
);

type ChatMessage = { sender: 'user' | 'kohaku'; text: string };
type ActiveTab = 'input' | 'output' | 'kohaku';

type SubmitResult = {
    success: boolean;
    message: string;
    yourOutput?: string;
    expected?: string;
};

// Aceのエラー/警告表示用のアノテーション型
type AceAnnotation = {
    row: number;
    column: number;
    text: string;
    type: 'error' | 'warning' | 'info';
};

interface ProblemSolverClientProps {
    problem: SerializableProblem;
    assignmentInfo: { assignmentId: string | null; hashedId: string | null; };
}

// テキストリソースを定義
const textResources = {
    ja: {
        problemStatement: {
            nextProblemButton: '次の問題へ'
        }
    }
};

const CustomAlertModal: React.FC<{
    message: string;
    onClose: () => void;
    actionButton?: {
        text: string;
        onClick: () => void;
    };
}> = ({ message, onClose, actionButton }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <p className="text-lg text-gray-800 mb-6">{message}</p>
            <div className="flex flex-col gap-2">
                {actionButton && <button onClick={actionButton.onClick} className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">{actionButton.text}</button>}
                <button onClick={onClose} className={`w-full py-2 px-4 rounded-md transition-colors ${actionButton ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>閉じる</button>
            </div>
        </div>
    </div>
);

const ProblemDescriptionPanel: React.FC<{ problem: SerializableProblem }> = ({ problem }) => {
    // titleとdescriptionがオブジェクト形式か文字列形式かを判定して内容を取得
    const titleText = typeof problem.title === 'object' ? problem.title.ja : problem.title;
    const descriptionText = typeof problem.description === 'object' ? problem.description?.ja : problem.description;

    return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
        <div className="p-4 border-b flex-shrink-0"><h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><FileText className="h-6 w-6 text-blue-500" /><span>問{problem.id}: {titleText}</span></h2></div>
        <div className="p-6 space-y-6 overflow-y-auto">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: (descriptionText ?? '説明がありません。').replace(/\n/g, '<br />') }} />
            <div>
                <h3 className="font-semibold mb-3 text-gray-900 border-b pb-2">サンプルケース</h3>
                {problem.sampleCases?.map((sc, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                        <h4 className="font-medium text-sm mb-2 text-gray-800">サンプル {index + 1}</h4>
                        {sc.description && <p className="text-xs text-gray-600 mb-2 pl-2 border-l-2 border-gray-300">{sc.description}</p>}
                        <div className="space-y-2">
                            <div><span className="text-xs font-semibold text-gray-600">入力:</span><pre className="bg-gray-100 p-3 rounded-md text-sm font-mono text-gray-900 mt-1">{sc.input}</pre></div>
                            <div><span className="text-xs font-semibold text-gray-600">期待する出力:</span><pre className="bg-gray-100 p-3 rounded-md text-sm font-mono text-gray-900 mt-1">{sc.expectedOutput}</pre></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
    );
};

// 既存の CodeEditorPanel をこれで置き換える
const CodeEditorPanel: React.FC<{
    userCode: string; setUserCode: (code: string) => void;
    stdin: string; setStdin: (stdin: string) => void;
    selectedLanguage: string; languages: { value: string; label: string }[]; onLanguageSelect: (lang: string) => void;
    selectedTheme: string; themes: { value: string; label: string }[]; onThemeSelect: (theme: string) => void;
    onExecute: () => void; onSubmit: () => void; isSubmitting: boolean;
    executionResult: string; submitResult: SubmitResult | null;
    annotations: AceAnnotation[]; // annotations prop を追加
}> = React.memo((props) => { // React.memoでラップ
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('input');
    const [showThemeDropdown, setShowThemeDropdown] = useState(false);

    // Ace Editor用の言語モード名を取得するヘルパー関数
    const getAceMode = (langValue: string) => {
        const mapping: { [key: string]: string } = {
            'python': 'python',
            'javascript': 'javascript',
            'typescript': 'typescript',
            'java': 'java',
            'c': 'c_cpp',
            'cpp': 'c_cpp',
            'csharp': 'csharp',
            'php': 'php',
        };
        return mapping[langValue] || 'javascript'; // デフォルト
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            {/* --- ヘッダー（言語選択） --- */}
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Code className="h-5 w-5 text-gray-600" />コード入力</h2>
                {/* テーマ選択と言語選択を並べる */}
                <div className="flex gap-4">
                    {/* --- テーマ選択プルダウン --- */}
                    <div className="relative">
                        <button onClick={() => setShowThemeDropdown(!showThemeDropdown)} className="flex items-center justify-between w-40 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            <span>{props.themes.find(t => t.value === props.selectedTheme)?.label}</span><ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        {showThemeDropdown && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-20">
                                {props.themes.map((theme) => (
                                    <button 
                                        key={theme.value} 
                                        onClick={() => { 
                                            props.onThemeSelect(theme.value); 
                                            setShowThemeDropdown(false); 
                                        }} 
                                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                                    >
                                        {theme.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* --- 言語選択プルダウン（既存） --- */}
                    <div className="relative">
                        <button onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className="flex items-center justify-between w-40 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            <span>{props.languages.find(l => l.value === props.selectedLanguage)?.label}</span><ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        {showLanguageDropdown && (<div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-20">{props.languages.map((lang) => (<button key={lang.value} onClick={() => { props.onLanguageSelect(lang.value); setShowLanguageDropdown(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100">{lang.label}</button>))}</div>)}
                    </div>
                </div>
            </div>

            {/* --- AceEditor --- */}
            <div className="flex-grow flex min-h-0 relative">
                <DynamicAceEditor
                    mode={getAceMode(props.selectedLanguage)}
                    theme={props.selectedTheme} // テーマ
                    value={props.userCode}
                    onChange={props.setUserCode}
                    name="CODE_EDITOR_GROUP" // ページごとにユニークなID
                    editorProps={{ $blockScrolling: true }}
                    width="100%"
                    height="100%"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    fontSize={14}
                    annotations={props.annotations} // 静的エラーチェックの結果を渡す
                    setOptions={{
                        showLineNumbers: true,
                        showGutter: true,
                        enableBasicAutocompletion: true, // 基本的な自動補完
                        enableLiveAutocompletion: true, // ライブ自動補完
                        enableSnippets: true, // スニペット
                        useWorker: false, // 標準ワーカーは無効化 (カスタムlintのため)
                        highlightActiveLine: true,
                        showPrintMargin: false, // 印刷マージン非表示
                    }}
                />
                </div>
        </div>
    );
});
CodeEditorPanel.displayName = 'CodeEditorPanel';

// 下部パネル: 実行/提出/入出力/コハク
const ExecutionPanel: React.FC<{
    stdin: string; setStdin: (stdin: string) => void;
    onExecute: () => void; onSubmit: () => void; isSubmitting: boolean;
    executionResult: string; submitResult: SubmitResult | null;
    onNextProblem: () => void;
    chatMessages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isAiLoading: boolean;
    kohakuIcon: string; // アイコンパスを受け取るプロパティを追加
    assignmentInfo: { assignmentId: string | null; hashedId: string | null; };
    t: { nextProblemButton: string; };
}> = memo((props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('input');

    return (
        // パネル全体をflex-colにし、h-fullで親のPanelに追従させます
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            {/* --- ボタンとタブのエリア (縮まない) --- */}
            <div className="p-4 border-t flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex border border-gray-300 rounded-md p-0.5">
                        <button onClick={() => setActiveTab('input')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'input' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>標準入力</button>
                        <button onClick={() => setActiveTab('output')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'output' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>実行結果</button>
                        <button onClick={() => setActiveTab('kohaku')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'kohaku' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>コハク</button>
                    </div>
                    <div className="flex gap-2">
                        {props.submitResult?.success && ( 
                            <div className="flex-shrink-0 pt-4 flex justify-center">
                                {/* 修正2: handleNextProblem -> props.onNextProblem */}
                                <button onClick={props.onNextProblem} className="w-full max-w-lg py-3 px-6 text-lg font-semibold text-white bg-green-500 rounded-lg shadow-lg hover:bg-green-600">
                                    {/* 修正3: assignmentInfo -> props.assignmentInfo, t -> props.t */}
                                    {props.assignmentInfo.hashedId ? '課題一覧へ戻る' : props.t.nextProblemButton}
                                </button>
                            </div>
                        )}
                        <button onClick={props.onExecute} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"><Play className="h-4 w-4" /> 実行</button>
                        <button onClick={props.onSubmit} disabled={props.isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"><Send className="h-4 w-4" /> {props.isSubmitting ? '提出中...' : '提出'}</button>
                    </div>
                </div>
            </div>
            
            {/* --- タブのコンテンツエリア (残りの領域すべてを埋める) --- */}
            {/* flex-grow と min-h-0 を設定し、親パネルのサイズ変更に追従させます */}
            <div className="flex-grow min-h-0 overflow-y-auto border rounded-md p-2 m-4 mt-0">
                {activeTab === 'input' && (
                    <textarea 
                        value={props.stdin} 
                        onChange={(e) => props.setStdin(e.target.value)} 
                        className="w-full h-full p-1 text-sm font-mono border-0 rounded-md resize-none focus:outline-none" 
                        placeholder="コードへの入力値..."
                    />
                )}
                {activeTab === 'output' && (
                    // 実行結果がはみ出た場合はこのdivがスクロールします
                    <div className="h-full overflow-y-auto">
                        {props.executionResult && (<div className="bg-gray-800 text-white p-3 rounded-md font-mono text-xs"><div className="text-gray-400 mb-1">実行結果:</div><pre className="whitespace-pre-wrap">{props.executionResult}</pre></div>)}
                        {props.submitResult && (<div className={`border p-4 rounded-md mt-2 ${props.submitResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center gap-2 mb-2"><CheckCircle className={`h-5 w-5 ${props.submitResult.success ? 'text-green-600' : 'text-red-600'}`} /><h4 className={`font-semibold ${props.submitResult.success ? 'text-green-800' : 'text-red-800'}`}>{props.submitResult.success ? '正解' : '不正解'}</h4></div><p className="text-sm">{props.submitResult.message}</p>{!props.submitResult.success && props.submitResult.yourOutput !== undefined && (<><p className="text-sm mt-2 font-semibold">あなたの出力:</p><pre className="bg-white p-2 mt-1 rounded text-xs text-red-700">{props.submitResult.yourOutput || '(空の出力)'}</pre><p className="text-sm mt-2 font-semibold">期待する出力:</p><pre className="bg-white p-2 mt-1 rounded text-xs text-green-700">{props.submitResult.expected}</pre></>)}</div>)}
                    </div>
                )}
                {activeTab === 'kohaku' && (
                    // AiChatPanel は既に h-full のコンポーネントなので、そのまま配置します
                    <AiChatPanel 
                        messages={props.chatMessages} 
                        onSendMessage={props.onSendMessage} 
                        isLoading={props.isAiLoading}
                        kohakuIcon={props.kohakuIcon}
                    />
                )}
            </div>
        </div>
    );
});

CodeEditorPanel.displayName = 'CodeEditorPanel';

// AiChatPanel の定義
const AiChatPanel: React.FC<{ 
    messages: ChatMessage[]; 
    onSendMessage: (message: string) => void; 
    isLoading: boolean; 
    kohakuIcon: string; // アイコンパスを受け取るプロパティを追加
}> = ({ messages, onSendMessage, isLoading, kohakuIcon }) => { // kohakuIcon を受け取る
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    const handleSend = () => { if (input.trim() && !isLoading) { onSendMessage(input); setInput(''); } };
    return (
        // 枠線と背景を削除し、親の ExecutionPanel にレイアウトを合わせる
        <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b flex-shrink-0"><h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan-500" />コハクに質問</h3></div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'kohaku' && (
                            //「コハク」テキストを Image コンポーネントに置き換え
                            <Image 
                                src={kohakuIcon} // プロパティから受け取ったアイコンパスを使用
                                alt="コハク" 
                                width={128}
                                height={128} 
                                className="w-14 h-14 rounded-full flex-shrink-0 object-cover" 
                            />
                        )}
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-center text-gray-500 text-sm">コハクが考えています...</div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t flex-shrink-0">
                <div className="flex gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={isLoading ? "コハクが応答中です..." : "ヒントを求める..."} disabled={isLoading} className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:bg-gray-100" />
                    <button onClick={handleSend} disabled={isLoading} className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors disabled:bg-cyan-300 disabled:cursor-not-allowed"><Send className="h-5 w-5" /></button>
                </div>
            </div>
        </div>
    );
};

const ProblemSolverClient: React.FC<ProblemSolverClientProps> = ({ problem, assignmentInfo }) => {
    const router = useRouter();
    const t = textResources['ja'].problemStatement;

    // problemはpropsから直接受け取るので、useStateは不要
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('python');
    const [selectedTheme, setSelectedTheme] = useState('solarized_light');
    const [userCode, setUserCode] = useState('');
    const [stdin, setStdin] = useState('');
    const [executionResult, setExecutionResult] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [onCloseAction, setOnCloseAction] = useState<(() => void) | null>(null);
    const [alertAction, setAlertAction] = useState<{ text: string; onClick: () => void; } | undefined>(undefined);
    const [problemStartTime, setProblemStartTime] = useState<number>(Date.now());
    const hasRecordedTime = useRef(false);
    const [annotations, setAnnotations] = useState<AceAnnotation[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [kohakuIcon, setKohakuIcon] = useState('/images/Kohaku/kohaku-normal.png');

    const languages = [
        { value: 'python', label: 'Python' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'java', label: 'Java' },
        { value: 'c', label: 'C' },
        { value: 'cpp', label: 'C++' },
        { value: 'csharp', label: 'C#' },
        { value: 'php', label: 'PHP' }
    ];

    // 利用可能なテーマのリスト
    const themes = [
        // --- 黒系 (Dark) テーマ ---
        { value: 'tomorrow_night', label: 'Tomorrow Night' },
        { value: 'monokai', label: 'Monokai (Dark)' },
        { value: 'dracula', label: 'Dracula (Dark)' },          
        { value: 'nord_dark', label: 'Nord Dark (Dark)' },      
        { value: 'terminal', label: 'Terminal (Dark)' },
        { value: 'merbivore_soft', label: 'Merbivore Soft' },
        
        // --- 白系 (Light) テーマ ---
        { value: 'solarized_light', label: 'Solarized Light' },
        { value: 'chrome', label: 'Chrome (Light)' },
        { value: 'github', label: 'GitHub (Light)' },
        { value: 'xcode', label: 'Xcode (Light)' },             
        { value: 'textmate', label: 'TextMate (Light)' },       
        { value: 'kuroir', label: 'Kuroir (Light)' },
    ];

    // useCallback で関数をメモ化し、useEffect の依存配列で安全に使えるようにします
    const refetchPetStatus = useCallback(async () => {
        console.log("[Page.tsx] refetchPetStatus called.");
        try {
            // APIを叩いて最新のペット情報を取得
            const res = await fetch('/api/pet/status');
            if (res.ok) {
                const { data } = await res.json();
                if (data) {
                    // 取得した満腹度から表示状態を決定
                    const displayState = getPetDisplayState(data.hungerlevel);
                    // アイコンの状態を更新
                    setKohakuIcon(displayState.icon); 
                    console.log(`[Page.tsx] コハクのアイコンを ${displayState.icon} に更新しました。`);
                }
            } else {
                console.error("[Page.tsx] Failed to fetch pet status.");
            }
        } catch (error) {
            console.error("[Page.tsx] ペット情報の再取得に失敗:", error);
        }
    }, []); // この関数自体は変化しないので依存配列は空
        

    useEffect(() => {
        // 静的エラーチェック（リンティング）
        // problemがロードされるまで待つ
        if (!problem) return;

        // コードが空ならエラーをクリア
        if (!userCode.trim()) {
            setAnnotations([]);
            return;
        }

        // ユーザーのタイピングが終わるのを待つ（デバウンス）
        const handler = setTimeout(async () => {
            console.log(`[Lint] Running server-side lint for ${selectedLanguage}...`);
            try {
                const res = await fetch('/api/lint_code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: userCode, language: selectedLanguage })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.annotations) {
                        console.log("[Lint] Annotations received:", data.annotations);
                        setAnnotations(data.annotations); // 取得したアノテーションをセット
                    } else {
                        setAnnotations([]); // エラーがなくてもクリア
                    }
                } else {
                    setAnnotations([]); // API失敗時もクリア
                }
            } catch (error) {
                console.error("[Lint] API call failed:", error);
                setAnnotations([]);
            }
        }, 1000); // 1秒待ってから実行

        // ユーザーがタイピングを再開したら、前回のタイマーをキャンセル
        return () => {
            clearTimeout(handler);
        };
    }, [userCode, selectedLanguage, problem]); // コード、言語、または問題が変わるたびに実行

    // --- 4. 時間を記録する共通関数を追加 ---
    /**
     * 学習時間を計算し、サーバーに送信する (1回だけ実行)
     */
    const recordStudyTime = useCallback(() => {
        // まだ記録されておらず、開始時刻がセットされている場合のみ
        if (!hasRecordedTime.current && problemStartTime !== null) {
            const endTime = Date.now();
            const timeSpentMs = endTime - problemStartTime;

            // 3秒以上の滞在のみを記録
            if (timeSpentMs > 3000) {
                console.log(`Recording ${timeSpentMs}ms for group assignment problem ${problem.id}`);
                // サーバーアクション (0 XP, timeSpentMs) を呼び出す
                recordStudyTimeAction(timeSpentMs); 
                hasRecordedTime.current = true; // 記録済みフラグを立てる
            }
        }
    }, [problem.id, problemStartTime]);

    useEffect(() => {
        // problemが変更されたら（＝別の問題ページに遷移したら）状態をリセット
        setSubmitResult(null);
        setExecutionResult('');
        setStdin('');
        setUserCode(problem.programLines?.ja.join('\n') || '');
        setChatMessages([{ sender: 'kohaku', text: `問${problem.id}について、何かヒントは必要ですか？` }]);
        setProblemStartTime(Date.now()); // タイムスタンプを保存
        hasRecordedTime.current = false;   // 記録フラグをリセット
    }, [problem]);

    // --- 6. ページ離脱時の Effect を追加 ---
    useEffect(() => {
        // この Effect は problemStartTime が変わるたびに（＝新しい問題がロードされるたびに）
        // 再セットアップされます。
        return () => {
            // クリーンアップ関数（ページ離脱時）に時間を記録
            recordStudyTime();
        };
    }, [problemStartTime, recordStudyTime]); // problemStartTime が変わるたびにクリーンアップを再設定

    const handleExecute = async () => {
        if (!userCode.trim()) { setExecutionResult('コードを入力してください。'); return; }
        recordStudyTime();
        setExecutionResult('実行中...');
        try {
            const response = await fetch('/api/execute_code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: selectedLanguage, source_code: userCode, input: stdin }), });
            const data = await response.json();
            if (response.ok) { setExecutionResult(data.program_output?.stdout || data.program_output?.stderr || data.build_result?.stderr || '出力なし'); }
            else { setExecutionResult(`エラー: ${data.error || '不明なエラー'}`); }
        } catch (error) { console.error('Error executing code:', error); setExecutionResult('コードの実行中にエラーが発生しました。'); }
    };

    const handleSubmit = async () => {
        if (!userCode.trim()) { alert('コードを入力してから提出してください。'); return; }
        setIsSubmitting(true);
        recordStudyTime();
        setExecutionResult('提出中...');
        try {
            const response = await fetch('/api/execute_code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: selectedLanguage, source_code: userCode, input: problem?.sampleCases?.[0]?.input || '' }), });
            const data = await response.json();
            const output = (data.program_output?.stdout || '').trim();
            const expectedOutput = (problem?.sampleCases?.[0]?.expectedOutput || '').trim();
            setExecutionResult(''); // 提出処理が終わったので「提出中...」の表示をクリア
            if (expectedOutput === '') { setSubmitResult({ success: false, message: '問題に正解（期待する出力）が設定されていません。' }); return; }
            if (output === expectedOutput) {
                setSubmitResult({ success: true, message: '正解です！おめでとうございます！' });
                setIsAnswered(true);
                // 正解した場合、提出APIを呼び出す
                if (assignmentInfo.assignmentId) {
                    try {
                        await fetch('/api/submissions', { // エンドポイントを修正
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                assignmentId: Number(assignmentInfo.assignmentId),
                                description: userCode, // ユーザーのコードをdescriptionとして送信
                                status: '提出済み', // statusを明示的に指定
                            }),
                        });
                        // 提出成功のアラートメッセージを設定し、ポップアップを表示
                        setAlertMessage('課題を提出しました。');
                        setShowAlert(true);
                    } catch (submissionError) {
                        console.error('提出状況の更新に失敗しました:', submissionError);
                    }
                }
            }
            else { setSubmitResult({ success: false, message: '不正解です。出力が異なります。', yourOutput: output, expected: expectedOutput }); }
        } catch (error) { console.error('Error submitting code:', error); setSubmitResult({ success: false, message: '提出処理中にエラーが発生しました。' }); setExecutionResult(''); }
        finally { setIsSubmitting(false); }
    };

    const handleUserMessage = (message: string) => {
        setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
        setTimeout(() => {
            const kohakuResponse = "ごめんなさい、まだ質問には答えられません。";
            setChatMessages((prev) => [...prev, { sender: 'kohaku', text: kohakuResponse }]);
        }, 1000);
    };

    const handleNextProblem = async () => {
        try {
          // 課題から遷移してきた場合は、課題詳細ページに戻る
          if (assignmentInfo.hashedId && assignmentInfo.assignmentId) {
            recordStudyTime();
            router.push(`/group/${assignmentInfo.hashedId}/member`);
            return;
          }
    
          const res = await fetch(`/group/select-page/${problem.id}`);
          const data = await res.json();
          if (data.nextProblemId) { // 修正: 正しいパスへ遷移
            recordStudyTime();
            router.push(`/group/select-page/${data.nextProblemId}`);
          } else {
            setAlertMessage("最後の問題です！お疲れ様でした。");
            setShowAlert(true);
          }
        } catch (error) {
          console.error("次の問題の取得に失敗しました:", error);
          alert("次の問題の取得に失敗しました。");
        }
      };

    return (
            <div className="h-screen bg-gray-100 p-4 overflow-hidden">
                {showAlert && <CustomAlertModal message={alertMessage} onClose={() => setShowAlert(false)} />}
                
                {/* 既存の水平パネルグループ */}
                <PanelGroup direction="horizontal">
                    
                    {/* 左パネル: 問題文 (変更なし) */}
                    <Panel defaultSize={35} minSize={20}>
                        <ProblemDescriptionPanel problem={problem} />
                    </Panel>
                    
                    <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-300 transition-colors flex items-center justify-center">
                        <GripVertical className="h-4 w-4 text-gray-600" />
                    </PanelResizeHandle>
                    
                    {/* 右パネル: ここにエディタと実行パネルを縦に並べる (ここからが変更点) */}
                    <Panel minSize={30}>
                        
                        {/* ここに縦の PanelGroup を使います */}
                        <PanelGroup direction="vertical">
                            
                            {/* 上: CodeEditorPanel (ステップ1で修正したもの) */}
                            <Panel defaultSize={70} minSize={25}>
                                <CodeEditorPanel
                                    userCode={userCode} setUserCode={setUserCode}
                                    stdin={stdin} setStdin={setStdin}
                                    onExecute={handleExecute} onSubmit={handleSubmit}
                                    isSubmitting={isSubmitting} executionResult={executionResult} submitResult={submitResult}
                                    selectedLanguage={selectedLanguage} languages={languages}
                                    onLanguageSelect={setSelectedLanguage}
                                    selectedTheme={selectedTheme} themes={themes}
                                    onThemeSelect={setSelectedTheme}
                                    annotations={annotations}
                                />
                            </Panel>
    
                            {/* 上下を分割するリサイズハンドルを追加 */}
                            <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-blue-300 transition-colors flex items-center justify-center">
                                {/* アイコンを90度回転させて水平線のように見せます */}
                                <GripVertical className="h-4 w-4 text-gray-600 rotate-90" />
                            </PanelResizeHandle>
    
                            {/* 変更点: 下: ExecutionPanel (ステップ2で追加したもの) */}
                            <Panel defaultSize={30} minSize={20}>
                                <ExecutionPanel
                                    stdin={stdin} setStdin={setStdin}
                                    onExecute={handleExecute} onSubmit={handleSubmit}
                                    isSubmitting={isSubmitting} executionResult={executionResult} submitResult={submitResult}
                                    onNextProblem={handleNextProblem}
                                    chatMessages={chatMessages}
                                    onSendMessage={handleUserMessage}
                                    isAiLoading={isAiLoading}
                                    kohakuIcon={kohakuIcon}
                                    assignmentInfo={assignmentInfo}
                                    t={t}
                                />
                            </Panel>
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
        </div>
    );
};

export default ProblemSolverClient;