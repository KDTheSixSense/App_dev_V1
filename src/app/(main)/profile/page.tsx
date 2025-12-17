import React from 'react';
import { getAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from './ProfileClient';
import { User } from '@prisma/client';
import { getUserHistory } from './history/actions';

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
export default async function ProfilePage() {
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = session.user.id;

  // --- 1. ユーザー、称号、ペット情報を一括取得 ---
  // セキュリティ対策: password/hashを含めないようにselectを使用
  const userWithDetails = await prisma.user.findUnique({
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
      password: true, // パスワードの有無を確認するために取得 (後で削除)
    },
  }) as any; // セキュリティのためフィールドを制限した結果、型定義(User)と不一致になるためキャスト

  if (!userWithDetails) {
    redirect("/auth/login");
  }

  // パスワードが存在するかどうか（Googleログイン等の場合はnull/undefined想定）
  // 空文字の場合も「パスワードなし」とみなす
  const hasPassword = userWithDetails.password !== null &&
    userWithDetails.password !== undefined &&
    userWithDetails.password !== '';

  console.log(`[ProfilePage] UserID: ${userId}, hasPassword: ${hasPassword} (Value: ${userWithDetails.password === null ? 'null' : typeof userWithDetails.password})`);


  // クライアントに渡す前にpasswordフィールドを削除（セキュリティ対策）
  delete userWithDetails.password;

  // --- 2. チャート用の統計データを取得・計算 ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentLogins = await prisma.loginHistory.findMany({
    where: { userId: userId, loggedInAt: { gte: sevenDaysAgo } },
  });
  const uniqueLoginDates = new Set(recentLogins.map(login => login.loggedInAt.toISOString().split('T')[0]));

  // (ここはダミーデータのため、実際のロジックに置き換えてください)
  const subjectProgress = {
    basicA: 98,
    basicB: 86,
    appliedMorning: 99,
    appliedAfternoon: 85,
    programming: 65,
  };

  const ADVICE_TIMEFRAME_DAYS = 7;
  const jstOffset = 9 * 60 * 60 * 1000;
  const endDate = new Date(Date.now() + jstOffset);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (ADVICE_TIMEFRAME_DAYS - 1));

  const startDateQuery = new Date(startDate.toISOString().split('T')[0]);
  const endDateQuery = new Date(endDate.toISOString().split('T')[0]);

  // 直近7日間の活動を集計
  const activitySummary = await prisma.dailyActivitySummary.aggregate({
    where: {
      userId: userId,
      date: {
        gte: startDateQuery,
        lte: endDateQuery,
      },
    },
    _sum: {
      totalTimeSpentMs: true,  // 合計学習時間 (BigInt)
      problemsCompleted: true, // 合計完了問題数 (Int)
    },
  });

  // BigIntを数値(分)に変換
  const totalStudyTimeMin = Math.floor(Number(activitySummary._sum.totalTimeSpentMs || 0) / 60000);
  const totalProblemsCompleted = activitySummary._sum.problemsCompleted || 0;

  const userStats = {
    loginDays: uniqueLoginDates.size,
    progress: subjectProgress,
    totalStudyTimeMin: totalStudyTimeMin,
    totalProblemsCompleted: totalProblemsCompleted,
    timeframeDays: ADVICE_TIMEFRAME_DAYS,
  };

  // --- 3. AIからのアドバイスを生成 ---
  const aiAdvice = generateAdvice(userStats, userWithDetails);

  // --- 4. 日付型等をシリアライズ（文字列に変換） ---
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

  // --- 6. 問題解答履歴を取得 (追加) ---
  const historyData = await getUserHistory();

  // --- 5. すべてのデータをクライアントコンポーネントに渡す ---
  return (
    <ProfileClient
      initialUser={serializedUser}
      initialStats={userStats}
      aiAdvice={aiAdvice}
      hasPassword={hasPassword}
      initialHistory={historyData}
    />
  );
}