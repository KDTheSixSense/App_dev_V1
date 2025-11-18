import React from "react";
import User from "./user/UserDetail";
import Ranking from "./ranking/page";
import Pet from "./Pet/PetStatus";
import Daily from "./daily/page";
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
  const userId = session.user?.id ? Number(session.user.id) : null;
  const assignmentCount = await getUnsubmittedAssignmentCount();

  // ログインユーザーの全情報を取得
  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    include: { selectedTitle: true }, // selectedTitleも含めて取得  
  }) : null;

  return (
    <div className='bg-white select-none'>
      <main className="grid grid-cols-1 md:grid-cols-2 justify-center min-h-screen text-center py-10 px-4 sm:px-6 lg:px-8 gap-10">
        <div className="order-1 md:col-start-1 md:row-start-1">
          <User user={user} unsubmittedAssignmentCount={assignmentCount}/>
        </div>
        <div className="order-4 md:col-start-1 md:row-start-2">
          <Ranking />
        </div>
        <div className="order-2 md:col-start-2 md:row-start-1">
          <Pet user={user}/>
        </div>
        <div className="order-3 md:col-start-2 md:row-start-2">
          <Daily />
        </div>
      </main>
    </div>
  );
}
