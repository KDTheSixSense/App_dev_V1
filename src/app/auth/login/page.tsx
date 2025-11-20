//クライアントコンポーネント
'use client';
import React from "react";
import { useForm } from "react-hook-form";
// import Link from "next/link"; // ★ 標準の<a>タグに変更
// import { useRouter, useSearchParams } from 'next/navigation'; // ★ 標準のWeb APIに変更
// import { FcGoogle } from "react-icons/fc"; // ★ SVGアイコンに変更
// import Image from 'next/image'; // ★ 標準の<img>タグに変更

// ★ GoogleアイコンのSVGコンポーネント
const GoogleIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.108-11.283-7.481l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C39.756,34.896,44,28.721,44,20C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);


//email/passwordSの型宣言
type Inputs = {
    email: string;
    password: string;
};


const Login = () => {

    // ★ Web APIを使用するように変更
    const router = {
      push: (path: string) => {
        setLoading(true); // ページ遷移中もローディングを表示
        window.location.href = path;
      }
    };

    //useFormフックの呼び出し const以下の関数受け取り
    const { register, handleSubmit, formState: { errors } } = useForm<Inputs>();
    const [loading, setLoading] = React.useState(false);

    // ★ Web APIを使用するように変更
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const [errorMessage, setErrorMessage] = React.useState<string | null>(() => {
      const error = searchParams.get('error');
      if (error === 'google_account_not_found') {
        return 'このGoogleアカウントは登録されていません。新規登録を行ってください。';
      }
      if (error === 'google_callback_failed' || error === 'google_auth_failed') {
        return 'Googleログインに失敗しました。時間をおいて再度お試しください。';
      }
      if (error === 'invalid_flow') {
        return '不正な操作が検出されました。もう一度お試しください。';
      }
      return null; // エラーがなければ null
    });

    //非同期関数
    const onSubmit = async(data: Inputs) => {
        console.log("送信データ:", data);
    // ここにAPI呼び出しや状態更新処理を書く
        //API通信の状態を示す
        setLoading(true);
        setErrorMessage(null); // ★ 新しい送信時にエラーをクリア
    try {
        //POSTリクエストを/api/auth/loginに送信
        const res = await fetch('/api/auth/login', {
        method: 'POST',
        //JSON形式
        headers: { 'Content-Type': 'application/json' },
        //JSオブジェクトをJSON文字列変換
        body: JSON.stringify(data),
      });
      //レスポンスが成功ではない
      if (!res.ok) {
        const result = await res.json();
        setErrorMessage(result.error || 'ログインに失敗しました');
        // throw new Error('ログイン失敗'); // ★ アラートの代わりにerrorMessageを使うためコメントアウト
      } else {
        //JSONデータをJSオブジェクトに変換
        const result = await res.json();
        console.log('ログイン成功:', result);
        // ここに成功時の処理（例: トークン保存、ページ遷移）を追加

        // '/home'ページに遷移
        router.push('/home'); 
      }

    } catch (error) {
      // fetch自体が失敗した場合（ネットワークエラーなど）
      console.error('ログインリクエストエラー:', error);
      setErrorMessage('ログイン中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
        //成功失敗でも必ず行う処理
    };

    // Googleログインボタン用のハンドラ
    const handleGoogleLogin = () => {
        setLoading(true); // ★ Googleログイン中もローディング表示
        // STEP 5 で作成するAPIルートにリダイレクト
        router.push('/api/auth/google/login');
    };

    // ★★★ ここから下がデザイン変更後のJSXです ★★★
    return (
      <div 
        className="relative min-h-screen w-full overflow-hidden text-white selection:bg-cyan-500 selection:text-slate-900 
                   bg-center bg-cover bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('/images/Infopia_Login_Ragister_Background.png')" }} 
      >
        
        {/* --- 背景の装飾 (オーバーレイ) --- */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-slate-950/60" /> 
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-70"></div>
        </div>

        {/* --- コンテンツラッパー (z-10) --- */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* --- ヘッダーロゴ (中央配置) --- */}
          <header className="relative flex h-40 items-center justify-center py-6">
            {/* ★ <a>タグに変更 */}
            <a href="/" className="relative h-full w-full max-w-lg">
                {/* ★ <img>タグに変更 (Next/Imageのfillとobject-containのスタイルを再現) */}
                <img 
                  src="/images/Infopia_logo.png"
                  alt="Infopia Logo"
                  className="absolute inset-0 w-full h-full object-contain" 
                  loading="eager" // priorityの代わりにeagerを使用
                />
            </a>
          </header>

          {/* --- フォームセクション (中央配置) --- */}
          <div className="flex flex-col items-center justify-start py-12">
      
            {/* --- すりガラス風フォーム --- */}
            <form 
              onSubmit={handleSubmit(onSubmit)} 
              className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl"
            >
              <h1 className="mb-6 text-2xl font-bold text-center text-white">
                ログイン
              </h1>

              {/* エラーメッセージ表示欄 (デザイン変更) */}
              {errorMessage && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-md text-sm">
                    {errorMessage}
                  </div>
              )}

              {/* --- メールアドレス --- */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300">メールアドレス</label>
                <input
                  {...register("email", {
                    required: "メールアドレスは必須です",
                    pattern: {
                      value: /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/,
                      message: "有効なメールアドレスを入力してください。",
                    },
                  })}
                  type="email"
                  placeholder="mail@example.com"
                  className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01]"
                />
                {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
              </div>

              {/* --- パスワード --- */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300">パスワード</label>
                <input
                  {...register("password", {
                    required: "パスワードは必須です",
                    // minLength: { // 元のコードに合わせて 4文字
                    //     value: 4,
                    //     message: "パスワードは4文字以上でなくてはなりません",
                    // },
                    // ★ Registerコンポーネントに合わせて8文字に変更 (もし4文字が良い場合は上を有効化してください)
                    minLength: { value: 4, message: "4文字以上のパスワードを入力してください" },

                  })}
                  type="password"
                  className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01]"
                />
                {errors.password && <span className="text-sm text-red-500">{errors.password.message}</span>}
              </div>

              {/* --- ボタンエリア --- */}
              <div className="flex justify-between items-center mt-6 mb-4">
                
                {/* Googleログインボタン (Registerの「戻る」ボタン風スタイル) */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    aria-label="Google でログイン"
                    className={`flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {/* ★ SVGコンポーネントに変更 */}
                    <GoogleIcon className="h-5 w-5" /> {/* サイズ調整 */}
                    Google
                </button>
                
                {/* ログインボタン (Registerの「登録」ボタン風スタイル) */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`group rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/50 ${
                    loading ? 'opacity-50 cursor-not-allowed scale-100' : ''
                  }`}
                >
                  {loading ? 'ログイン中...' : 'ログイン'}
                </button>

              </div>

              {/* --- リンクエリア (デザイン変更) --- */}
              <div className="mt-6 text-center">
                <div className="mb-2">
                  <span className="text-sm text-slate-400">初めてのご利用の方は </span>
                  {/* ★ <a>タグに変更 */}
                  <a href="/auth/register" className="ml-1 text-sm font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
                    こちら
                  </a>
                </div>
                <div>
                  <span className="text-sm text-slate-400">パスワードをお忘れの方は </span>
                  {/* ★ <a>タグに変更 */}
                  <a href="/auth/mail" className="ml-1 text-sm font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
                    こちら
                  </a>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    );
};

// ★ Suspense ラッパー (元のコードと同じ)
const LoginPage = () => {
    return (
        <React.Suspense fallback={
          // ローディング中も背景デザインが適用されるように変更
          <div className="relative min-h-screen w-full bg-slate-950 flex items-center justify-center text-white
                         bg-center bg-cover bg-no-repeat bg-fixed" // ★ メインコンポーネントとクラスを統一
               style={{ backgroundImage: "url('/images/Infopia_Login_Ragister_Background.png')" }}
          >
            <div className="absolute inset-0 bg-slate-950/60" />
            <div className="relative z-10 text-xl">Loading...</div>
          </div>
        }>
            <Login />
        </React.Suspense>
    );
};

export default LoginPage;