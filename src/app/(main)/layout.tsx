import Header from '@/components/Header'; // Headerコンポーネントをインポート
import { prisma } from '@/lib/prisma';   // Prisma Clientをインポート
import React from 'react';
import { getAppSession } from '@/lib/auth'; // getAppSessionをインポート

// MainPagesLayoutを async 関数に変更
export default async function MainPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession(); // セッション情報を取得
  let user = null;

  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: {
        id: parseInt(session.user.id, 10), // ログインユーザーのIDを使用
      },
    });
  }

  return (
    <>
      {/* 取得したuserオブジェクトをHeaderコンポーネントにpropsとして渡す */}
      <Header user={user} />
      <main className="pt-20 flex-grow">{children}</main>
    </>
  );
}