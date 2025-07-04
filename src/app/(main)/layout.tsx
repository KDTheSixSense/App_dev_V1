import Header from '@/components/Header'; // Headerコンポーネントをインポート
import { prisma } from '@/lib/prisma';   // Prisma Clientをインポート
import React from 'react';

// MainPagesLayoutを async 関数に変更
export default async function MainPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // --- ここでID=1のユーザーデータを取得 ---
  // (将来的には、ここで認証情報からログインユーザーを取得する形になる予定)
  const user = await prisma.user.findUnique({
    where: {
      id: 4, // 特別なユーザーIDを指定
    },
  });

  return (
    <>
      {/* 取得したuserオブジェクトをHeaderコンポーネントにpropsとして渡す */}
      <Header user={user} />
      <main>{children}</main>
    </>
  );
}