// /workspaces/my-next-app/src/app/(main)/issue_list/programming_problem/[problemId]/page.tsx
'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Play, Send, CheckCircle, ChevronDown, Sparkles, FileText, Code, GripVertical, ArrowLeft } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { sanitize } from '@/lib/sanitizer';
import toast from 'react-hot-toast';

import type { Problem as SerializableProblem } from '@/lib/types';
import { getProblemByIdAction, getNextProgrammingProblemId, awardXpForCorrectAnswer, recordStudyTimeAction } from '@/lib/actions';
import TestCaseResultModal, { TestCaseResult } from '@/components/TestCaseResultModal';

const MAX_HUNGER = 200;

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
    testCaseResults?: TestCaseResult[];
};

type AceAnnotation = {
    row: number;
    column: number;
    text: string;
    type: 'error' | 'warning' | 'info';
};

const ProblemDescriptionPanel: React.FC<{ problem: SerializableProblem }> = ({ problem }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
        <div className="p-4 border-b flex-shrink-0"><h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><FileText className="h-6 w-6 text-blue-500" /><span>問{problem.id}: {problem.title.ja}</span></h2></div>
        <div className="p-6 space-y-6 overflow-y-auto">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitize(problem.description.ja.replace(/\n/g, '<br />')) }} />
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

