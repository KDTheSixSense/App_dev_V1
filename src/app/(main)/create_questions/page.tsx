'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Send, FileText, Code, ChevronDown, Eye, EyeOff, CheckCircle } from 'lucide-react';

const CreateQuestionsPage: React.FC = () => {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [userCode, setUserCode] = useState('');
  const [executionResult, setExecutionResult] = useState('');
  const [showSampleCode, setShowSampleCode] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showAIHint, setShowAIHint] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);

  const sampleProblem = {
    title: 'for文とif文を組み合わせてみよう',
    description: 'for文とif文を組み合わせて、1から30までの範囲の偶数のみをひとつずつ出力してください。',
    expectedOutput: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    sampleCode: {
      python: `for i in range(1, 31):
    if i % 2 == 0:
        print(i)`,
      javascript: `for (let i = 1; i <= 30; i++) {
    if (i % 2 === 0) {
        console.log(i);
    }
}`,
      java: `for (int i = 1; i <= 30; i++) {
    if (i % 2 == 0) {
        System.out.println(i);
    }
}`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 30; i++) {
        if (i % 2 == 0) {
            cout << i << endl;
        }
    }
    return 0;
}`,
      csharp: `using System;

class Program {
    static void Main() {
        for (int i = 1; i <= 30; i++) {
            if (i % 2 == 0) {
                Console.WriteLine(i);
            }
        }
    }
}`
    },
  };

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' }
  ];

  useEffect(() => {
    setUserCode('');
    setExecutionResult('');
  }, [selectedLanguage]);

  const handleExecute = async () => {
    if (!userCode.trim()) {
      setExecutionResult('コードを入力してください。');
      return;
    }

    setExecutionResult('実行中...');

    try {
      const response = await fetch('/api/execute_code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: selectedLanguage,
          source_code: userCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.build_result && data.build_result.stderr) {
          setExecutionResult(`ビルドエラー:\n${data.build_result.stderr}`);
        } else if (data.build_result && data.build_result.stdout) {
          setExecutionResult(`ビルド出力:\n${data.build_result.stdout}`);
        } else if (data.program_output && data.program_output.stderr) {
          setExecutionResult(`実行時エラー:\n${data.program_output.stderr}`);
        } else if (data.program_output && data.program_output.stdout) {
          setExecutionResult(data.program_output.stdout);
        } else {
          setExecutionResult('不明な結果: ' + JSON.stringify(data));
        }
      } else {
        setExecutionResult(`エラー: ${data.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setExecutionResult('コードの実行中にエラーが発生しました。');
    }
  };

  const handleSubmit = async () => {
    if (!userCode.trim()) {
      alert('コードを入力してから提出してください。');
      return;
    }

    setIsSubmitting(true);
    setExecutionResult('提出中...');

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCode: userCode,
          language: selectedLanguage
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.success) {
          alert(data.message);
          setExecutionResult(data.result);
          setSubmitResult(data);
        } else {
          alert(data.message);
          setExecutionResult(data.result);
          setSubmitResult(data);
        }
        console.log('Submit Response:', data);
      } else {
        alert(`エラー: ${data.error || '不明なエラー'}`);
        setExecutionResult(`エラー: ${data.error || '不明なエラー'}`);
        setSubmitResult({ success: false, error: data.error || '不明なエラー' });
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      alert('コードの提出中にエラーが発生しました。');
      setExecutionResult('コードの提出中にエラーが発生しました。');
      setSubmitResult({ success: false, error: 'コードの提出中にエラーが発生しました。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    const lang = languages.find(l => l.value === selectedLanguage)?.label || 'コード';
    return `${lang}でコードを入力してください...`;
  };

  const getAIHintText = () => {
    const lang = languages.find(l => l.value === selectedLanguage)?.label || 'コード';
    return `${lang}で作成し、トレース結果を出力してみたがこれでいいのか？`;
  };

  const handleLanguageSelect = (langValue: string) => {
    setSelectedLanguage(langValue);
    setShowLanguageDropdown(false);
  };

  const renderCodeWithLineNumbers = (code: string) => {
    const lines = code.split('\n');
    const lineCount = Math.max(lines.length, 10);
    
    return (
      <div className="flex border border-gray-300 rounded-md overflow-hidden">
        <div className="bg-gray-100 px-3 py-3 text-sm font-mono text-gray-600 select-none border-r border-gray-300 min-w-[50px]">
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index} className="text-right leading-6">
              {index + 1}
            </div>
          ))}
        </div>
        <div className="flex-1">
          <textarea
            placeholder={getPlaceholder()}
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            className="w-full min-h-[240px] p-3 text-sm font-mono border-0 focus:outline-none resize-none bg-white"
            style={{
              lineHeight: '1.5',
              fontFamily: 'monospace'
            }}
            rows={lineCount}
          />
        </div>
      </div>
    );
  };

  // 課題作成ボタンのクリックハンドラ
  const handleCreateAssignmentClick = () => {
    router.push('/create_questions/assignment_creation');
  };

  // 資格作成ボタンのクリックハンドラ
  const handleCreateQualificationClick = () => {
    router.push('/create_questions/qualification_creation');
  };

  // カスタム問題作成ボタンのクリックハンドラ
  const handleCreateCustomClick = () => {
    router.push('/create_questions/custom_creation');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
              showSampleCode 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setShowSampleCode(!showSampleCode)}
          >
            <FileText className="h-4 w-4" />
            サンプルケース
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${
              showAIHint 
                ? 'bg-cyan-500 text-white border-cyan-600' 
                : 'bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300'
            }`}
            onClick={() => setShowAIHint(!showAIHint)}
          >
            {showAIHint ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showAIHint ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Problem */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              課題「{sampleProblem.title}」
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-700">
              {sampleProblem.description}
            </p>
            
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">期待する出力値</h3>
              <div className="bg-gray-100 p-3 rounded-md text-sm font-mono text-gray-800">
                {sampleProblem.expectedOutput.join('\n')}
              </div>
            </div>

            {showSampleCode && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">サンプルコード ({languages.find(l => l.value === selectedLanguage)?.label})</span>
                </div>
                <pre className="text-sm text-green-700 bg-white p-2 rounded border overflow-x-auto">
                  <code>{sampleProblem.sampleCode[selectedLanguage as keyof typeof sampleProblem.sampleCode] || 'このプログラミング言語のサンプルコードは準備中です。'}</code>
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Input and AI Hint */}
        <div className="space-y-6">
          {/* Code Input */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">コード入力</h2>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                    {languages.find(l => l.value === selectedLanguage)?.label}
                  </span>
                </div>
                <div className="relative">
                  <button
                    className="flex items-center justify-between w-40 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  >
                    <span>{languages.find(l => l.value === selectedLanguage)?.label}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  {showLanguageDropdown && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                          onClick={() => handleLanguageSelect(lang.value)}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {renderCodeWithLineNumbers(userCode)}
              
              <div className="flex gap-2">
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                  onClick={handleExecute}
                >
                  <Play className="h-4 w-4" />
                  実行
                </button>
                <button 
                  className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md transition-colors ${
                    isSubmitting 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? '提出中...' : '提出'}
                </button>
              </div>

              {/* Execution Result */}
              {executionResult && (
                <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-sm">
                  <div className="text-gray-400 mb-1">実行結果:</div>
                  <pre>{executionResult}</pre>
                </div>
              )}

              {/* Submit Result Section */}
              {submitResult && (
                <div className={`border p-4 rounded-md mt-4 ${
                  submitResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className={`h-5 w-5 ${
                      submitResult.success ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <h4 className={`font-semibold ${
                      submitResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      提出結果
                    </h4>
                  </div>
                  
                  <div className={`text-sm ${
                    submitResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="font-medium">ステータス:</span> 
                        <span className="ml-2">
                          {submitResult.success ? '✅ 成功' : '❌ 失敗'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="font-medium">メッセージ:</span> 
                        <span className="ml-2">
                          {submitResult.message || submitResult.error}
                        </span>
                      </div>

                      {submitResult.validation_message && (
                        <div>
                          <span className="font-medium">詳細:</span> 
                          <span className="ml-2">{submitResult.validation_message}</span>
                        </div>
                      )}

                      {submitResult.language && (
                        <div>
                          <span className="font-medium">言語:</span> 
                          <span className="ml-2">{submitResult.language}</span>
                        </div>
                      )}

                      {submitResult.expected_output && (
                        <div>
                          <span className="font-medium">期待する出力:</span>
                          <pre className="bg-white p-3 rounded border mt-2 text-xs font-mono overflow-x-auto">
                            {submitResult.expected_output_text || submitResult.output_text}
                          </pre>
                        </div>
                      )}

                      {!submitResult.success && submitResult.output_text && (
                        <div>
                          <span className="font-medium">あなたの出力:</span>
                          <pre className="bg-white p-3 rounded border mt-2 text-xs font-mono overflow-x-auto">
                            {submitResult.output_text}
                          </pre>
                        </div>
                      )}

                      {submitResult.submitted_code && (
                        <div>
                          <span className="font-medium">提出されたコード:</span>
                          <pre className="bg-white p-3 rounded border mt-2 text-xs font-mono overflow-x-auto">
                            {submitResult.submitted_code}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Hint Section */}
          {showAIHint && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-teal-200">
                <h2 className="text-lg font-bold text-teal-800">
                  AIヒント
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-white/70 p-4 rounded-md border border-teal-200">
                  <p className="text-sm text-gray-700 mb-3">
                    期待する出力値とトレース結果を照らし合わせると間違いないね
                  </p>
                  <p className="text-sm text-gray-600">
                    提出して問題ないんじゃないかな？
                  </p>
                </div>
                
                <div className="bg-white/70 p-4 rounded-md border border-teal-200">
                  <p className="text-sm text-gray-700">
                    {getAIHintText()}
                  </p>
                </div>

                <button className="w-full px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors">
                  質問
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons Section */}
      
      </div>
  );
};

export default CreateQuestionsPage;
