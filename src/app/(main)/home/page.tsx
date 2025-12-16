//app/(main)/home/page.tsx

import React from "react";
import User from "./user/UserDetail";
import Ranking from "./ranking/page";
import Pet from "./Pet/PetStatus";
import Daily from "./daily/page";
import DueTasksCard from "./components/DueTasksCard";
import EventCard from "./components/EventCard";

// --- ▼▼▼ セッション取得用のライブラリをインポート ▼▼▼ ---
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from "@/lib/prisma";
import { getUnsubmittedAssignmentCount, getNextDueAssignment } from '@/lib/data';
import Evolution from '@/components/evolution';

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
  searchParams: any; // 型を修正
}) {

  // --- ▼▼▼ ここでセッションからユーザーIDを取得する ▼▼▼ ---
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? session.user.id : null;
  const assignmentCount = await getUnsubmittedAssignmentCount();
  const nextAssignment = await getNextDueAssignment(); // 次の課題を取得

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
      progresses: {
        select: {
          level: true,
          subject: {
            select: {
              name: true
            }
          }
        }
      }
    }
  }) as any : null;

  const subjectProgress = user?.progresses?.map((p: any) => ({
    subjectName: p.subject.name,
    level: p.level
  })) || [];

  return (
    <div className='bg-white select-none min-h-screen'>
      {/* Main Layout Grid */}
      <main className="max-w-[1920px] mx-auto p-6 md:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Left Column: Ranking (3 cols) */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            <Ranking />
          </div>

          {/* Center Column: Pet, Tasks, Events (6 cols) */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            {/* 1. Pet Status (Large) */}
            <Pet user={user} />

            {/* 2. Due Tasks */}
            <DueTasksCard count={assignmentCount} nextAssignment={nextAssignment} />

            {/* 3. Events */}
            <EventCard />
          </div>

          {/* Right Column: Profile, Daily Missions (3 cols) */}
          <div className="lg:col-span-3 space-y-6 order-3 lg:order-3 h-full flex flex-col">
            {/* 1. User Profile */}
            <User user={user} unsubmittedAssignmentCount={assignmentCount} />

            {/* 2. Daily Missions */}
            <div className="flex-1">
              <Daily />
            </div>
          </div>

          <div className='bg-white select-none'>
            {user && (
              <Evolution userLevel={user.level} subjectProgress={subjectProgress} className="fixed inset-0 z-50 pointer-events-none" />
            )}
            <main className="grid grid-cols-1 md:grid-cols-2 justify-center min-h-screen text-center py-10 px-4 sm:px-6 lg:px-8 gap-10">
              <div className="order-1 md:col-start-1 md:row-start-1">
                <User user={user} unsubmittedAssignmentCount={assignmentCount} />
              </div>
              <div className="order-4 md:col-start-1 md:row-start-2">
                <Ranking />
              </div>
              <div className="order-2 md:col-start-2 md:row-start-1">
                <Pet user={user} />
              </div>
              <div className="order-3 md:col-start-2 md:row-start-2">
                <Daily />
              </div>
            </main>
          </div>
          );
}
