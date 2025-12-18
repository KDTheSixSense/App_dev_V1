import React from "react";
import User from "./user/UserDetail";
import Ranking from "./ranking/page";
import Pet from "./Pet/PetStatus";
import Daily from "./daily/page";
import DueTasksCard from "./components/DueTasksCard";
import EventCard from "./components/EventCard";
import Evolution from "@/components/evolution";

// --- ▼▼▼ セッション取得用のライブラリをインポート ▼▼▼ ---
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from "@/lib/prisma";
import { getUnsubmittedAssignmentCount } from '@/lib/data';

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
  const nextAssignment = null; // await getNextDueAssignment(); // 次の課題を取得 (未実装のため無効化)

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
      }
    }
  }) as any : null;

  // SubjectProgress形式に変換
  const subjectProgress = user?.progresses?.map((us: any) => ({
    subjectName: us.subject.name,
    level: us.level
  })) || [];

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Left Column: Ranking (3 cols) */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            <Ranking />
          </div>

          {/* Center Column: Pet, Tasks, Events (6 cols) */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            {/* 1. Pet Status (Large) */}
            <Pet user={user} subjectProgress={subjectProgress} />

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

        </div>
      </main>
    </div>
  );
}
