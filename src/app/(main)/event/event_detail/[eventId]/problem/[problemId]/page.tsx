// /workspaces/my-next-app/src/app/(main)/event/[eventId]/problem/[problemId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import React from 'react';

export default function EventProblemAnsweringPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const problemId = params.problemId as string;

  // 実際のアプリケーションでは、ここでproblemIdとeventIdに基づいて問題の詳細をフェッチします。
  // また、問題に解答するためのUI（コードエディタ、選択肢など）と解答提出ロジックを実装します。

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800">イベント問題解答画面</h1>
      <p className="mt-2 text-gray-600">
        イベントID: <span className="font-semibold">{eventId}</span>
      </p>
      <p className="mt-1 text-gray-600">
        問題ID: <span className="font-semibold">{problemId}</span>
      </p>

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700">問題タイトル (仮)</h2>
        <p className="mt-4 text-gray-700">
          ここに問題の詳細、説明、入力例、出力例などが表示されます。
          ユーザーはここでコードを記述したり、選択肢を選んだりして解答を提出します。
        </p>
        <div className="mt-6">
          <textarea
            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={10}
            placeholder="ここにコードを記述してください..."
          ></textarea>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300">
            解答を提出
          </button>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>このページはイベントの問題解答機能のプレースホルダーです。</p>
        <p>実際の機能は、問題の種類（プログラミング、選択など）に応じて実装が必要です。</p>
      </div>
    </div>
  );
}
