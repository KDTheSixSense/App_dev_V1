'use client';
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

// レーダーチャートに表示するデータ
const data = [
  { subject: 'プログラミング', A: 120, fullMark: 150 },
  { subject: '経験値', A: 98, fullMark: 150 },
  { subject: '連続ログイン日数', A: 86, fullMark: 150 },
  { subject: 'クエスト完了度', A: 99, fullMark: 150 },
  { subject: 'ランク', A: 85, fullMark: 150 },
  { subject: '正答数', A: 65, fullMark: 150 },
];

// レーダーチャートコンポーネント
const RadarChartComponent = () => {
  return (
    // ResponsiveContainerで親要素のサイズに追従させる
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        <Radar name="Mike" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

const Chart = () => {
  return (
    <div className="w-full max-w-2xl h-[500px] bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">自己分析</h2>
      <RadarChartComponent />
    </div>
  );
};

export default Chart;
