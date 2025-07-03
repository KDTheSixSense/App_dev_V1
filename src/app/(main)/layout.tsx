
import Header from '@/components/Header';
import React from 'react';

// レイアウトコンポーネントを通常の同期関数に戻します
export default function MainPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 非同期のデータ取得処理を削除します
  // const user = await prisma.user.findUnique(...);

  return (
    <>
      {/* user propには一旦nullを渡します */}
      <Header user={null} />
      <main>{children}</main>
    </>
  );
}
