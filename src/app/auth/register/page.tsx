'use client';
import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";  // App Router用
import { registerUserAction } from '@/lib/actions'
import { FcGoogle } from "react-icons/fc"; // Googleアイコンをインポート
import Image from 'next/image'; // ★ デザイン反映のために追加
import Link from 'next/link'; // ★ デザイン反映のために追加
import DOMPurify from 'dompurify';

type Inputs = {
  username: string;
  email: string;
  newpassword: string;
  anspassword?: string;
  birth?: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
};

const Register = () => {

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<Inputs>();

  // 戻るボタン処理
  const handleBack = () => {
    router.push('/auth/login');  // ログインページに戻るように設定
  };


  // 送信時の処理
  const onSubmit = async (data: Inputs) => {
    try {
      // Server Actionを直接呼び出す
      const result = await registerUserAction({
        username: DOMPurify.sanitize(data.username),
        email: DOMPurify.sanitize(data.email),
        password: DOMPurify.sanitize(data.newpassword),
        birth: data.birth ? DOMPurify.sanitize(data.birth) : undefined,
        isAgreedToTerms: true,  // 利用規約への同意 (実際にはチェックボックスの値を使う)
        isAgreedToPrivacyPolicy: true,  // プライバシーポリシーへの同意 (実際にはチェックボックスの値を使う)
      });

      if (result.success) {
        alert('登録に成功しました！ログインページに移動します。');
        router.push('/auth/login');
      } else {
        // Server Actionからのエラーメッセージを表示
        alert(result.error || '登録に失敗しました');
      }
    } catch (err) {
      console.error('登録時エラー:', err);
      alert('登録中に予期せぬエラーが発生しました');
    }
  };

  // Googleログインボタン用のハンドラ
  const handleGoogleLogin = () => {
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
          <Link href="/" className="relative h-full w-full max-w-lg">
            <Image
              src="/images/Infopia_logo.png"
              alt="Infopia Logo"
              fill
              priority
              className="object-contain"
            />
          </Link>
        </header>

        {/* --- フォームセクション (中央配置) --- */}
        <div className="flex flex-col items-center justify-start py-12">

          {/* --- すりガラス風フォーム --- */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl"
          >
            <h1 className="mb-6 text-2xl font-bold text-center text-white">
              新規登録
            </h1>

            {/* --- ユーザー名入力欄 --- */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300">ユーザー名</label>
              <input
                {...register("username", { required: "ユーザー名は必須です" })}
                type="text"
                autoComplete="username"
                placeholder="例：山田 太郎"
                className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01]" />
              {errors.username && <span className="text-sm text-red-500">{errors.username.message}</span>}
            </div>

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
                autoComplete="email"
                placeholder="mail@example.com"
                className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01]"
              />
              {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
            </div>

            {/* --- パスワード --- */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300">パスワード</label>
              <input
                {...register("newpassword", {
                  required: "パスワードは必須です",
                  minLength: { value: 8, message: "8文字以上のパスワードを設定してください" },
                })}
                type="password"
                autoComplete="new-password"
                className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01]"
              />
              {errors.newpassword && <span className="text-sm text-red-500">{errors.newpassword.message}</span>}
            </div>

            {/* --- パスワード確認 --- */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300">パスワード確認</label>
              <input
                {...register("anspassword", {
                  required: "確認のため、パスワードを再入力してください",
                  validate: (value) => value === getValues("newpassword") || "パスワードが一致しません",
                })}
                type="password"
                autoComplete="new-password"
                className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01]"
              />
              {errors.anspassword && <span className="text-sm text-red-500">{errors.anspassword.message}</span>}
            </div>

            {/* --- 生年月日 (任意) --- */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300">生年月日 (任意)</label>
              <input
                {...register("birth")}
                type="date"
                autoComplete="bday"
                className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01] [color-scheme:dark]"
              />
            </div>

            {/* 利用規約・プライバシーポリシーチェックボックス */}
            <div className="mb-6 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  {...register("agreedToTerms", { required: "利用規約への同意が必要です" })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="terms" className="text-sm text-slate-300">
                  <Link href="/terms" target="_blank" className="text-cyan-400 hover:underline">利用規約</Link>
                  に同意します
                </label>
              </div>
              {errors.agreedToTerms && <span className="text-sm text-red-500">{errors.agreedToTerms.message}</span>}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="privacy"
                  {...register("agreedToPrivacy", { required: "プライバシーポリシーへの同意が必要です" })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="privacy" className="text-sm text-slate-300">
                  <Link href="/privacypolicy" target="_blank" className="text-cyan-400 hover:underline">プライバシーポリシー</Link>
                  に同意します
                </label>
              </div>
              {errors.agreedToPrivacy && <span className="text-sm text-red-500">{errors.agreedToPrivacy.message}</span>}
            </div>

            {/* --- ボタンエリア --- */}
            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-2 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
              >
                戻る
              </button>
              <button
                type="submit"
                className="group rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/50"
              >
                登録する
              </button>
            </div>
          </form>

          {/* --- "または" 区切り線 --- */}
          <div className="my-6 flex w-full max-w-md items-center gap-4">
            <div className="h-px flex-grow bg-white/10"></div>
            <span className="text-slate-400">または</span>
            <div className="h-px flex-grow bg-white/10"></div>
          </div>

          {/* --- Google新規登録ボタン (すりガラス) --- */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full max-w-md items-center justify-center gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-3 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
          >
            <FcGoogle className="h-6 w-6" />
            Googleで新規登録
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;