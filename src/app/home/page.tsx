// app/page.tsx
import Header from './Header'; // 先ほど作成したHeaderコンポーネントを読み込む

export default function Home() {
  return (
    <div className='bg-white'>
      <Header />
      <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          ようこそ！
        </h1>
        <p className="text-xl text-gray-600">
          これはNext.jsアプリの新しいホーム画面です。
        </p>
      </main>
    </div>
  );
}