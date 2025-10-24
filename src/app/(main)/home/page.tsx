import React from "react";
import User from "./user/UserDetail";
import Ranking from "./ranking/Ranking";
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
      <main className="flex justify-center w-full min-h-screen text-center py-10 px-20 gap-10">
        <div className="flex flex-col w-full max-w-150 gap-8">
          <User user={user}/>
          <Ranking userId={userId} />
        </div>
        <div className="flex flex-col w-full max-w-150 gap-10">
          <Pet user={user}/>
          <div className="flex w-full h-120 rounded-lg shadow-lg p-4 justify-center items-center">
            <img src={"/images/coming_soon.png"} alt="Coming Soon" width={500} height={500}/>
          </div>
        </div>
      </main>
    </div>
  );
}
