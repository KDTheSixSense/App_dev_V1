// /workspaces/my-next-app/src/app/(main)/issue_list/programming_problem/[problemId]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, Send, CheckCircle, ChevronDown, Sparkles, FileText, Code, TextCursorInput, GripVertical } from 'lucide-react';
// パネルのリサイズ機能を提供するライブラリのコンポーネントをインポートします
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';

// --- データと型のインポート ---
import type { Problem as SerializableProblem, SampleCase } from '@/lib/types';
import { getProblemByIdAction, getNextProgrammingProblemId } from '@/lib/actions';

// --- 型定義 ---
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };
type ActiveTab = 'input' | 'output';

// --- UIコンポーネント ---



// 左パネル: 問題文
const ProblemDescriptionPanel: React.FC<{ problem: SerializableProblem }> = ({ problem }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
        <div className="p-4 border-b flex-shrink-0"><h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><FileText className="h-6 w-6 text-blue-500" /><span>問{problem.id}: {problem.title.ja}</span></h2></div>
        <div className="p-6 space-y-6 overflow-y-auto">


            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(problem.description.ja.replace(/\n/g, '<br />')) }} />
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

// 中央パネル: コードエディタ
const CodeEditorPanel: React.FC<{
    userCode: string; setUserCode: (code: string) => void;
    stdin: string; setStdin: (stdin: string) => void;
    selectedLanguage: string; languages: { value: string; label: string }[]; onLanguageSelect: (lang: string) => void;
    onExecute: () => void; onSubmit: () => void; isSubmitting: boolean;
    executionResult: string; submitResult: any;
}> = (props) => {
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('input');
    const lineCount = props.userCode.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLPreElement>(null);

    const syncScroll = () => { if (textareaRef.current && lineNumbersRef.current) { lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop; } };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Code className="h-5 w-5 text-gray-600" />コード入力</h2>
                <div className="relative">
                    <button onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className="flex items-center justify-between w-40 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        <span>{props.languages.find(l => l.value === props.selectedLanguage)?.label}</span><ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    {showLanguageDropdown && (<div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-20">{props.languages.map((lang) => (<button key={lang.value} onClick={() => { props.onLanguageSelect(lang.value); setShowLanguageDropdown(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100">{lang.label}</button>))}</div>)}
                </div>
            </div>
            <div className="flex-grow flex min-h-0">
                <pre ref={lineNumbersRef} className="bg-gray-100 p-3 text-right font-mono text-sm text-gray-500 select-none border-r overflow-y-hidden">{lineNumbers}</pre>
                <textarea ref={textareaRef} onScroll={syncScroll} value={props.userCode} onChange={(e) => props.setUserCode(e.target.value)} className="w-full h-full p-3 text-sm font-mono border-0 focus:outline-none resize-none" style={{ lineHeight: '1.5rem' }} spellCheck="false" />
            </div>
            {/* ▼▼▼【ここから修正】▼▼▼ */}
            <div className="p-4 border-t flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                    {/* タブを左側に配置 */}
                    <div className="flex border border-gray-300 rounded-md p-0.5">
                        <button onClick={() => setActiveTab('input')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'input' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>標準入力</button>
                        <button onClick={() => setActiveTab('output')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'output' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>実行結果</button>
                    </div>
                    {/* 実行・提出ボタンを右側に配置 */}
                    <div className="flex gap-2">
                        <button onClick={props.onExecute} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"><Play className="h-4 w-4" /> 実行</button>
                        <button onClick={props.onSubmit} disabled={props.isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"><Send className="h-4 w-4" /> {props.isSubmitting ? '確認中...' : '完了'}</button>
                    </div>
                </div>
                {/* 境界線はそのままに、上の要素の `mb-3` でスペースを調整 */}
                <div className="h-32 overflow-y-auto border rounded-md p-2">
                    {activeTab === 'input' && (<textarea value={props.stdin} onChange={(e) => props.setStdin(e.target.value)} className="w-full h-full p-1 text-sm font-mono border-0 rounded-md resize-none focus:outline-none" placeholder="コードへの入力値..."></textarea>)}
                    {activeTab === 'output' && (
                        <div>
                            {props.executionResult && (<div className="bg-gray-800 text-white p-3 rounded-md font-mono text-xs"><div className="text-gray-400 mb-1">実行結果:</div><pre className="whitespace-pre-wrap">{props.executionResult}</pre></div>)}
                            {props.submitResult && (<div className={`border p-4 rounded-md mt-2 ${props.submitResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center gap-2 mb-2"><CheckCircle className={`h-5 w-5 ${props.submitResult.success ? 'text-green-600' : 'text-red-600'}`} /><h4 className={`font-semibold ${props.submitResult.success ? 'text-green-800' : 'text-red-800'}`}>{props.submitResult.success ? '正解' : '不正解'}</h4></div><p className="text-sm">{props.submitResult.message}</p>{!props.submitResult.success && props.submitResult.yourOutput !== undefined && (<><p className="text-sm mt-2 font-semibold">あなたの出力:</p><pre className="bg-white p-2 mt-1 rounded text-xs text-red-700">{props.submitResult.yourOutput || '(空の出力)'}</pre><p className="text-sm mt-2 font-semibold">期待する出力:</p><pre className="bg-white p-2 mt-1 rounded text-xs text-green-700">{props.submitResult.expected}</pre></>)}</div>)}
                        </div>
                    )}
                </div>
            </div>
            {/* ▲▲▲【修正ここまで】▲▲▲ */}
        </div>
    );
};

// 右パネル: AIチャット
const AiChatPanel: React.FC<{ messages: ChatMessage[]; onSendMessage: (message: string) => void; isLoading: boolean; }> = ({ messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    const handleSend = () => { if (input.trim() && !isLoading) { onSendMessage(input); setInput(''); } };
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b flex-shrink-0"><h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan-500" />AIに質問</h3></div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (<div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>{msg.sender === 'kohaku' && <div className="w-8 h-8 rounded-full bg-cyan-400 flex-shrink-0 flex items-center justify-center text-white text-lg font-bold">AI</div>}<div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}><p className="text-sm">{msg.text}</p></div></div>))}
                {isLoading && <div className="text-center text-gray-500 text-sm">AIが考えています...</div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t flex-shrink-0">
                <div className="flex gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={isLoading ? "AIが応答中です..." : "ヒントを求める..."} disabled={isLoading} className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:bg-gray-100" />
                    <button onClick={handleSend} disabled={isLoading} className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors disabled:bg-cyan-300 disabled:cursor-not-allowed"><Send className="h-5 w-5" /></button>
                </div>
            </div>
        </div>
    );
};

// --- メインコンポーネント ---
const ProblemSolverPage = () => {
    const router = useRouter();
    const params = useParams();
    const problemId = params.problemId as string;

    const [problem, setProblem] = useState<SerializableProblem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('python');
    const [userCode, setUserCode] = useState('');
    const [stdin, setStdin] = useState('');
    const [executionResult, setExecutionResult] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const languages = [{ value: 'python', label: 'Python' }, { value: 'javascript', label: 'JavaScript' }, { value: 'java', label: 'Java' }, { value: 'cpp', label: 'C++' }, { value: 'csharp', label: 'C#' },];

    useEffect(() => {
        if (!problemId) return;
        const fetchProblem = async () => {
            setIsLoading(true);
            setSubmitResult(null);
            setExecutionResult('');
            setStdin('');
            const fetchedProblem = await getProblemByIdAction(problemId);
            setProblem(fetchedProblem || null);
            if (fetchedProblem) {
                setUserCode(fetchedProblem.programLines?.ja.join('\n') || '');
                setChatMessages([{ sender: 'kohaku', text: `問${fetchedProblem.id}について、何かヒントは必要ですか？` }]);
            }
            setIsLoading(false);
        };
        fetchProblem();
    }, [problemId]);

    const handleExecute = async () => {
        if (!userCode.trim()) { setExecutionResult('コードを入力してください。'); return; }
        setExecutionResult('実行中...');
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
        try {
            const response = await fetch('/api/execute_code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: selectedLanguage, source_code: userCode, input: problem?.sampleCases?.[0]?.input || '' }), });
            const data = await response.json();
            const output = (data.program_output?.stdout || '').trim();
            const expectedOutput = (problem?.correctAnswer || 'UNSET').trim();
            if (expectedOutput === 'UNSET' || expectedOutput === '') { setSubmitResult({ success: false, message: '問題に正解が設定されていません。' }); setIsSubmitting(false); return; }
            if (output === expectedOutput) { setSubmitResult({ success: true, message: '正解です！おめでとうございます！' }); }
            else { setSubmitResult({ success: false, message: '不正解です。出力が異なります。', yourOutput: output, expected: expectedOutput }); }
        } catch (error) { console.error('Error submitting code:', error); setSubmitResult({ success: false, message: '完了処理中にエラーが発生しました。' }); }
        finally { setIsSubmitting(false); }
    };

    const handleNextProblem = async () => {
        if (!problem) return;
        const nextId = await getNextProgrammingProblemId(parseInt(problem.id));
        if (nextId) { router.push(`/issue_list/programming_problem/${nextId}`); }
        else { toast.success("これが最後の問題です！お疲れ様でした。"); }
    };

    const handleUserMessage = async (message: string) => {
        if (!problem) return;

        // ユーザーのメッセージを即座にチャットに追加
        setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
        setIsAiLoading(true);

        try {
            // APIエンドポイントにリクエストを送信
            const response = await fetch('/api/generate-hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: message,
                    context: {
                        problemTitle: problem.title.ja,
                        problemDescription: problem.description.ja,
                        userCode: userCode,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'AIからの応答取得に失敗しました。');
            }

            const data = await response.json();
            const kohakuResponse = data.hint || 'ヒントを生成できませんでした。もう一度試してみてください。';

            // AIからの応答をチャットに追加
            setChatMessages((prev) => [...prev, { sender: 'kohaku', text: kohakuResponse }]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
            // エラーメッセージをチャットに追加
            setChatMessages((prev) => [...prev, { sender: 'kohaku', text: `エラー: ${errorMessage}` }]);
        } finally {
            // ローディング状態を解除
            setIsAiLoading(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-100">読み込んでいます...</div>;
    if (!problem) return <div className="flex justify-center items-center h-screen bg-gray-100">問題が見つかりませんでした。</div>;

    return (
        <div className="h-screen bg-gray-100 p-4 overflow-hidden">
            <PanelGroup direction="horizontal">
                <Panel defaultSize={35} minSize={20}>
                    <ProblemDescriptionPanel problem={problem} />
                </Panel>
                <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-300 transition-colors flex items-center justify-center">
                    <GripVertical className="h-4 w-4 text-gray-600" />
                </PanelResizeHandle>
                <Panel defaultSize={40} minSize={30}>
                    <CodeEditorPanel
                        userCode={userCode} setUserCode={setUserCode}
                        stdin={stdin} setStdin={setStdin}
                        selectedLanguage={selectedLanguage} languages={languages}
                        onLanguageSelect={setSelectedLanguage}
                        onExecute={handleExecute} onSubmit={handleSubmit}
                        isSubmitting={isSubmitting} executionResult={executionResult} submitResult={submitResult}
                    />
                </Panel>
                <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-300 transition-colors flex items-center justify-center">
                    <GripVertical className="h-4 w-4 text-gray-600" />
                </PanelResizeHandle>
                <Panel defaultSize={25} minSize={20}>
                    <AiChatPanel messages={chatMessages} onSendMessage={handleUserMessage} isLoading={isAiLoading} />
                </Panel>
            </PanelGroup>
            {submitResult?.success && (
                <div className="absolute bottom-10 right-1/4 left-1/4 z-20">
                    <button onClick={handleNextProblem} className="w-full py-3 px-6 text-lg font-semibold text-white bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600 transition-colors">次の問題へ</button>
                </div>
            )}
        </div>
    );
};

export default ProblemSolverPage;
