// src/app/(main)/simulator/page.tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { recordStudyTimeAction, updateLoginStreakAction } from '@/lib/actions';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Play, Trash2, Code } from 'lucide-react';

// BlocklyEditorはクライアントサイド専用のためdynamic importを使用
const BlocklyEditor = dynamic(() => import('@/components/BlocklyEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
      エディタを読み込み中...
    </div>
  ),
});

export default function SimulatorPage() {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'console' | 'code'>('console');

  const [traceStartedAt, setTraceStartedAt] = useState<number | null>(null);
  const hasRecordedTime = useRef(false);

  // 初回マウント時に計測開始
  useEffect(() => {
    setTraceStartedAt(Date.now());
  }, []);

  const recordStudyTime = useCallback(() => {
    if (traceStartedAt !== null && !hasRecordedTime.current) {
      const endTime = Date.now();
      const timeSpentMs = endTime - traceStartedAt;
      if (timeSpentMs > 3000) {
        recordStudyTimeAction(timeSpentMs);
        // ここでは hasRecordedTime.current = true にしない（リセットして計測し直すため）
      }
    }
  }, [traceStartedAt]);

  // アンマウント時に記録
  useEffect(() => {
    return () => { recordStudyTime(); };
  }, [recordStudyTime]);

  // コード変更時のハンドラ
  const handleCodeChange = useCallback((code: string) => {
    setGeneratedCode(code);
  }, []);

  // 実行ボタンのハンドラ
  const handleRunCode = () => {
    setOutputLogs([]); // ログクリア
    setActiveTab('console'); // 実行時はコンソールタブを強制表示

    // 実行時にも学習時間を記録してタイマーリセット
    recordStudyTime();
    setTraceStartedAt(Date.now());
    updateLoginStreakAction(); // ログイン日数を更新

    try {
      // 画面出力用のカスタム関数
      const customLog = (msg: any) => {
        // オブジェクト等が来た場合も見やすく変換
        const text = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
        setOutputLogs((prev) => [...prev, text]);
      };

      // Blockly標準の print ブロックは window.alert を生成するため、
      // 生成されたコード内の alert 呼び出しを独自の関数呼び出しに置換します。
      // ※ window.alert と alert の両方のパターンに対応
      const safeCode = generatedCode
        .replace(/window\.alert\(/g, 'customAlert(')
        .replace(/alert\(/g, 'customAlert(');

      // 安全な実行環境を作成
      // customAlert という名前で上記のログ出力関数を渡します
      const runUserCode = new Function('console', 'customAlert', safeCode);

      // console.log も画面に出るようにオーバーライド
      const customConsole = {
        log: (...args: any[]) => {
          customLog(args.join(' '));
        },
      };

      runUserCode(customConsole, customLog);

      // 成功メッセージ（出力がない場合のみ控えめに表示）
      if (!generatedCode.includes('text_print') && !generatedCode.includes('console.log') && outputLogs.length === 0) {
        // 何も出力命令がない場合は特に何も出さなくてOK（ユーザーの操作感を優先）
      }

    } catch (error: any) {
      setOutputLogs((prev) => [...prev, `❌ エラー: ${error.message}`]);
    }
  };

  return (
    // ワイドにするために max-w の制限を緩和し、paddingを調整
    <div className="h-full bg-[#D3F7FF] p-4 flex flex-col overflow-hidden">
      {/* 画面の高さを最大限使う設定 */}
      <div className="w-full mx-auto h-full flex flex-col gap-4">

        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative overflow-hidden rounded-full border-2 border-cyan-400 shrink-0">
              <Image
                src="/images/Kohaku/kohaku-normal.png"
                alt="コハク"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-700">プログラミングシミュレーター</h1>
              <p className="text-xs text-gray-500">ブロックを組み合わせてプログラムを作ろう！</p>
            </div>
          </div>

          <button
            onClick={handleRunCode}
            className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-lime-500 hover:opacity-90 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-transform transform hover:scale-105 active:scale-95"
          >
            <Play size={20} fill="currentColor" />
            実行する
          </button>
        </div>

        {/* メインエリア：左右分割 */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">

          {/* 左側：Blocklyエディタ (幅を広めに調整) */}
          <div className="flex-grow lg:w-3/4 h-full bg-white rounded-xl shadow-md flex flex-col overflow-hidden relative border border-slate-200">
            <div className="flex-1 relative w-full h-full">
              <BlocklyEditor onCodeChange={handleCodeChange} />
            </div>
          </div>

          {/* 右側：出力コンソール & コードプレビュー (ワンポイント削除分、高さを確保) */}
          <div className="lg:w-1/4 h-full flex flex-col gap-2 min-w-[300px]">

            {/* タブ切り替え */}
            <div className="bg-white rounded-xl shadow-sm p-1 flex shrink-0">
              <button
                onClick={() => setActiveTab('console')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'console'
                  ? 'bg-slate-100 text-slate-700'
                  : 'text-gray-400 hover:bg-gray-50'
                  }`}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                実行結果
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'code'
                  ? 'bg-slate-100 text-slate-700'
                  : 'text-gray-400 hover:bg-gray-50'
                  }`}
              >
                <Code size={16} />
                生成コード
              </button>
            </div>

            {/* コンソール画面 (下部のワンポイントを削除したため、h-fullで高さを埋める) */}
            <div className="flex-1 bg-slate-800 rounded-xl shadow-md overflow-hidden flex flex-col border-4 border-slate-700 min-h-0">
              <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-700 shrink-0">
                <span className="text-xs text-slate-400 font-mono">Console Output</span>
                <button
                  onClick={() => setOutputLogs([])}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  title="ログをクリア"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto font-mono text-sm custom-scrollbar">
                {activeTab === 'console' ? (
                  outputLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50 select-none">
                      <Play size={40} />
                      <p className="text-center text-xs">「実行する」を押すと<br />ここに結果が表示されます</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {outputLogs.map((log, index) => (
                        <div key={index} className="text-green-400 border-b border-slate-700/50 pb-1 last:border-0 break-all">
                          <span className="text-slate-500 mr-2 opacity-50">&gt;</span>
                          {log}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // コードプレビュー表示
                  <pre className="text-blue-300 h-full whitespace-pre-wrap break-all">
                    {generatedCode || '// ブロックを置くと\n// ここにコードが表示されます'}
                  </pre>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}