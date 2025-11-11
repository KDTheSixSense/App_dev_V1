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

  // ログインユーザーの全情報を取得
  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    include: { selectedTitle: true }, // selectedTitleも含めて取得  
  }) : null;

  return (
    <div className='bg-white select-none'>
      <main className="flex flex-col md:flex-row justify-center min-h-screen text-center py-10 px-4 sm:px-6 lg:px-8 gap-10">
        <div className="flex flex-col w-full md:w-1/2 gap-8">
          <User user={user}/>
          <Ranking />
        </div>
        <div className="flex flex-col w-full md:w-1/2 gap-10">
          <Pet user={user}/>
          <Daily />
        </div>
      </main>
    </div>
  );
}
