'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Send, CheckCircle, ChevronDown, Sparkles, FileText, Code, GripVertical } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import type { Problem as SerializableProblem } from '@/lib/types';
import { getNextProgrammingProblemId } from '@/lib/actions';

type ChatMessage = { sender: 'user' | 'kohaku'; text: string };
type ActiveTab = 'input' | 'output';

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

const CustomAlertModal: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4"><p className="text-lg text-gray-800 mb-4">{message}</p><button onClick={onClose} className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">OK</button></div>
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
            <div className="p-4 border-t flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-2">
                        <button onClick={props.onExecute} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"><Play className="h-4 w-4" /> 実行</button>
                        <button onClick={props.onSubmit} disabled={props.isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"><Send className="h-4 w-4" /> {props.isSubmitting ? '提出中...' : '提出'}</button>
                    </div>
                    <div className="flex border border-gray-300 rounded-md p-0.5">
                        <button onClick={() => setActiveTab('input')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'input' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>標準入力</button>
                        <button onClick={() => setActiveTab('output')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'output' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>実行結果</button>
                    </div>
                </div>
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
        </div>
    );
};

const AiChatPanel: React.FC<{ messages: ChatMessage[]; onSendMessage: (message: string) => void; }> = ({ messages, onSendMessage }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    const handleSend = () => { if (input.trim()) { onSendMessage(input); setInput(''); } };
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b flex-shrink-0"><h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan-500" />AIに質問</h3></div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (<div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>{msg.sender === 'kohaku' && <div className="w-8 h-8 rounded-full bg-cyan-400 flex-shrink-0 flex items-center justify-center text-white text-lg font-bold">AI</div>}<div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}><p className="text-sm">{msg.text}</p></div></div>))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t flex-shrink-0">
                <div className="flex gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="ヒントを求める..." className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                    <button onClick={handleSend} className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"><Send className="h-5 w-5" /></button>
                </div>
            </div>
        </div>
    );
};

const ProblemSolverClient: React.FC<ProblemSolverClientProps> = ({ problem, assignmentInfo }) => {
    const router = useRouter();
    const searchParams = useSearchParams(); // クエリパラメータを取得
    const t = textResources['ja'].problemStatement;

    // problemはpropsから直接受け取るので、useStateは不要
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('python');
    const [userCode, setUserCode] = useState('');
    const [stdin, setStdin] = useState('');
    const [executionResult, setExecutionResult] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [onCloseAction, setOnCloseAction] = useState<(() => void) | null>(null);


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

    useEffect(() => {
        // problemが変更されたら（＝別の問題ページに遷移したら）状態をリセット
        setSubmitResult(null);
        setExecutionResult('');
        setStdin('');
        setUserCode(problem.programLines?.ja.join('\n') || '');
        setChatMessages([{ sender: 'kohaku', text: `問${problem.id}について、何かヒントは必要ですか？` }]);
    }, [problem]);

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
        if (!userCode.trim()) { alert('コードを入力してから提出してください。'); return; }
        setIsSubmitting(true);
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
                        await fetch('/api/submissions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ assignmentId: Number(assignmentInfo.assignmentId), status: '提出済み', description: '正解しました', codingId: problem.id }),
                        });
                        // アラートメッセージとOKボタン押下時のアクションを設定
                        setAlertMessage('課題が提出できました');
                        setOnCloseAction(() => () => router.push(`/group/${assignmentInfo.hashedId}/member`));
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
          if (assignmentInfo.hashedId) {
            router.push(`/group/${assignmentInfo.hashedId}/member`);
            return;
          }
    
          const res = await fetch(`/group/select-page/${problem.id}`);
          const data = await res.json();
          if (data.nextProblemId) {
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
            {showAlert && (
                <CustomAlertModal 
                    message={alertMessage} 
                    onClose={() => {
                        setShowAlert(false);
                        if (onCloseAction) onCloseAction();
                        setOnCloseAction(null); // アクションをリセット
                    }} 
                />
            )}            <PanelGroup direction="horizontal">
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
                                selectedLanguage={selectedLanguage} languages={languages}
                                onLanguageSelect={setSelectedLanguage}
                                onExecute={handleExecute} onSubmit={handleSubmit}
                                isSubmitting={isSubmitting} executionResult={executionResult} submitResult={submitResult}
                            />
                        </Panel>
                        <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-blue-300 transition-colors flex items-center justify-center">
                             <div className="w-8 h-1 bg-gray-400 rounded-full" />
                        </PanelResizeHandle>
                        <Panel defaultSize={30} minSize={15}>
                             <AiChatPanel messages={chatMessages} onSendMessage={handleUserMessage} />
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>
            {isAnswered && (
                <div className="w-full max-w-lg mt-8 flex justify-center">
                <button onClick={handleNextProblem} className="w-full py-4 px-8 text-xl font-semibold text-white bg-green-500 rounded-lg shadow-lg hover:bg-green-600">
                    {assignmentInfo.hashedId ? '課題一覧へ戻る' : t.nextProblemButton}
                </button>
                </div>
            )}
        </div>
    );
};

export default ProblemSolverClient;