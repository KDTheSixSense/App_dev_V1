'use client';

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import toast from 'react-hot-toast';

type Inputs = {
  newPassword: string;
  confirmPassword: string;
};

/**
 * 新しいパスワード設定画面
 * 
 * メールで送付されたトークンを使用して、新しいパスワードを設定します。
 */
const ResetPasswordPage = () => {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string; // URLからトークンを取得

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<Inputs>();

  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          password: data.newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'パスワードの変更に失敗しました。');
      }

      toast.success('パスワードが正常に変更されました。ログイン画面に移動します。');
      router.push('/auth/login');

    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('予期せぬエラーが発生しました。');
      }
    } finally {
      setLoading(false);
    }
  };

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
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-screen">

        {/* --- ヘッダーロゴ (中央配置) --- */}
        <header className="absolute top-0 left-0 w-full flex justify-center py-6">
          <a href="/" className="relative h-20 w-60">
            <img
              src="/images/infopia_logo.png"
              alt="Infopia Logo"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </a>
        </header>

        {/* --- フォームセクション --- */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl mt-20"
        >
          <h1 className="mb-6 text-2xl font-bold text-center text-white">新しいパスワードの設定</h1>

          {apiError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-md text-sm">
              {apiError}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300">新規パスワード</label>
            <input
              {...register("newPassword", {
                required: "新しいパスワードは必須です",
                minLength: { value: 4, message: "4文字以上で入力してください" },
              })}
              type="password"
              className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01]"
            />
            {errors.newPassword && <span className="text-sm text-red-500">{errors.newPassword.message}</span>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300">新規パスワード（確認用）</label>
            <input
              {...register("confirmPassword", {
                required: "確認のため、パスワードを再入力してください",
                validate: value => value === getValues("newPassword") || "パスワードが一致しません",
              })}
              type="password"
              className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01]"
            />
            {errors.confirmPassword && <span className="text-sm text-red-500">{errors.confirmPassword.message}</span>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/50 ${loading ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
            >
              {loading ? '更新中...' : 'パスワードを更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;