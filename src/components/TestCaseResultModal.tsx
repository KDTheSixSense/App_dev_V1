'use client';

import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

// テストケース個別の結果型
export type TestCaseResult = {
  name: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isCorrect: boolean;
  status: 'Success' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded';
};

// モーダルのProps定義
type TestCaseResultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  success: boolean; // 全体の合否
  results: TestCaseResult[];
  message?: string; // 補足メッセージ
};

const TestCaseResultModal: React.FC<TestCaseResultModalProps> = ({
  isOpen,
  onClose,
  success,
  results,
  message,
}) => {
  if (!isOpen) return null;

  return (
    // fixed inset-0 と bg-black/50 で背景を半透明の黒にして透過させます
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className={`p-4 border-b flex justify-between items-center ${success ? 'bg-green-50' : 'bg-red-50'} rounded-t-lg`}>
          <div className="flex items-center gap-3">
            {success ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h2 className={`text-xl font-bold ${success ? 'text-green-800' : 'text-red-800'}`}>
                {success ? '正解！ (All Tests Passed)' : '不正解 (Tests Failed)'}
              </h2>
              {message && <p className="text-sm text-gray-600">{message}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* ボディ（スクロール可能） */}
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          <div className="space-y-4">
            {results.length === 0 ? (
              <p className="text-center text-gray-500 py-4">テストケース結果がありません。</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2 border-b pb-2">
                    <span className="font-bold text-gray-700">{result.name}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {result.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">期待される出力:</p>
                      <pre className="bg-white border p-2 rounded text-gray-800 whitespace-pre-wrap min-h-[2.5rem] max-h-96 overflow-y-auto custom-scrollbar">
                        {result.expectedOutput}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">あなたの出力:</p>
                      <pre className={`bg-white border p-2 rounded whitespace-pre-wrap min-h-[2.5rem] max-h-96 overflow-y-auto custom-scrollbar ${result.isCorrect ? 'text-gray-800 border-gray-300' : 'text-red-600 border-red-300 bg-red-50'
                        }`}>
                        {result.actualOutput}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestCaseResultModal;