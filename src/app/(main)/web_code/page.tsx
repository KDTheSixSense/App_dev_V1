'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Play, Send, ChevronDown, CheckCircle, Code, Sparkles, GripVertical } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Image from 'next/image';
import toast from 'react-hot-toast';
import { recordStudyTimeAction, updateLoginStreakAction } from '@/lib/actions';

// Default codes for languages
const JAVA_DEFAULT_CODE = `public class Main{
    public static void main(String[] args){
        System.out.println("Hello, World!");
    }
}`;

const PYTHON_DEFAULT_CODE = `print("Hello, World!")`;

const JAVASCRIPT_DEFAULT_CODE = `console.log("Hello, World!");`;

const TYPESCRIPT_DEFAULT_CODE = `console.log("Hello, World!");`;

const C_DEFAULT_CODE = `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`;

const CPP_DEFAULT_CODE = `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`;

const CSHARP_DEFAULT_CODE = `using System;

public class Hello {
    public static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`;

const PHP_DEFAULT_CODE = `<?php
    echo "Hello, World!";
?>`;

const DEFAULT_CODES: { [key: string]: string } = {
    'java': JAVA_DEFAULT_CODE,
    'python': PYTHON_DEFAULT_CODE,
    'python3': PYTHON_DEFAULT_CODE,
    'javascript': JAVASCRIPT_DEFAULT_CODE,
    'typescript': TYPESCRIPT_DEFAULT_CODE,
    'c': C_DEFAULT_CODE,
    'cpp': CPP_DEFAULT_CODE,
    'csharp': CSHARP_DEFAULT_CODE,
    'php': PHP_DEFAULT_CODE,
};

// Dynamic import for AceEditor
const DynamicAceEditor = dynamic(
    () => import('@/components/AceEditorWrapper'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
                エディタを読み込んでいます...
            </div>
        )
    }
);

type ChatMessage = { sender: 'user' | 'kohaku'; text: string };
type ActiveTab = 'input' | 'output' | 'kohaku';
type AceAnnotation = {
    row: number;
    column: number;
    text: string;
    type: 'error' | 'warning' | 'info';
};

// --- Component Definitions ---

