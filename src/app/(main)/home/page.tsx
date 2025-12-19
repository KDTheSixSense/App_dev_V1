import React, { Suspense } from "react";
import User from "./user/UserDetail";
// import Ranking from "./ranking/page"; // Removed
// import Daily from "./daily/page"; // Removed
import RankingSection from "@/components/dashboard/RankingSection";
import DailyMissionSection from "@/components/dashboard/DailyMissionSection";
import Pet from "./components/PetStatus";
import EventCard from "./components/EventCard";
import Evolution from "@/components/evolution";

// --- ▼▼▼ セッション取得用のライブラリをインポート ▼▼▼ ---
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from "@/lib/prisma";
import { getUnsubmittedAssignmentCount, getNextDueAssignment, getUpcomingEvents } from '@/lib/data';

// セッションデータの型を定義
interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }; // 型を修正
}) {

  // --- ▼▼▼ ここでセッションからユーザーIDを取得する ▼▼▼ ---
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? session.user.id : null;

  // データを並列で取得してパフォーマンスを向上
  const [assignmentCount, nextAssignment, upcomingEvents] = await Promise.all([
    getUnsubmittedAssignmentCount(),
    getNextDueAssignment(), // 次の課題を取得
    getUpcomingEvents(),
  ]);

  // ログインユーザーの全情報を取得 (セキュリティ対策: password/hashを除外)
  const user = userId ? await prisma.user.findUnique({
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
      totallogin: true,
      selectedTitle: true,
      status_Kohaku: true, // Petコンポーネントで必要
      // 進化判定用に科目の進捗を取得 (テーブル名やリレーション名は環境に合わせて調整してください)
      progresses: {
        select: {
          level: true,
          subject: {
            select: {
              name: true
            }
          }
        }
      },
      isAdmin: true, // UserDetailでAdminバッジを表示するために必要
    }
  }) as any : null;

  // SubjectProgress形式に変換
  const subjectProgress = user?.progresses?.map((us: any) => ({
    subjectName: us.subject.name,
    level: us.level
  })) || [];

  const LoadingSkeleton = () => (
    <div className="bg-[#e0f4f9] rounded-3xl p-6 shadow-sm min-h-[400px] h-full animate-pulse flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className='bg-white select-none min-h-screen'>
      {/* 進化エフェクトコンポーネントを配置 */}
      {user && (
        <Evolution
          userLevel={user.level}
          subjectProgress={subjectProgress}
        />
      )}

      {/* Main Layout Grid */}
      <main className="max-w-[1920px] mx-auto p-6 md:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Left Column: Ranking (3 cols) */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1 h-full">
            <Suspense fallback={<LoadingSkeleton />}>
              <RankingSection />
            </Suspense>
          </div>

          {/* Center Column: Pet, Tasks, Events (6 cols) */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col h-full gap-6">
            {/* 1. Pet Status (Large) */}
            <div className="shrink-0">
              <Pet user={user} assignmentCount={assignmentCount} nextAssignment={nextAssignment} subjectProgress={subjectProgress} />
            </div>
            {/* 2. Events */}
            <div className="flex-1 min-h-0">
                <EventCard events={upcomingEvents}  /> 
            </div>          
          </div>

          {/* Right Column: Profile, Daily Missions (3 cols) */}
          <div className="lg:col-span-3 space-y-6 order-3 lg:order-3 h-full flex flex-col">
            {/* 1. User Profile */}
            <User user={user} unsubmittedAssignmentCount={assignmentCount} />

            {/* 2. Daily Missions */}
            <div className="flex-1">
              <Suspense fallback={<LoadingSkeleton />}>
                <DailyMissionSection />
              </Suspense>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
