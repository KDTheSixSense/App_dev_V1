'use client';

import React, { useState, useCallback } from 'react';
// AIコード生成をサーバー側で安全に行うための関数をインポートします
import { generateTraceCodeFromAI } from '@/lib/actions/traceActions';

// --- サンプルコード (whileループの例を追加) ---
const sampleCode = `整数型: counter
counter ← 3

while (counter > 0)
  出力する counter
  counter ← counter - 1
endwhile

出力する "ループが終了しました"
`;

// --- 初期変数のサンプル (JSON形式) ---
const sampleInitialVars = `{
  "counter": 0
}`;

// --- 型定義 ---
interface ForLoopInfo {
  type: 'for';
  loopVar: string;
  endVal: number;
  step: number;
  startLine: number;
  endLine: number;
}

interface WhileLoopInfo {
    type: 'while';
    startLine: number;
    endLine: number;
}

type LoopInfo = ForLoopInfo | WhileLoopInfo;


/**
 * トレース機能のUIとロジック全体を管理するクライアントコンポーネント
 */
const TraceClient = () => {
  // --- 状態管理 ---
  const [code, setCode] = useState(sampleCode);
  const [initialVarsString, setInitialVarsString] = useState(sampleInitialVars);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [programLines, setProgramLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(-1);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTraceStarted, setIsTraceStarted] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('カウンターが0になるまでデクリメントする');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loopStack, setLoopStack] = useState<LoopInfo[]>([]);


  // --- ヘルパー関数 ---
  const evaluateExpression = (expression: string, currentVars: Record<string, any>): any => {
    expression = expression.trim();
    if (!isNaN(Number(expression))) return Number(expression);
    if (expression.startsWith('"') && expression.endsWith('"')) return expression.slice(1, -1);
    if (currentVars.hasOwnProperty(expression)) return currentVars[expression];
    
    const operators = ['+', '-', '*', '/'];
    for (const op of operators) {
        const parts = expression.split(op);
        if (parts.length > 1) {
            const lhs = evaluateExpression(parts[0], currentVars);
            const rhs = evaluateExpression(parts.slice(1).join(op), currentVars);
            if (typeof lhs === 'number' && typeof rhs === 'number') {
                switch(op) {
                    case '+': return lhs + rhs;
                    case '-': return lhs - rhs;
                    case '*': return lhs * rhs;
                    case '/': return lhs / rhs;
                }
            } else {
                 throw new Error(`数値以外の値 (${lhs}, ${rhs}) に演算子'${op}'は使えません。`);
            }
        }
    }
    throw new Error(`式 "${expression}" を評価できません。`);
  };
  
  const evaluateCondition = (condition: string, currentVars: Record<string, any>): boolean => {
      const operators = ['>=', '<=', '>', '<', '==', '!='];
      for (const op of operators) {
          const parts = condition.split(op);
          if (parts.length === 2) {
              const lhs = evaluateExpression(parts[0], currentVars);
              const rhs = evaluateExpression(parts[1], currentVars);
              switch(op) {
                  case '>': return lhs > rhs;
                  case '<': return lhs < rhs;
                  case '>=': return lhs >= rhs;
                  case '<=': return lhs <= rhs;
                  case '==': return lhs == rhs;
                  case '!=': return lhs != rhs;
              }
          }
      }
      throw new Error(`条件式 "${condition}" を評価できません。`);
  };

  const findBlockEnd = (startLine: number, blockStart: string, blockEnd: string, alternateEnd?: string) => {
    let depth = 1;
    for (let i = startLine + 1; i < programLines.length; i++) {
        const line = programLines[i].trim();
        if (line.startsWith(blockStart)) depth++;
        else if (line.startsWith(blockEnd)) {
            depth--;
            if (depth === 0) return i;
        } else if (alternateEnd && depth === 1 && line.startsWith(alternateEnd)) {
            return i;
        }
    }
    return -1;
  };

  // --- トレース実行エンジン ---
  const handleNextStep = useCallback(() => {
    if (!isTraceStarted || currentLine >= programLines.length) {
        if (currentLine >= programLines.length) setIsTraceStarted(false);
        return;
    }

    let nextLine = currentLine; // 現在行からスタート
    let tempVariables = { ...variables };
    let tempLoopStack = [...loopStack];

    try {
        setError(null);
        let processing = true;
        
        // 意味のある行（代入、出力、ループの終了など）に到達するまで内部的に処理を進める
        while(processing) {
            const line = programLines[nextLine]?.trim();

            if (nextLine >= programLines.length) {
                processing = false;
                setIsTraceStarted(false);
                break;
            }

            if (!line) { // 空行はスキップ
                nextLine++;
                continue;
            }

            const currentLoop = tempLoopStack.length > 0 ? tempLoopStack[tempLoopStack.length - 1] : null;
            const forMatch = line.match(/for\s*\((.+)\s*を\s*(.+)\s*から\s*(.+)\s*まで/);
            const whileMatch = line.match(/while\s*\((.*)\)/);
            
            if (line.startsWith('endfor')) {
                if (currentLoop?.type === 'for' && currentLoop.endLine === nextLine) {
                    tempVariables[currentLoop.loopVar] += currentLoop.step;
                    nextLine = currentLoop.startLine; // ループの先頭に戻って再評価
                } else {
                    throw new Error("'for'に対応しない 'endfor' です。");
                }
            } else if (line.startsWith('endwhile')) {
                if (currentLoop?.type === 'while' && currentLoop.endLine === nextLine) {
                    nextLine = currentLoop.startLine; // ループの先頭に戻って再評価
                } else {
                    throw new Error("'while'に対応しない 'endwhile' です。");
                }
            } else if (forMatch) {
                const loopVar = forMatch[1].trim();
                if (currentLoop?.type === 'for' && currentLoop.startLine === nextLine) { // ループ継続判定
                    if (tempVariables[loopVar] <= currentLoop.endVal) {
                        nextLine++; // ループブロック内へ
                    } else {
                        tempLoopStack.pop();
                        nextLine = currentLoop.endLine + 1; // ループ終了
                    }
                } else { // 新規ループ開始
                    const startVal = evaluateExpression(forMatch[2], tempVariables);
                    const endVal = evaluateExpression(forMatch[3], tempVariables);
                    const endLine = findBlockEnd(nextLine, 'for', 'endfor');
                    if (endLine === -1) throw new Error("対応する 'endfor' が見つかりません。");
                    tempVariables[loopVar] = startVal;
                    if (startVal <= endVal) {
                        tempLoopStack.push({ type: 'for', loopVar, endVal, step: 1, startLine: nextLine, endLine });
                        nextLine++;
                    } else {
                        nextLine = endLine + 1;
                    }
                }
            } else if (whileMatch) {
                const condition = whileMatch[1];
                if (!currentLoop || currentLoop.type !== 'while' || currentLoop.startLine !== nextLine) {
                    const endLine = findBlockEnd(nextLine, 'while', 'endwhile');
                    if (endLine === -1) throw new Error("対応する 'endwhile' が見つかりません。");
                    tempLoopStack.push({ type: 'while', startLine: nextLine, endLine });
                }
                if (evaluateCondition(condition, tempVariables)) {
                    nextLine++;
                } else {
                    const finishedLoop = tempLoopStack.pop();
                    nextLine = finishedLoop ? finishedLoop.endLine + 1 : nextLine + 1;
                }
            } else if (line.startsWith('if')) {
                const conditionMatch = line.match(/if\s*\((.*)\)/);
                if (!conditionMatch) throw new Error("無効なif文です。例: if (x > 10)");
                if (evaluateCondition(conditionMatch[1], tempVariables)) {
                    nextLine++;
                } else {
                    const elseIndex = findBlockEnd(nextLine, 'if', 'endif', 'else');
                    if(elseIndex === -1) throw new Error("対応する 'else' または 'endif' が見つかりません。");
                    nextLine = programLines[elseIndex]?.trim().startsWith('else') ? elseIndex + 1 : elseIndex;
                }
            } else if (line.startsWith('else')) {
                const endifIndex = findBlockEnd(nextLine - 1, 'if', 'endif'); 
                if(endifIndex === -1) throw new Error("対応する 'endif' が見つかりません。");
                nextLine = endifIndex + 1;
            } else { // 通常の実行行
                if (line.match(/^(整数型|文字列型|配列型):/)) {
                    const declaredVars = line.split(':')[1].split(',').map(v => v.trim());
                    declaredVars.forEach(v => {
                        if (!(v in tempVariables)) tempVariables[v] = null;
                    });
                } else if (line.includes('←')) {
                    const parts = line.split('←');
                    const varName = parts[0].trim();
                    tempVariables[varName] = evaluateExpression(parts[1], tempVariables);
                } else if (line.startsWith('出力する')) {
                    const value = evaluateExpression(line.substring('出力する'.length), tempVariables);
                    setOutput(prev => [...prev, String(value)]);
                }
                processing = false; // 実行行に到達したので内部ループを抜ける
                nextLine++;
            }
        }

        // 状態を一括で更新
        setVariables(tempVariables);
        setLoopStack(tempLoopStack);
        setCurrentLine(nextLine-1); // 次に実行される行を指す

    } catch (e: any) {
        setError(`エラー (行 ${nextLine + 1}): ${e.message}`);
        setIsTraceStarted(false);
    }

  }, [isTraceStarted, currentLine, programLines, variables, loopStack]);


  // --- UIイベントハンドラ ---
  const handleStartTrace = () => {
    try {
      setError(null);
      const parsedVars = initialVarsString.trim() ? JSON.parse(initialVarsString) : {};
      setVariables(parsedVars);
      const lines = code.split('\n');
      setProgramLines(lines);
      // 最初の意味のある行を探す
      let firstLine = 0;
      while(firstLine < lines.length && !lines[firstLine].trim()) {
        firstLine++;
      }
      setCurrentLine(firstLine);
      setOutput([]);
      setLoopStack([]);
      setIsTraceStarted(true);
    } catch (e) {
      setError('初期変数のJSON形式が正しくありません。');
    }
  };

  const handleReset = () => {
    setIsTraceStarted(false);
    setCurrentLine(-1);
    setProgramLines([]);
    setVariables({});
    setOutput([]);
    setError(null);
    setLoopStack([]);
  };

  const handleGenerateCode = async () => {
      if (!aiPrompt) {
        setError("AIへの指示を入力してください。");
        return;
      }
      setIsGenerating(true);
      setError(null);
      try {
        const generatedText = await generateTraceCodeFromAI(aiPrompt);
        setCode(generatedText);
      } catch (error: any) {
        setError(`AIコード生成エラー: ${error.message}`);
      } finally {
        setIsGenerating(false);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左パネル: 設定 */}
      <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col">
        <div className="mb-6">
            <label htmlFor="ai-prompt" className="block text-lg font-semibold mb-2 text-gray-700">
                AIでコードを生成
            </label>
            <div className="flex space-x-2">
                <input
                    id="ai-prompt"
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-grow p-3 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 1から10までの合計を計算する"
                    disabled={isGenerating || isTraceStarted}
                />
                <button
                    onClick={handleGenerateCode}
                    disabled={isGenerating || isTraceStarted}
                    className="py-3 px-5 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition"
                >
                    {isGenerating ? '生成中...' : '生成'}
                </button>
            </div>
        </div>
        
        <div className="flex-grow">
          <label htmlFor="code-input" className="block text-lg font-semibold mb-2 text-gray-700">
            1. 疑似言語コード
          </label>
          <textarea
            id="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-80 p-3 font-mono text-sm border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500"
            placeholder="ここにトレースしたいコードを入力します..."
            disabled={isTraceStarted}
          />
        </div>
        <div className="mt-6">
          <label htmlFor="vars-input" className="block text-lg font-semibold mb-2 text-gray-700">
            2. 初期変数 (JSON形式)
          </label>
          <textarea
            id="vars-input"
            value={initialVarsString}
            onChange={(e) => setInitialVarsString(e.target.value)}
            className="w-full h-24 p-3 font-mono text-sm border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500"
            placeholder='例: { "a": 10, "b": "hello" }'
            disabled={isTraceStarted}
          />
        </div>
        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleStartTrace}
            disabled={isTraceStarted}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            トレース開始
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-3 px-4 bg-gray-600 text-white font-bold rounded-md hover:bg-gray-700 transition"
          >
            リセット
          </button>
        </div>
      </div>

      {/* 右パネル: 実行結果 */}
      <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col">
        <button
          onClick={handleNextStep}
          disabled={!isTraceStarted || currentLine >= programLines.length}
          className="w-full mb-6 py-3 px-4 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          {currentLine >= programLines.length ? 'トレース完了' : '次のステップ'}
        </button>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{error}</div>}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">トレース画面</h3>
          <div className="bg-gray-800 text-white font-mono text-sm p-4 rounded-md h-72 overflow-y-auto">
            {programLines.map((line, index) => (
              <div key={index} className={`whitespace-pre ${index === currentLine ? 'bg-blue-500' : ''}`}>
                <span className="text-gray-500 select-none w-8 inline-block">{index + 1}</span>
                {line || ' '}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">変数</h3>
          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 border rounded-md min-h-[96px]">
            {Object.keys(variables).length > 0 ? (
                Object.entries(variables).map(([name, value]) => (
                <div key={name} className="flex items-center">
                    <span className="font-semibold mr-2">{name}:</span>
                    <span className="font-mono text-blue-600">{JSON.stringify(value)}</span>
                </div>
                ))
            ) : (
                <p className="text-gray-500 text-sm col-span-2">トレースが開始されていません。</p>
            )}
          </div>
        </div>

        <div className="flex-grow flex flex-col">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">出力</h3>
          <div className="flex-grow p-4 bg-gray-900 text-green-400 font-mono text-sm border rounded-md min-h-[96px]">
            {output.length > 0 ? (
                output.map((line, index) => (
                <div key={index}>{`> ${line}`}</div>
                ))
            ) : (
                <p className="text-gray-500 text-sm">まだ出力はありません。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceClient;

