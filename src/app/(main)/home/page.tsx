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
