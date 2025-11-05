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

// --- Type Definitions (unchanged) ---
type ChartData = {
  date: string;
  '獲得XP': number;
  '学習時間 (分)': number;
  '完了問題数': number;
};
type Timeframe = 7 | 14 | 30;
type ActiveMetric = '獲得XP' | '学習時間 (分)' | '完了問題数';

// --- Metrics Config (unchanged) ---
const metricsConfig = {
  '獲得XP': { dataKey: '獲得XP', label: 'XP', stroke: '#8884d8' },
  '学習時間 (分)': { dataKey: '学習時間 (分)', label: '時間(分)', stroke: '#82ca9d' },
  '完了問題数': { dataKey: '完了問題数', label: '問題数', stroke: '#ff7300' },
};

export default function DailyActivityChart() {
  const [timeframe, setTimeframe] = useState<Timeframe>(7);
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('獲得XP');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // --- Data Fetching useEffect (unchanged) ---
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

  const currentMetricConfig = metricsConfig[activeMetric];

  return (
    <div className="w-full h-[450px] bg-white p-6 rounded-lg shadow-lg">
      {/* Header and Buttons (unchanged) */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">学習アクティビティ</h2>
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

      {/* Metric Tabs (unchanged) */}
      <div className="flex space-x-1 mb-4 border-b border-gray-200">
        {(Object.keys(metricsConfig) as ActiveMetric[]).map((metricName) => (
          <button
            key={metricName}
            onClick={() => setActiveMetric(metricName)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeMetric === metricName
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {metricName}
          </button>
        ))}
      </div>

      {/* Modified Chart Area */}
      {/* Keep this div always rendered to provide stable dimensions */}
      <div className="w-full h-[75%]">
        {isPending ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            データを読み込み中...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            エラー: {error}
          </div>
        ) : (
          // Render ResponsiveContainer only when data is ready
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis
                yAxisId="left"
                label={{
                  value: currentMetricConfig.label,
                  angle: -90,
                  position: 'insideLeft',
                  dx: -5
                }}
                fontSize={12}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={currentMetricConfig.dataKey}
                name={currentMetricConfig.dataKey}
                stroke={currentMetricConfig.stroke}
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}