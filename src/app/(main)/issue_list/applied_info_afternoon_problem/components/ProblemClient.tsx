import React from 'react';
// ✅ 【修正点】インポート元を、Prismaが自動生成する最新の型定義に変更します
import type { Problem } from '@/lib/types';
import type { VariablesState } from '@/lib/types';

interface VariableTraceControlProps {
  problem: Problem; // 型がPrismaのものに更新されます
  variables: VariablesState;
  onNextTrace: () => void;
  isTraceFinished: boolean;
  onResetTrace: () => void;
  currentTraceLine: number;
  language: 'ja' | 'en';
  textResources: any;
  onSetNum: (num: number) => void;
}

const VariableTraceControl: React.FC<VariableTraceControlProps> = ({
  problem,
  variables,
  onNextTrace,
  isTraceFinished,
  onResetTrace,
  textResources: t,
  onSetNum,
  // currentTraceLineは今回使わないので省略
}) => {
  
  // ✅ 【修正点】データベースの新しいデータの形に合わせて、データの参照方法を変更します
  const showPresets = (problem.traceOptions as { presets?: number[] })?.presets;
  const isNumSet = variables.num !== null;

  return (
    <div className="p-4 flex flex-col items-center">
      <h3 className="text-xl font-bold mb-4 text-gray-800">{t.variableSectionTitle}</h3>
      
      {showPresets && (
        <div className="w-full bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-center font-semibold mb-3 text-gray-700">1. `num` の値を選択</p>
          <div className="flex gap-3 justify-center">
            {showPresets.map((num) => (
              <button key={num} onClick={() => onSetNum(num)} className={`flex-1 px-4 py-2 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105 ${variables.num === num ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-indigo-500 hover:bg-indigo-600'}`}>
                {num}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="w-full mb-6">
        <p className="text-center font-semibold mb-3 text-gray-700">2. 変数の状態</p>
        <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
          {Object.entries(variables).map(([name, value]) => (
            <div key={name} className="flex items-center justify-between bg-white p-2 rounded border">
              <span className="font-semibold mr-2 capitalize">{name}</span>
              <span className="font-mono bg-gray-100 border border-gray-300 px-3 py-1 rounded w-32 text-center overflow-x-auto">{Array.isArray(value) ? `[${value.join(', ')}]` : (value !== null ? value.toString() : '―')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full">
        <p className="text-center font-semibold mb-3 text-gray-700">3. トレース実行</p>
        <div className="flex w-full gap-4">
          <button onClick={onResetTrace} className="flex-1 py-3 px-6 text-xl font-semibold rounded-lg shadow-sm bg-gray-200 text-gray-700 hover:bg-gray-300">
            {t.resetTraceButton}
          </button>
          <button
            onClick={onNextTrace}
            disabled={showPresets ? (!isNumSet || isTraceFinished) : isTraceFinished}
            className={`flex-1 py-3 px-6 text-xl font-semibold text-white rounded-lg shadow-sm transition-colors ${(showPresets ? (!isNumSet || isTraceFinished) : isTraceFinished) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isTraceFinished ? t.traceCompletedButton : t.nextTraceButton}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariableTraceControl;