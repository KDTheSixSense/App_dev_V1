'use client';

import React, { useState } from 'react';
import TraceClient from './TraceClient';
import PythonTraceClient from './PythonTraceClient';

const TracePage = () => {
  const [traceMode, setTraceMode] = useState<'pseudo' | 'python'>('pseudo');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* widthを95%にし、最大幅制限を解除してワイドにする */}
      <div className="w-[95%] mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            カスタムトレースツール
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            コードを入力して、ステップごとに実行を追跡しましょう。
          </p>
          
          {/* トグルボタン (変更なし) */}
          <div className="mt-6 flex justify-center">
            <div className="bg-gray-200 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setTraceMode('pseudo')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                  traceMode === 'pseudo'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                疑似言語
              </button>
              <button
                onClick={() => setTraceMode('python')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                  traceMode === 'python'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Python
              </button>
            </div>
          </div>
        </header>

        <main>
          {traceMode === 'pseudo' ? (
            <TraceClient />
          ) : (
            <PythonTraceClient />
          )}
        </main>
      </div>
    </div>
  );
};

export default TracePage;