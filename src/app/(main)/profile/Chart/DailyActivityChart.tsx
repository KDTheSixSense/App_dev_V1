'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getDailyActivityAction } from '../actions';

// サーバーアクションから返されるデータの型
type ChartData = {
  date: string;
  '総獲得XP': number;
  '総学習時間 (分)': number;
};

type Timeframe = 7 | 14 | 30;

export default function DailyActivityChart() {
  const [timeframe, setTimeframe] = useState<Timeframe>(7);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // タイムフレームが変更されたら、サーバーアクションを呼び出す
  useEffect(() => {
    startTransition(async () => {
      setError(null);
      const result = await getDailyActivityAction(timeframe);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setChartData(result.data);
      }
    });
  }, [timeframe]);

  return (
    <div className="w-full h-[450px] bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">学習アクティビティ</h2>
        {/* 期間切り替えボタン */}
        <div className="flex space-x-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeframe(days as Timeframe)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeframe === days
                  ? 'bg-blue-500 text-white font-bold'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {days === 30 ? '1ヶ月' : `${days}日間`}
            </button>
          ))}
        </div>
      </div>

      {/* グラフ本体 */}
      <ResponsiveContainer width="100%" height="85%">
        {isPending ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            データを読み込み中...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            エラー: {error}
          </div>
        ) : (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            {/* Y軸（左側）: XP */}
            <YAxis
              yAxisId="left"
              label={{ value: 'XP', angle: -90, position: 'insideLeft', dx: -5 }}
              fontSize={12}
            />
            {/* Y軸（右側）: 時間 */}
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: '学習時間 (分)', angle: 90, position: 'insideRight', dx: 5 }}
              fontSize={12}
            />
            <Tooltip />
            <Legend />
            {/* XPのライン (スプライン) */}
            <Line
              yAxisId="left"
              type="monotone" // これがスプライン曲線
              dataKey="総獲得XP"
              stroke="#8884d8" // 紫
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            {/* 学習時間のライン (スプライン) */}
            <Line
              yAxisId="right"
              type="monotone" // これがスプライン曲線
              dataKey="総学習時間 (分)"
              stroke="#82ca9d" // 緑
              strokeWidth={2}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}