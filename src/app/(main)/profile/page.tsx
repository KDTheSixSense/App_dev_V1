import React from 'react';
import { getAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from './ProfileClient';
import { User } from '@prisma/client';

// AIアドバイスを生成するヘルパー関数
type SubjectProgressStats = {
    basicA: number;
    basicB: number;
    appliedMorning: number;
    appliedAfternoon: number;
    programming: number;
};

// ★★★ 2. generateAdvice関数の引数の型を修正 ★★★
// progress: any の代わりに、上で定義した SubjectProgressStats 型を使用する
const generateAdvice = (stats: { loginDays: number; progress: SubjectProgressStats; }, user: User) => {
    if (stats.loginDays < 3) {
        return "最近のログイン日数が少ないようです。毎日少しずつでも学習を続けることが、力になりますよ！";
    }
    if (user.level < 10) {
        return "まずはレベル10を目指しましょう！新しい称号「駆け出し冒険者」があなたを待っています。";
    }
    
    // 型が明確になったため、aとbはnumberとして扱われ、'as number' は不要になる
    const lowestProgress = Object.entries(stats.progress).sort(([, a], [, b]) => a - b)[0];
    
    if (lowestProgress && lowestProgress[1] < 50) {
         const subjectMap: { [key: string]: string } = {
            basicA: '基本情報A問題',
            basicB: '基本情報B問題',
            appliedMorning: '応用情報午前問題',
            appliedAfternoon: '応用情報午後問題',
            programming: 'プログラミング',
        };
        return `${subjectMap[lowestProgress[0]]} の学習が少し遅れているようです。重点的に復習してみましょう！`;
    }
    return "素晴らしい学習ペースです！その調子で頑張りましょう。";
};

/**
 * プロフィールページのサーバーコンポーネント。
 */
export default async function ProfilePage() {
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const userId = Number(session.user.id);

  // --- 1. ユーザー、称号、ペット情報を一括取得 ---
  const userWithDetails = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      unlockedTitles: { include: { title: true } },
      selectedTitle: true,
      status_Kohaku: true, // ★ ペットのステータス情報を追加
    },
  });

  if (!userWithDetails) {
    redirect("/auth/login");
  }

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

  const userStats = {
    loginDays: uniqueLoginDates.size,
    progress: subjectProgress,
  };

  // --- 3. AIからのアドバイスを生成 ---
  const aiAdvice = generateAdvice(userStats, userWithDetails);

  // --- 4. 日付型等をシリアライズ（文字列に変換） ---
  const serializedUser = {
    ...userWithDetails,
    birth: userWithDetails.birth?.toISOString() ?? null,
    lastlogin: userWithDetails.lastlogin?.toISOString() ?? null,
    unlockedTitles: userWithDetails.unlockedTitles.map(ut => ({
      ...ut,
      unlockedAt: ut.unlockedAt.toISOString(),
    })),
    Status_Kohaku: userWithDetails.status_Kohaku, // Add this line to match SerializedUser type
  };

  // --- 5. すべてのデータをクライアントコンポーネントに渡す ---
  return (
    <ProfileClient 
      initialUser={serializedUser} 
      initialStats={userStats} 
      aiAdvice={aiAdvice}
    />
  );
}