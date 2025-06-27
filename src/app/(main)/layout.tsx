import Header from '../Header'; // Headerコンポーネントをインポート

export default function MainPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}