import Header from '@/components/Header'; // Headerコンポーネントをインポート
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { User, Status_Kohaku } from '@prisma/client';
import React from 'react';
import { ensureDailyMissionProgress } from '@/lib/actions'; // (パスは適宜調整)

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

// User情報とペット情報を結合した新しい型
export type UserWithPetStatus = User & {
  status_Kohaku: Status_Kohaku | null;
};


// MainPagesLayoutを async 関数に変更
export default async function MainPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? Number(session.user.id) : null;

  let userWithPet: UserWithPetStatus | null = null;
  if (userId) {
    await ensureDailyMissionProgress(userId);
    // --- ▼▼▼ ここでUser情報と一緒にペット情報も取得します ▼▼▼ ---
    userWithPet = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        status_Kohaku: true, // ペットのステータスを一緒に取得
      },
    });
  }

  return (
    <>
      {/* 取得したuserオブジェクトをHeaderコンポーネントにpropsとして渡す */}
      <Header userWithPet={userWithPet} />
      <main className="pt-20 flex-grow">{children}</main>
    </>
  );
}
