// /workspaces/my-next-app/src/app/(main)/issue_list/programming_problem/[problemId]/page.tsx
'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, Send, CheckCircle, ChevronDown, Sparkles, FileText, Code, GripVertical } from 'lucide-react';
// パネルのリサイズ機能を提供するライブラリのコンポーネントをインポートします
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// --- データと型のインポート ---
import type { Problem as SerializableProblem } from '@/lib/types';
import { getProblemByIdAction, getNextProgrammingProblemId, awardXpForCorrectAnswer, recordStudyTimeAction} from '@/lib/actions';

import AceEditor from 'react-ace';
import ace from 'ace-builds/src-noconflict/ace';

// 1. 必要な「モード」（言語のシンタックスハイライト）をインポート
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp'; // CとC++
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/mode-php';

// 2. 必要な「テーマ」（エディタの配色）をインポート
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-tomorrow_night'; // (ダークモード例)

// 3. 必要な「機能拡張」をインポート (非常に重要)
import 'ace-builds/src-noconflict/ext-language_tools'; // 自動補完とスニペット
import 'ace-builds/src-noconflict/ext-beautify'; // (おまけ: コード整形機能)

// --- 型定義 ---
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };
type ActiveTab = 'input' | 'output';
type SubmitResult = {
    success: boolean;
    message: string;
    yourOutput?: string;
    expected?: string;
};

// --- Aceのアノテーション型を定義 ---
type AceAnnotation = {
    row: number;
    column: number;
    text: string;
    type: 'error' | 'warning' | 'info';
};

// --- UIコンポーネント ---

// カスタムアラートモーダル
const CustomAlertModal: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4"><p className="text-lg text-gray-800 mb-4">{message}</p><button onClick={onClose} className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">OK</button></div>
    </div>
);

