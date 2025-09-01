import React from "react";
import UserDetail from "./user/UserDetail";
import RankingPage from "./ranking/page";
import Pet from "./Pet/PetStatus";
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
  searchParams: { subject?: string };
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
    <div className='bg-white'>
      <main className="flex justify-center w-full min-h-screen text-center pt-10 px-20 gap-10">
        <div className="flex flex-col w-full max-w-lg gap-8">
          <UserDetail user={user}/>
          {/* --- ▼▼▼ RankingPageにuserIdも渡す ▼▼▼ --- */}
          <RankingPage searchParams={searchParams} userId={userId} />
        </div>
        <div className="flex flex-col w-full max-w-lg">
          <Pet />
        </div>
      </main>
    </div>
  );
}