const CodeEditorPanel: React.FC<{
    userCode: string; setUserCode: (code: string) => void;
    selectedLanguage: string; languages: { value: string; label: string }[]; onLanguageSelect: (lang: string) => void;
    selectedTheme: string; themes: { value: string; label: string }[]; onThemeSelect: (theme: string) => void;
    annotations: AceAnnotation[];
}> = memo((props) => {
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showThemeDropdown, setShowThemeDropdown] = useState(false);

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
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Code className="h-5 w-5 text-gray-600" />
                    コード入力
                </h2>
                <div className="flex gap-4">
                    {/* Theme Dropdown */}
                    <div className="relative">
                        <button onClick={() => setShowThemeDropdown(!showThemeDropdown)} className="flex items-center justify-between w-40 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            <span>{props.themes.find(t => t.value === props.selectedTheme)?.label}</span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        {showThemeDropdown && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
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

                    {/* Language Dropdown */}
                    <div className="relative">
                        <button onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className="flex items-center justify-between w-40 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            <span>{props.languages.find(l => l.value === props.selectedLanguage)?.label}</span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        {showLanguageDropdown && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                {props.languages.map((lang) => (
                                    <button
                                        key={lang.value}
                                        onClick={() => {
                                            props.onLanguageSelect(lang.value);
                                            setShowLanguageDropdown(false);
                                        }}
                                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-grow flex min-h-0 relative">
                <DynamicAceEditor
                    mode={getAceMode(props.selectedLanguage)}
                    theme={props.selectedTheme}
                    value={props.userCode}
                    onChange={props.setUserCode}
                    name="CODE_EDITOR_WEB_CODE"
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
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm flex-shrink-0">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-500" />
                    <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">コハクに質問</span>
                </h3>
            </div>

            <div className="flex-grow p-4 overflow-y-scroll space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'kohaku' && (
                            <div className="flex-shrink-0 relative group">
                                <div className="absolute inset-0 bg-blue-100 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <Image
                                    src={kohakuIcon}
                                    alt="コハク"
                                    width={128}
                                    height={128}
                                    className="w-16 h-16 rounded-2xl border-2 border-white shadow-md object-cover relative z-10"
                                />
                            </div>
                        )}
                        <div className={`max-w-[85%] lg:max-w-[75%] px-5 py-3 shadow-sm ${msg.sender === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-white border-gray-100 border text-gray-800 rounded-2xl rounded-tl-sm'
                            }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-center gap-3 justify-start animate-pulse">
                        <div className="w-16 h-16 bg-gray-200 rounded-2xl flex-shrink-0"></div>
                        <div className="flex gap-1 bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isLoading ? "コハクが応答中です..." : "ヒントを求める..."}
                        disabled={isLoading}
                        className="flex-grow px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[3rem]"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExecutionPanel: React.FC<{
    stdin: string; setStdin: (stdin: string) => void;
    onExecute: () => void;
    isExecuting: boolean;
    executionResult: string;
    chatMessages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isAiLoading: boolean;
    kohakuIcon: string;
}> = memo((props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('input');

    // Switch to Output tab automatically when execution result changes (and it's not empty/initial state)
    useEffect(() => {
        if (props.executionResult && props.executionResult !== '実行中...') {
            setActiveTab('output');
        }
    }, [props.executionResult]);

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
                        <button
                            onClick={props.onExecute}
                            disabled={props.isExecuting}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors disabled:bg-cyan-300"
                        >
                            <Play className="h-4 w-4" />
                            {props.isExecuting ? '実行中...' : '実行'}
                        </button>
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
                        <div className="bg-gray-800 text-white p-3 rounded-md font-mono text-xs min-h-full">
                            <div className="text-gray-400 mb-1">実行結果:</div>
                            <pre className="whitespace-pre-wrap">{props.executionResult || '実行ボタンを押すとここに結果が表示されます。'}</pre>
                        </div>
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
ExecutionPanel.displayName = 'ExecutionPanel';

// --- Main Page Component ---

export default function WebCodePage() {
    // State
    const [selectedLanguage, setSelectedLanguage] = useState('python3');
    const [selectedTheme, setSelectedTheme] = useState('solarized_light');
    const [userCode, setUserCode] = useState(DEFAULT_CODES['python3']);
    const [stdin, setStdin] = useState('');
    const [executionResult, setExecutionResult] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [annotations, setAnnotations] = useState<AceAnnotation[]>([]);

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ sender: 'kohaku', text: `こんにちは！何かお手伝いできることはありますか？` }]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [kohakuIcon, setKohakuIcon] = useState('/images/Kohaku/kohaku-normal.png');

    // Time Tracking
    const [traceStartedAt, setTraceStartedAt] = useState<number | null>(null);
    const hasRecordedTime = useRef(false);

    // Start timer on mount
    useEffect(() => {
        setTraceStartedAt(Date.now());
    }, []);

    const recordStudyTime = useCallback(() => {
        if (traceStartedAt !== null) {
            const endTime = Date.now();
            const timeSpentMs = endTime - traceStartedAt;
            if (timeSpentMs > 3000) {
                recordStudyTimeAction(timeSpentMs);
                // Reset start time to now so we don't double count, or accumulate?
                // Usually we want to record the "chunk" and then reset the start time for the next chunk.
                setTraceStartedAt(Date.now());
            }
        }
    }, [traceStartedAt]);

    // Record time on unmount
    useEffect(() => {
        return () => {
            recordStudyTime();
        };
    }, [recordStudyTime]);

    // Fetch Pet Status for Icon (Simplified)
    useEffect(() => {
        const fetchPetStatus = async () => {
            try {
                const res = await fetch('/api/pet/status');
                if (res.ok) {
                    const { data } = await res.json();
                    if (data && data.evolutionType) {
                        // Assuming this logic is sufficient for basic display; more complex logic exists in ProblemClient
                        setKohakuIcon(`/images/evolution/${data.evolutionType}-base.png`);
                    } else if (data) {
                        setKohakuIcon('/images/Kohaku/kohaku-normal.png');
                    }
                }
            } catch (e) { console.error(e); }
        };
        fetchPetStatus();
    }, []);

    // Linting Effect
    useEffect(() => {
        if (!userCode.trim()) {
            setAnnotations([]);
            return;
        }
        const handler = setTimeout(async () => {
            try {
                const res = await fetch('/api/lint_code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: userCode, language: selectedLanguage })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.annotations) setAnnotations(data.annotations);
                }
            } catch (error) { console.error("[Lint] API call failed:", error); }
        }, 1000);
        return () => clearTimeout(handler);
    }, [userCode, selectedLanguage]);

    // Handlers
    const handleLanguageChange = (lang: string) => {
        setSelectedLanguage(lang);
        const defaultCode = DEFAULT_CODES[lang];
        if (defaultCode !== undefined) setUserCode(defaultCode);
    };

    const handleExecute = async () => {
        if (!userCode.trim()) { setExecutionResult('コードを入力してください。'); return; }

        // Record study time on execution
        recordStudyTime();
        // Update login streak
        updateLoginStreakAction();

        setExecutionResult('実行中...');
        setIsExecuting(true);
        try {
            const response = await fetch('/api/execute_code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: selectedLanguage, source_code: userCode, input: stdin }),
            });
            const data = await response.json();
            if (response.ok) {
                setExecutionResult(data.program_output?.stdout || data.program_output?.stderr || data.build_result?.stderr || '出力なし');
            } else {
                setExecutionResult(`エラー: ${data.error || '不明なエラー'}`);
            }
        } catch (error) {
            console.error('Error executing code:', error);
            setExecutionResult('コードの実行中にエラーが発生しました。');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleUserMessage = async (message: string) => {
        setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
        setIsAiLoading(true);
        try {
            const response = await fetch('/api/generate-hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: message,
                    context: {
                        problemTitle: "自由記述",
                        problemDescription: "ユーザーが自由にコードを書いています。",
                        userCode: userCode,
                    },
                }),
            });
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            setChatMessages((prev) => [...prev, { sender: 'kohaku', text: data.hint || 'すみません、よくわかりませんでした。' }]);
        } catch (error) {
            setChatMessages((prev) => [...prev, { sender: 'kohaku', text: 'エラーが発生しました。' }]);
        } finally {
            setIsAiLoading(false);
        }
    };

    // Constants
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

    return (
        <div className="h-full p-4 overflow-hidden bg-gray-50 flex flex-col">

            <PanelGroup direction="vertical">
                <Panel defaultSize={50} minSize={25}>
                    <CodeEditorPanel
                        userCode={userCode} setUserCode={setUserCode}
                        selectedLanguage={selectedLanguage} languages={languages}
                        onLanguageSelect={handleLanguageChange}
                        selectedTheme={selectedTheme} themes={themes}
                        onThemeSelect={setSelectedTheme}
                        annotations={annotations}
                    />
                </Panel>

                <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-blue-300 transition-colors flex items-center justify-center cursor-row-resize">
                    <GripVertical className="h-4 w-4 text-gray-600 rotate-90" />
                </PanelResizeHandle>

                <Panel defaultSize={50} minSize={20}>
                    <ExecutionPanel
                        stdin={stdin} setStdin={setStdin}
                        onExecute={handleExecute}
                        isExecuting={isExecuting}
                        executionResult={executionResult}
                        chatMessages={chatMessages}
                        onSendMessage={handleUserMessage}
                        isAiLoading={isAiLoading}
                        kohakuIcon={kohakuIcon}
                    />
                </Panel>
            </PanelGroup>
        </div>
    );
}
