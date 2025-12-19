//app/(main)/profile/page.tsx

import React, { Suspense } from 'react';
import { getAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from './ProfileClient';
import { User } from '@prisma/client';
import ProfileHistorySection from '@/components/profile/ProfileHistorySection';

// AIアドバイスを生成するヘルパー関数
type SubjectProgressStats = {
  basicA: number;
  basicB: number;
  appliedMorning: number;
  appliedAfternoon: number;
  programming: number;
};

// generateAdvice に渡す新しい統計データの型
type ActivityStats = {
  loginDays: number;
  progress: SubjectProgressStats; // 既存のダミーデータ
  totalStudyTimeMin: number;     // [追加] 合計学習時間 (分)
  totalProblemsCompleted: number; // [追加] 合計完了問題数
  timeframeDays: number;          // [追加] 集計期間 (例: 7日間)
};

/**
 * 配列からランダムに1つのメッセージを選ぶヘルパー関数
 */
const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * AIアドバイスを生成するヘルパー関数 (新ロジック)
 */
const generateAdvice = (stats: ActivityStats, user: User): string => {
  // --- 優先度1: 基本的なチェック (既存ロジック) ---
  if (stats.loginDays < 3) {
    return "最近のログイン日数が少ないようです。毎日少しずつでも学習を続けることが、力になりますよ！";
  }
  if (user.level < 10) {
    return "まずはレベル10を目指しましょう！新しい称号「駆け出し冒険者」があなたを待っています。";
  }

  // --- 優先度2: グラフデータに基づく新しいアドバイス ---
  const { totalStudyTimeMin, totalProblemsCompleted, timeframeDays } = stats;

  // ご要望の閾値
  const TIME_THRESHOLD_MIN = 30;
  const PROBLEM_THRESHOLD_COUNT = 30;

  // 励ましのメッセージパターン (5個)
  const encouragementMessages = [
    `ここ${timeframeDays}日間の学習時間は${totalStudyTimeMin}分、完了問題数は${totalProblemsCompleted}問です。まずは${TIME_THRESHOLD_MIN}分以上の学習を目指してみませんか？`,
    `学習お疲れ様です。学習時間が${totalStudyTimeMin}分、完了問題が${totalProblemsCompleted}問のようです。次は${PROBLEM_THRESHOLD_COUNT}問クリアを目標に頑張りましょう！`,
    `素晴らしいスタートです！次は${TIME_THRESHOLD_MIN}分以上の学習と、${PROBLEM_THRESHOLD_COUNT}問以上のクリアを目標にしてみましょう。`,
    `ここ${timeframeDays}日間で${totalProblemsCompleted}問解けましたね！次はもっと多くの問題に挑戦して、知識を定着させましょう。`,
    `学習時間が${totalStudyTimeMin}分でした。毎日コツコツと時間を増やすことが、大きな力になりますよ！`
  ];

  // 称賛のメッセージパターン (5個)
  const praiseMessages = [
    `すごい！ここ${timeframeDays}日間で${totalStudyTimeMin}分も学習し、${totalProblemsCompleted}問も問題を解きましたね！この調子です！`,
    `学習時間${totalStudyTimeMin}分、完了問題${totalProblemsCompleted}問！素晴らしいペースです。自信を持って次に進みましょう！`,
    `着実に力がついていますね。${totalProblemsCompleted}問もクリアするなんてすごいです。その努力、コハクも見ていますよ！`,
    `非常に順調です！${totalStudyTimeMin}分も集中して学習できています。次のレベルアップも近いですね！`,
    `完璧な学習サイクルです！${totalStudyTimeMin}分の学習と${totalProblemsCompleted}問の達成、お見事です！`
  ];

  // ロジック分岐: (時間 < 30) AND (問題数 < 30) かどうか
  if (totalStudyTimeMin < TIME_THRESHOLD_MIN && totalProblemsCompleted < PROBLEM_THRESHOLD_COUNT) {
    // 両方の閾値を下回る場合 -> 励ましのメッセージ
    return getRandomMessage(encouragementMessages);
  } else {
    // どちらか一方でも閾値を超えている場合 -> 称賛のメッセージ
    return getRandomMessage(praiseMessages);
  }
};

/**
 * プロフィールページのサーバーコンポーネント。
 */
import { getDailyActivityStats } from "@/lib/data";

// ... (existing imports, but remove direct aggregate usage if possible or keep logic clean)

// ...

export default async function ProfilePage() {
  const session = await getAppSession();
  // ... check session ...
  if (!session?.user) {
    redirect("/auth/login");
  }
  const userId = session.user.id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const ADVICE_TIMEFRAME_DAYS = 7;

  // --- 並列取得 ---
  // activityStatsData (array) を取得
  const [userWithDetails, recentLogins, activityStatsData] = await Promise.all([
    // 1. ユーザー情報
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        level: true,
        xp: true,
        icon: true,
        class: true,
        year: true,
        birth: true,
        lastlogin: true,
        continuouslogin: true,
        isAgreedToTerms: true,
        isAgreedToPrivacyPolicy: true,
        unlockedTitles: { include: { title: true } },
        selectedTitle: true,
        status_Kohaku: true,
        password: true,
      },
    }) as Promise<any>,

    // 2. 直近のログイン履歴
    prisma.loginHistory.findMany({
      where: { userId: userId, loggedInAt: { gte: sevenDaysAgo } },
    }),

    // 3. 活動詳細データ (7日間) -> チャートの初期データと集計用
    getDailyActivityStats(userId, ADVICE_TIMEFRAME_DAYS),
  ]);

  if (!userWithDetails) {
    redirect("/auth/login");
  }

  // --- データ処理 ---

  // パスワードチェック
  const hasPassword = userWithDetails.password !== null &&
    userWithDetails.password !== undefined &&
    userWithDetails.password !== '';

  // セキュリティ対策: パスワード削除
  delete userWithDetails.password;

  // ログイン日数計算
  const uniqueLoginDates = new Set(recentLogins.map(login => login.loggedInAt.toISOString().split('T')[0]));

  // 学習時間・完了数計算 (ChartData配列から合算)
  let totalStudyTimeMin = 0;
  let totalProblemsCompleted = 0;

  if (activityStatsData && Array.isArray(activityStatsData)) {
    activityStatsData.forEach(day => {
      totalStudyTimeMin += day['学習時間 (分)'] || 0;
      totalProblemsCompleted += day['完了問題数'] || 0;
    });
  }

  // ... (dummy subjectProgressData) ...
  const subjectProgressData = {
    basicA: 98,
    basicB: 86,
    appliedMorning: 99,
    appliedAfternoon: 85,
    programming: 65,
  };

  // ... (subjectProgressList) ...
  const subjectProgressList = [
    { subjectName: '基本A', level: subjectProgressData.basicA },
    { subjectName: '基本B', level: subjectProgressData.basicB },
    { subjectName: '応用午前', level: subjectProgressData.appliedMorning },
    { subjectName: '応用午後', level: subjectProgressData.appliedAfternoon },
    { subjectName: 'プログラム', level: subjectProgressData.programming },
  ];

  const userStats = {
    loginDays: uniqueLoginDates.size,
    progress: subjectProgressData,
    totalStudyTimeMin: totalStudyTimeMin,
    totalProblemsCompleted: totalProblemsCompleted,
    timeframeDays: ADVICE_TIMEFRAME_DAYS,
  };

  const aiAdvice = generateAdvice(userStats, userWithDetails);

  const serializedUser = {
    ...userWithDetails,
    birth: userWithDetails.birth?.toISOString() ?? null,
    lastlogin: userWithDetails.lastlogin?.toISOString() ?? null,
    unlockedTitles: userWithDetails.unlockedTitles.map((ut: any) => ({
      ...ut,
      unlockedAt: ut.unlockedAt.toISOString(),
    })),
    status_Kohaku: userWithDetails.status_Kohaku ?? null,
  };

  return (
    <ProfileClient
      initialUser={serializedUser}
      initialStats={userStats}
      aiAdvice={aiAdvice}
      hasPassword={hasPassword}
      initialSubjectProgress={subjectProgressList}
      initialChartData={activityStatsData}
    >
      <div className="lg:col-span-3">
        <Suspense fallback={
          <div className="bg-white p-6 rounded-lg shadow-lg animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        }>
          <ProfileHistorySection />
        </Suspense>
      </div>
    </ProfileClient>
  );
}