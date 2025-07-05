
import Header from '@/components/Header';
import React from 'react';

// レイアウトコンポーネントを通常の同期関数に戻します
export default function MainPagesLayout({
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
      {/* user propには一旦nullを渡します */}
      <Header user={null} />
      <main>{children}</main>
    </>
  );
}
