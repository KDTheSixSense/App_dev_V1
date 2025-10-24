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
  Bar,
} from 'recharts';
import { getDailyActivityAction } from '../actions';

// 1. ChartData 型に '完了問題数' を追加
type ChartData = {
  date: string;
  '総獲得XP': number;
  '総学習時間 (分)': number;
  '完了問題数': number;
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
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }} // 右マージン調整
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />

            {/* Y軸（左側）: XP */}
            <YAxis
              yAxisId="left"
              label={{ value: 'XP', angle: -90, position: 'insideLeft', dx: -5 }}
              fontSize={12}
            />

            {/* Y軸（右側）: 時間 と 問題数 */}
            <YAxis
              yAxisId="right"
              orientation="right"
              // ラベルを調整 (両方を示すように)
              label={{ value: '時間(分) / 問題数', angle: 90, position: 'insideRight', dx: 10 }} // dx調整
              fontSize={12}
              // 目盛りの最小間隔を設定 (オプション、重なり防止)
              minTickGap={10}
            />
            <Tooltip />
            <Legend />

            {/* XPのライン */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="総獲得XP"
              name="総獲得XP" // 凡例用に追加
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            {/* 学習時間のライン */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="総学習時間 (分)"
              name="総学習時間 (分)" // 凡例用に追加
              stroke="#82ca9d"
              strokeWidth={2}
            />
            {/* 完了問題数のラインを追加 */}
            <Line
              yAxisId="right" // 右のY軸を使用
              type="monotone"
              dataKey="完了問題数"
              name="完了問題数" // 凡例用に追加
              stroke="#ff7300" // オレンジ色
              strokeWidth={2}
            />
            {/* オプション: 問題数を棒グラフで表示する場合 */}
            {/* <Bar yAxisId="right" dataKey="完了問題数" name="完了問題数" fill="#ffc658" /> */}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}