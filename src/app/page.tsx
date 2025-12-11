import { BUTTON_CLASS_NAME } from 'ace-builds/src-noconflict/ext-command_bar';
import Image from 'next/image';
import Link from 'next/link';


export default function LandingPage() {
  return (
    
    <main 
      className="relative min-h-screen w-full overflow-hidden text-white selection:bg-cyan-500 selection:text-slate-900"
    >
      {/* Background Image */}
      <Image
        src="/images/Infopia_Background.webp"
        alt="Background"
        fill
        priority
        className="object-cover z-0"
      />
      
      {/* --- 背景の装飾 (オーバーレイ) --- */}
      <div className="absolute inset-0 z-10">
        <div className="absolute inset-0 bg-slate-950/60" /> 
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-70"></div>
      </div>

      {/* --- コンテンツラッパー (z-20で背景より手前に表示) --- */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        
        {/* ==========================================
            ① ヘッダー (ロゴ中央、ログイン右端)
           ========================================== */}
        <header className="relative flex h-64 items-center justify-center py-6">
          <Link 
            href="/" 
            className="relative h-full w-full max-w-5xl" 
          >
             <Image 
               src="/images/infopia_logo.png"
               alt="Infopia Logo"
               fill
               priority 
               className="object-contain" 
             />
          </Link>
          {/* ★★★ ログイン・新規登録ボタン (右端に配置) ★★★ */}
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 gap-4">
            {/* 新規登録ボタン (目立つスタイル) */}
            <Link 
              href="/auth/register"
              className="rounded-full bg-cyan-500 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 hover:scale-105"
            >
              新規登録
            </Link>
            
            {/* ログインボタン (すりガラススタイル) */}
            <Link 
              href="/auth/login"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-bold backdrop-blur-md transition hover:bg-white/10 hover:scale-105"
            >
              ログイン
            </Link>
          </div>
          {/* ★★★ ここまで ★★★ */}

        </header>

        {/* ==========================================
            ② ヒーローセクション (YouTube & 認証)
           ========================================== */}
        <section className="flex flex-col items-center justify-center pt-12 pb-24 text-center">
          
          {/* YouTube埋め込み */}
          <div className="relative mb-10 w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-blue-500/20 
                        aspect-video">
            <iframe 
              className="absolute top-0 left-0 h-full w-full"
              src="https://www.youtube.com/embed/9FrfDtypxzc" // ★ IDを置き換えました
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
          </div>

          {/* タイトル */}
          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
            情報学を<br className="md:hidden" />
            <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
              ゲーム感覚
            </span>
            で学ぶ！！
          </h1>
          
          {/* アクションボタンエリア */}
          <div className="flex w-full flex-col items-center gap-4 sm:w-auto">
            <Link
              href="/auth/register"
              className="group relative flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/50 sm:w-auto"
            >
              新規登録して始める
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-slate-300 transition-colors hover:text-cyan-400"
            >
              アカウントを持っている人はこちら
            </Link>
          </div>
        </section>

        {/* ==========================================
            ③ 機能紹介セクション (AIチャットボット)
           ========================================== */}
        <section className="mb-24 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* ★ 左半分全体: チャット画面のモックアップ ★ */}
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl">
                {/* (チャットUIのモックアップ...) */}
                <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/50 p-4">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-xs font-bold text-slate-400">AI コハク</span>
                </div>
                <div className="flex flex-col gap-4 p-6 text-sm md:text-base">
                  <div className="self-end rounded-l-xl rounded-tr-xl bg-blue-600 px-4 py-3 text-white">ソートアルゴリズムについて教えて！</div>
                  <div className="flex gap-3 self-start">
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-cyan-500/20"></div>
                    <div className="rounded-r-xl rounded-tl-xl bg-slate-800 px-4 py-3 text-slate-200 border border-white/5"><p>もちろんです！まずは「バブルソート」から覚えましょう...</p></div>
                  </div>
                </div>
                <div className="border-t border-white/10 p-4"><div className="h-10 w-full rounded-lg bg-slate-800/50"></div></div>
              </div>
            </div>

            {/* 右側: キャラクターと吹き出し */}
            <div className="order-1 flex flex-col items-center justify-center text-center lg:order-2 lg:items-start lg:text-left">
              
              {/* 吹き出し (中央寄せのしっぽ) */}
              <div className="relative mb-8 rounded-xl border border-white/20 bg-white/5 px-8 py-5 text-2xl font-bold backdrop-blur-md shadow-lg">
                ぼくがわからない問題をサポートするよ！
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 rotate-45 bg-white/5 backdrop-blur-md"></div>
              </div>

              {/* コハク画像 */}
              <div className="relative h-64 w-64 md:h-80 md:w-80 lg:h-96 lg:w-96">
                 <Image 
                   src="/images/Kohaku/kohaku-talk.png" 
                   alt="AI Character Kohaku"
                   fill
                   className="object-contain drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]"
                 />
              </div>

              {/* 補足テキスト */}
              <p className="mt-8 text-lg text-slate-300">
                AIによる質問機能を搭載！<br />
                チャット欄に質問を投げかけるとヒントをもらえる！
              </p>
            </div>

          </div>
        </section>

        {/* ==========================================
            ④ 機能紹介セクション (トレース機能) ★★★ レイアウト修正 ★★★
           ========================================== */}
        <section className="mb-24 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-12">
          {/* ★ チャットセクションと同じ grid / lg:grid-cols-2 を使用 ★ */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* ★ 左半分: トレース画面の画像 ★ */}
            <div className="order-2">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl">
                 <Image 
                   src="/images/basic_info_b_trace.png" 
                   alt="トレース機能のプレビュー"
                   width={2500} 
                   height={1400}
                   className="object-contain"
                 />
              </div>
            </div>

            {/* ★ 右半分: コハク、吹き出し、テキスト ★ */}
            <div className="order-1 flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
              
              {/* 吹き出し (新しいテキスト) */}
              <div className="relative mb-8 rounded-xl border border-white/20 bg-white/5 px-8 py-5 text-2xl font-bold backdrop-blur-md shadow-lg">
                基本情報の科目B問題も得意だよ！
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 rotate-45 bg-white/5 backdrop-blur-md"></div>
              </div>

              {/* コハク画像 (同じ画像を使用) */}
              <div className="relative h-64 w-64 md:h-80 md:w-80 lg:h-96 lg:w-96">
                 <Image 
                   src="/images/Kohaku/kohaku-full.png" 
                   alt="AI Character Kohaku"
                   fill
                   className="object-contain drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]"
                 />
              </div>

              {/* 補足テキスト */}
              <p className="mt-8 text-lg text-slate-300">
                基本情報科目Bの擬似言語にも対応！<br />
                ステップ実行で、変数の動きを「見える化」します。
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}