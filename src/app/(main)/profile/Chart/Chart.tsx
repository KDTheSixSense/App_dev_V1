/* === app/(main)/profile/Chart/Chart.tsx === */
'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

// --- 型定義 ---
interface SubjectProgress {
  basicA: number;
  basicB: number;
  appliedMorning: number;
  appliedAfternoon: number;
  programming: number;
}
interface UserStats {
  loginDays: number;
  progress: SubjectProgress;
}
interface ChartProps {
  stats: UserStats | null;
}

const Chart: React.FC<ChartProps> = ({ stats }) => {
  // Propsから渡された動的なデータを使ってチャート用データを作成
  const chartData = stats ? [
    { subject: 'ログイン日数', value: stats.loginDays, fullMark: 7 },
    { subject: '基本A', value: stats.progress.basicA, fullMark: 100 },
    { subject: '基本B', value: stats.progress.basicB, fullMark: 100 },
    { subject: '応用午前', value: stats.progress.appliedMorning, fullMark: 100 },
    { subject: '応用午後', value: stats.progress.appliedAfternoon, fullMark: 100 },
    { subject: 'プログラミング', value: stats.progress.programming, fullMark: 100 },
  ] : [];

  if (!stats) {
    return <div className="text-center p-8">チャートを読み込み中...</div>;
  }

  return (
    <div className="w-full h-[500px] bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">自己分析チャート</h2>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar name="Your Stats" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;