const CodeEditorPanel: React.FC<{
    userCode: string; setUserCode: (code: string) => void;
    stdin: string; setStdin: (stdin: string) => void;
    selectedLanguage: string; languages: { value: string; label: string }[]; onLanguageSelect: (lang: string) => void;
    selectedTheme: string; themes: { value: string; label: string }[]; onThemeSelect: (theme: string) => void;
    onExecute: () => void; onSubmit: () => void; isSubmitting: boolean;
    executionResult: string; submitResult: SubmitResult | null;
    annotations: AceAnnotation[];
}> = memo((props) => {
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showThemeDropdown, setShowThemeDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('input');

    const getAceMode = (langValue: string) => {
        const mapping: { [key: string]: string } = {
            'python': 'python',
            'python3': 'python',
            'javascript': 'javascript',
            'typescript': 'typescript',
            'java': 'java',
            'c': 'c_cpp',
            'cpp': 'c_cpp',
            'csharp': 'csharp',
            'php': 'php',
        };
        return mapping[langValue] || 'javascript';
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Code className="h-5 w-5 text-gray-600" />コード入力</h2>
                <div className="flex gap-4">
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

                    <div className="relative">
                        <button onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className="flex items-center justify-between w-40 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            <span>{props.languages.find(l => l.value === props.selectedLanguage)?.label}</span><ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        {showLanguageDropdown && (<div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-20">{props.languages.map((lang) => (<button key={lang.value} onClick={() => { props.onLanguageSelect(lang.value); setShowLanguageDropdown(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100">{lang.label}</button>))}</div>)}
                    </div>
                </div>
            </div>

            <div className="flex-grow flex min-h-0 relative">
                <DynamicAceEditor
                    mode={getAceMode(props.selectedLanguage)}
                    theme={props.selectedTheme}
                    value={props.userCode}
                    onChange={props.setUserCode}
                    name="CODE_EDITOR_MAIN"
                    editorProps={{ $blockScrolling: true }}
                    width="100%"
                    height="100%"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    fontSize={14}
                    annotations={props.annotations}
                    setOptions={{
                        showLineNumbers: true,
                        showGutter: true,
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        useWorker: false,
                        highlightActiveLine: true,
                        showPrintMargin: false,
                    }}
                />
            </div>
        </div>
    );
});

CodeEditorPanel.displayName = 'CodeEditorPanel';

const ExecutionPanel: React.FC<{
    stdin: string; setStdin: (stdin: string) => void;
    onExecute: () => void; onSubmit: () => void; isSubmitting: boolean;
    executionResult: string; submitResult: SubmitResult | null;
    onNextProblem: () => void;
    chatMessages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isAiLoading: boolean;
    kohakuIcon: string;
}> = memo((props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('input');

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-t flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex border border-gray-300 rounded-md p-0.5">
                        <button onClick={() => setActiveTab('input')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'input' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>標準入力</button>
                        <button onClick={() => setActiveTab('output')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'output' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>実行結果</button>
                        <button onClick={() => setActiveTab('kohaku')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'kohaku' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>コハク</button>
                    </div>
                    <div className="flex gap-2">
                        {props.submitResult?.success && (
                            <button
                                onClick={props.onNextProblem}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                次の問題へ
                            </button>
                        )}
                        <button onClick={props.onExecute} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"><Play className="h-4 w-4" /> 実行</button>
                        <button onClick={props.onSubmit} disabled={props.isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"><Send className="h-4 w-4" /> {props.isSubmitting ? '確認中...' : '完了'}</button>
                    </div>
                </div>
            </div>

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
                    <div className="h-full overflow-y-auto">
                        {props.executionResult && (<div className="bg-gray-800 text-white p-3 rounded-md font-mono text-xs"><div className="text-gray-400 mb-1">実行結果:</div><pre className="whitespace-pre-wrap">{props.executionResult}</pre></div>)}
                        {props.submitResult && (<div className={`border p-4 rounded-md mt-2 ${props.submitResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center gap-2 mb-2"><CheckCircle className={`h-5 w-5 ${props.submitResult.success ? 'text-green-600' : 'text-red-600'}`} /><h4 className={`font-semibold ${props.submitResult.success ? 'text-green-800' : 'text-red-800'}`}>{props.submitResult.success ? '正解' : '不正解'}</h4></div><p className="text-sm">{props.submitResult.message}</p>{!props.submitResult.success && props.submitResult.yourOutput !== undefined && (<><p className="text-sm mt-2 font-semibold">あなたの出力:</p><pre className="bg-white p-2 mt-1 rounded text-xs text-red-700">{props.submitResult.yourOutput || '(空の出力)'}</pre><p className="text-sm mt-2 font-semibold">期待する出力:</p><pre className="bg-white p-2 mt-1 rounded text-xs text-green-700">{props.submitResult.expected}</pre></>)}</div>)}
                    </div>
                )}
                {activeTab === 'kohaku' && (
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

const AiChatPanel: React.FC<{
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    kohakuIcon: string;
}> = ({ messages, onSendMessage, isLoading, kohakuIcon }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    const handleSend = () => { if (input.trim() && !isLoading) { onSendMessage(input); setInput(''); } };
    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b flex-shrink-0"><h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan-500" />コハクに質問</h3></div>
            <div className="flex-grow p-4 overflow-y-scroll space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'kohaku' && (
                            <Image
                                src={kohakuIcon}
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

const ProblemSolverPage = () => {
    const router = useRouter();
    const params = useParams();
    const problemId = params.problemId as string;

    const [problem, setProblem] = useState<SerializableProblem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('python3');
    const [selectedTheme, setSelectedTheme] = useState('solarized_light');
    const [userCode, setUserCode] = useState('');
    const [stdin, setStdin] = useState('');
    const [executionResult, setExecutionResult] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [problemStartedAt, setProblemStartedAt] = useState<number>(Date.now());
    const hasRecordedTime = useRef(false);
    const [annotations, setAnnotations] = useState<AceAnnotation[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [kohakuIcon, setKohakuIcon] = useState('/images/Kohaku/kohaku-normal.png');
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    const languages = [
        { value: 'python3', label: 'Python 3' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'java', label: 'Java' },
        { value: 'c', label: 'C' },
        { value: 'cpp', label: 'C++' },
        { value: 'csharp', label: 'C#' },
        { value: 'php', label: 'PHP' }
    ];

    const themes = [
        { value: 'tomorrow_night', label: 'Tomorrow Night' },
        { value: 'monokai', label: 'Monokai (Dark)' },
        { value: 'dracula', label: 'Dracula (Dark)' },
        { value: 'nord_dark', label: 'Nord Dark (Dark)' },
        { value: 'terminal', label: 'Terminal (Dark)' },
        { value: 'merbivore_soft', label: 'Merbivore Soft' },
        { value: 'solarized_light', label: 'Solarized Light' },
        { value: 'chrome', label: 'Chrome (Light)' },
        { value: 'github', label: 'GitHub (Light)' },
        { value: 'xcode', label: 'Xcode (Light)' },
        { value: 'textmate', label: 'TextMate (Light)' },
        { value: 'kuroir', label: 'Kuroir (Light)' },
    ];

    const refetchPetStatus = useCallback(async () => {
        console.log("[Page.tsx] refetchPetStatus called.");
        try {
            const res = await fetch('/api/pet/status');
            if (res.ok) {
                const { data } = await res.json();
                if (data) {
                    const displayState = getPetDisplayState(data.hungerlevel);
                    setKohakuIcon(displayState.icon);
                    console.log(`[Page.tsx] コハクのアイコンを ${displayState.icon} に更新しました。`);
                }
            } else {
                console.error("[Page.tsx] Failed to fetch pet status.");
            }
        } catch (error) {
            console.error("[Page.tsx] ペット情報の再取得に失敗:", error);
        }
    }, []);

    useEffect(() => {
        if (!problemId) return;
        const fetchProblem = async () => {
            setIsLoading(true);
            setSubmitResult(null);
            setExecutionResult('');
            setStdin('');
            setAnnotations([]);
            const fetchedProblem = await getProblemByIdAction(problemId);
            setProblem(fetchedProblem || null);
            if (fetchedProblem) {
                setUserCode(fetchedProblem.programLines?.ja.join('\n') || '');
                setChatMessages([{ sender: 'kohaku', text: `問${fetchedProblem.id}について、何かヒントは必要ですか？` }]);
                setProblemStartedAt(Date.now());
                hasRecordedTime.current = false;
            }
            setIsLoading(false);
            refetchPetStatus();
        };
        fetchProblem();

        window.addEventListener('petStatusUpdated', refetchPetStatus);

        return () => {
            window.removeEventListener('petStatusUpdated', refetchPetStatus);
        };
    }, [problemId, refetchPetStatus]);

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!userCode.trim()) {
            setAnnotations([]);
            return;
        }

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
                        setAnnotations(data.annotations);
                    }
                }
            } catch (error) {
                console.error("[Lint] API call failed:", error);
            }
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [userCode, selectedLanguage, isLoading]);

    const recordStudyTime = useCallback(() => {
        if (!hasRecordedTime.current) {
            const endTime = Date.now();
            const timeSpentMs = endTime - problemStartedAt;

            if (timeSpentMs > 3000) {
                console.log(`Recording ${timeSpentMs}ms for problem ${problemId}`);
                recordStudyTimeAction(timeSpentMs);
                hasRecordedTime.current = true;
            }
        }
    }, [problemId, problemStartedAt]);

    useEffect(() => {
        return () => {
            recordStudyTime();
        };
    }, [problemStartedAt, recordStudyTime]);

    const handleExecute = async () => {
        if (!userCode.trim()) { setExecutionResult('コードを入力してください。'); return; }
        setExecutionResult('実行中...');
        recordStudyTime();
        try {
            const response = await fetch('/api/execute_code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: selectedLanguage, source_code: userCode, input: stdin }), });
            const data = await response.json();
            if (response.ok) { setExecutionResult(data.program_output?.stdout || data.program_output?.stderr || data.build_result?.stderr || '出力なし'); }
            else { setExecutionResult(`エラー: ${data.error || '不明なエラー'}`); }
        } catch (error) { console.error('Error executing code:', error); setExecutionResult('コードの実行中にエラーが発生しました。'); }
    };

    const handleSubmit = async () => {
        if (!userCode.trim()) { toast.error('コードを入力してから完了を選択してください。'); return; }
        setIsSubmitting(true);
        setExecutionResult('確認中...');
        recordStudyTime();
        try {
            const response = await fetch('/api/submit_code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: selectedLanguage,
                    source_code: userCode,
                    problemId: problemId,
                }),
            });
            const data = await response.json();
            setSubmitResult(data);

            if (data.testCaseResults && data.testCaseResults.length > 0) {
                setIsResultModalOpen(true);
            }

            else if (!data.success) {
                setExecutionResult(`エラー: ${data.message}`);
                toast.error(data.message);
            }

            if (data.success) {
                setSubmitResult({
                    ...data,
                    success: true,
                    message: '正解です！おめでとうございます！'
                });
                const xpResult = await awardXpForCorrectAnswer(parseInt(problemId), undefined, 1);
                window.dispatchEvent(new CustomEvent('petStatusUpdated'));

                if (xpResult.message === '経験値を獲得しました！') {
                    const res = await fetch('/api/pet/status');
                    if (res.ok) {
                        const { data: statusData } = await res.json();
                        if (statusData?.level && statusData.level > 0 && statusData.level % 30 === 0) {
                            setTimeout(() => {
                                router.push('/home?evolution=true');
                            }, 1500);
                        }
                    }
                }
            }
        } catch (error) { console.error('Error submitting code:', error); setSubmitResult({ success: false, message: '確認処理中にエラーが発生しました。' }); }
        finally { setIsSubmitting(false); }
    };

    const handleNextProblem = async () => {
        if (!problem) return;
        recordStudyTime();
        const nextId = await getNextProgrammingProblemId(parseInt(problem.id));
        if (nextId) { router.push(`/issue_list/programming_problem/${nextId}`); }
        else { toast.success("これが最後の問題です！お疲れ様でした。"); }
    };

    const handleUserMessage = async (message: string) => {
        if (!problem) return;

        setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
        setIsAiLoading(true);

        try {
            const response = await fetch('/api/generate-hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: message,
                    context: {
                        problemTitle: problem.title.ja,
                        problemDescription: problem.description.ja,
                        userCode: userCode,
                        answerOptions: JSON.stringify(problem.answerOptions?.ja || []),
                        correctAnswer: problem.correctAnswer || '',
                        explanation: (problem as any).explanation?.ja || '',
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'AIからの応答取得に失敗しました。');
            }

            const data = await response.json();
            const kohakuResponse = data.hint || 'ヒントを生成できませんでした。もう一度試してみてください。';

            setChatMessages((prev) => [...prev, { sender: 'kohaku', text: kohakuResponse }]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
            setChatMessages((prev) => [...prev, { sender: 'kohaku', text: `エラー: ${errorMessage}` }]);
        } finally {
            setIsAiLoading(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-100">読み込んでいます...</div>;
    if (!problem) return <div className="flex justify-center items-center h-screen bg-gray-100">問題が見つかりませんでした。</div>;

    return (
        <div className="h-screen p-4 overflow-hidden">
            <TestCaseResultModal
                isOpen={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                success={submitResult?.success ?? false}
                results={submitResult?.testCaseResults ?? []}
                message={submitResult?.message}
            />

            <div className="mb-2">
                <Link href="/issue_list/programming_problem/problems" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    一覧へ戻る
                </Link>
            </div>

            <PanelGroup direction="horizontal">

                <Panel defaultSize={35} minSize={20}>
                    <ProblemDescriptionPanel problem={problem} />
                </Panel>

                <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-300 transition-colors flex items-center justify-center">
                    <GripVertical className="h-4 w-4 text-gray-600" />
                </PanelResizeHandle>

                <Panel minSize={30}>

                    <PanelGroup direction="vertical">

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

                        <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-blue-300 transition-colors flex items-center justify-center">
                            <GripVertical className="h-4 w-4 text-gray-600 rotate-90" />
                        </PanelResizeHandle>

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
                            />
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>
        </div>
    );
};

export default ProblemSolverPage;