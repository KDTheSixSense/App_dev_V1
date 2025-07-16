import Header from '@/components/Header'; // Headerコンポーネントをインポート
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}
import React from 'react';

// MainPagesLayoutを async 関数に変更
export default async function MainPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // 1. cookies()をawaitで取得します
  const cookieStore = await cookies();
  
  // 2. getIronSessionに<SessionData>という型を明示的に渡します
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  // 3. セッション、またはセッション内のユーザー情報がなければ、ここで処理を中断します
  if (!session.user?.id) {
    return <div>ログインしていません。</div>;
  }

  // 4. DBからユーザー情報を取得します。型は PrismaのUser型またはnullになります
  const user: User | null = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
  });

  // 5. DBから取得したユーザーが見つからない場合も、ここで処理を中断します
  if (!user) {
    return <div>ユーザーが見つかりません。</div>;
  }

  return (
    <>
      {/* 取得したuserオブジェクトをHeaderコンポーネントにpropsとして渡す */}
      <Header user={user} />
      <main className="pt-20 flex-grow">{children}</main>
    </>
  );
}