// 左パネル: 問題文
const ProblemDescriptionPanel: React.FC<{ problem: SerializableProblem }> = ({ problem }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
        <div className="p-4 border-b flex-shrink-0"><h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><FileText className="h-6 w-6 text-blue-500" /><span>問{problem.id}: {problem.title.ja}</span></h2></div>
        <div className="p-6 space-y-6 overflow-y-auto">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: problem.description.ja.replace(/\n/g, '<br />') }} />
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
    executionResult: string; submitResult: SubmitResult | null;
    annotations: AceAnnotation[];
}> = memo((props) => { // memoでラップ
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('input');

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
        return mapping[langValue] || 'javascript';
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            {/* --- ヘッダー（言語選択） --- */}
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Code className="h-5 w-5 text-gray-600" />コード入力</h2>
                <div className="relative">
                    <button onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className="flex items-center justify-between w-40 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        <span>{props.languages.find(l => l.value === props.selectedLanguage)?.label}</span><ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    {showLanguageDropdown && (<div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-20">{props.languages.map((lang) => (<button key={lang.value} onClick={() => { props.onLanguageSelect(lang.value); setShowLanguageDropdown(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100">{lang.label}</button>))}</div>)}
                </div>
            </div>

            {/* --- AceEditor (変更なし) --- */}
            <div className="flex-grow flex min-h-0 relative">
                <AceEditor
                    mode={getAceMode(props.selectedLanguage)}
                    theme="github"
                    value={props.userCode}
                    onChange={props.setUserCode}
                    name="CODE_EDITOR_MAIN"
                    editorProps={{ $blockScrolling: true }}
                    width="100%"
                    height="100%"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    fontSize={14}
                    // アノテーションをpropsから受け取り、標準ワーカーを無効化
                    annotations={props.annotations}
                    setOptions={{
                        showLineNumbers: true,
                        showGutter: true,
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        useWorker: false, // 標準ワーカーを無効化
                        highlightActiveLine: true,
                        showPrintMargin: false,
                    }}
                />
            </div>

            {/* --- フッター（実行/提出/入出力タブ） (変更なし) --- */}
            <div className="p-4 border-t flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex border border-gray-300 rounded-md p-0.5">
                        <button onClick={() => setActiveTab('input')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'input' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>標準入力</button>
                        <button onClick={() => setActiveTab('output')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'output' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}>実行結果</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={props.onExecute} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"><Play className="h-4 w-4" /> 実行</button>
                        <button onClick={props.onSubmit} disabled={props.isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"><Send className="h-4 w-4" /> {props.isSubmitting ? '提出中...' : '提出'}</button>
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
});

CodeEditorPanel.displayName = 'CodeEditorPanel';

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
    const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [problemStartedAt, setProblemStartedAt] = useState<number>(Date.now());
    const hasRecordedTime = useRef(false);
    const [annotations, setAnnotations] = useState<AceAnnotation[]>([]);

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
        // 静的エラーチェック(Linting)や自動補完のワーカー(別ファイル)を
        // どこから読み込むかをAce Editorに教えます。
        // CDNを使うのが最も簡単です。
        const cdnBaseUrl = "https://cdn.jsdelivr.net/npm/ace-builds@1.33.0/src-noconflict/";
        ace.config.set("basePath", cdnBaseUrl);
        ace.config.set("modePath", cdnBaseUrl);
        ace.config.set("themePath", cdnBaseUrl);
        ace.config.set("workerPath", cdnBaseUrl);
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
                setProblemStartedAt(Date.now()); // 開始時刻をリセット
                hasRecordedTime.current = false;   // 記録フラグをリセット
            }
            setIsLoading(false);
        };
        fetchProblem();
    }, [problemId]);

    // サーバーサイド・リンティングを呼び出すEffect
    useEffect(() => {
        // 読み込み中は実行しない
        if (isLoading) {
            return;
        }
        
        // コードが空になったらエラーをクリア
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
                        setAnnotations(data.annotations); // 取得したアノテーションをステートにセット
                    }
                }
            } catch (error) {
                console.error("[Lint] API call failed:", error);
            }
        }, 1000); // 1秒（1000ms）待ってから実行

        // ユーザーがタイピングを再開したら、前回のタイマーをキャンセル
        return () => {
            clearTimeout(handler);
        };
    }, [userCode, selectedLanguage, isLoading]); // コードか言語か読み込み状態が変わるたびに実行

    /**
     * 学習時間を計算し、サーバーに送信する
     */
    const recordStudyTime = useCallback(() => {
      // まだこの問題の時間を記録していない場合のみ実行
      if (!hasRecordedTime.current) {
        const endTime = Date.now();
        const timeSpentMs = endTime - problemStartedAt;

        // 3秒以上の滞在のみを記録
        if (timeSpentMs > 3000) {
          console.log(`Recording ${timeSpentMs}ms for problem ${problemId}`);
          recordStudyTimeAction(timeSpentMs);
          hasRecordedTime.current = true; // 記録済みフラグを立てる
        }
      }
    }, [problemId, problemStartedAt]);

    // --- 6. ページを離れる時に時間を記録する Effect を追加 ---
    useEffect(() => {
      // このEffectは、problemStartedAt（＝新しい問題）が変わるたびに再登録される
      return () => {
        // クリーンアップ関数（ページ離脱時）に時間を記録
        recordStudyTime();
      };
    }, [problemStartedAt, recordStudyTime]); // problemStartedAt が変わるたびにクリーンアップを再設定

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
        if (!userCode.trim()) { alert('コードを入力してから提出してください。'); return; }
        setIsSubmitting(true);
        setExecutionResult('提出中...');
        recordStudyTime();
        try {
            const response = await fetch('/api/execute_code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: selectedLanguage, source_code: userCode, input: problem?.sampleCases?.[0]?.input || '' }), });
            const data = await response.json();
            const output = (data.program_output?.stdout || '').trim();
            const expectedOutput = (problem?.correctAnswer || 'UNSET').trim();
            if (expectedOutput === 'UNSET' || expectedOutput === '') { setSubmitResult({ success: false, message: '問題に正解が設定されていません。' }); setIsSubmitting(false); return; }
            if (output === expectedOutput) { 
                setSubmitResult({ success: true, message: '正解です！おめでとうございます！' }); 
                await awardXpForCorrectAnswer(parseInt(problemId), undefined, 1); //正解判定後にXPを付与.プログラミング問題はsubjectidが1なので1を渡す
                window.dispatchEvent(new CustomEvent('petStatusUpdated')); //ヘッダーのペットステータス更新を促すイベントを発火
            }
            else { setSubmitResult({ success: false, message: '不正解です。出力が異なります。', yourOutput: output, expected: expectedOutput }); }
        } catch (error) { console.error('Error submitting code:', error); setSubmitResult({ success: false, message: '提出処理中にエラーが発生しました。' }); }
        finally { setIsSubmitting(false); }
    };
    
    const handleNextProblem = async () => {
        if (!problem) return;
        recordStudyTime();
        const nextId = await getNextProgrammingProblemId(parseInt(problem.id));
        if (nextId) { router.push(`/issue_list/programming_problem/${nextId}`); }
        else { setAlertMessage("これが最後の問題です！お疲れ様でした。"); setShowAlert(true); }
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
            {showAlert && <CustomAlertModal message={alertMessage} onClose={() => setShowAlert(false)} />}
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
                                selectedLanguage={selectedLanguage} languages={languages}
                                onLanguageSelect={setSelectedLanguage}
                                onExecute={handleExecute} onSubmit={handleSubmit}
                                isSubmitting={isSubmitting} executionResult={executionResult} submitResult={submitResult}
                                annotations={annotations}
                            />
                        </Panel>
                        <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-blue-300 transition-colors flex items-center justify-center">
                             <div className="w-8 h-1 bg-gray-400 rounded-full" />
                        </PanelResizeHandle>
                        <Panel defaultSize={30} minSize={15}>
                             <AiChatPanel messages={chatMessages} onSendMessage={handleUserMessage} isLoading={isAiLoading} />
                        </Panel>
                    </PanelGroup>
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
