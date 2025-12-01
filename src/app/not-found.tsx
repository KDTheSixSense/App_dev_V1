import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#D3F7FF] flex flex-col items-center justify-center text-slate-700 p-4">
      {/* コハクのアイコン（困り顔があればそれがベストですが、なければ通常のもので） */}
      <div className="relative w-24 h-24 mb-6">
        <Image
          src="/images/Kohaku/kohaku-starving.png" // もしくは kohaku-normal.png
          alt="404 Kohaku"
          fill
          className="object-cover rounded-full border-4 border-white shadow-lg"
        />
      </div>

      <h2 className="text-4xl font-bold mb-2 text-[#575E75]">404 Not Found</h2>
      <p className="text-lg mb-8 text-center text-slate-600 font-bold">
        お探しのページは見つかりませんでした。<br />
        削除されたか、URLが間違っている可能性があります。
      </p>

      <Link
        href="/home"
        className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105"
      >
        ホームに戻る
      </Link>
    </div>
  );
}