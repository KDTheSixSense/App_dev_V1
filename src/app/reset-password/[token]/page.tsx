'use client';

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";

type Inputs = {
  newPassword: string;
  confirmPassword: string;
};

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

      alert('パスワードが正常に変更されました。ログイン画面に移動します。');
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
    <div className="flex flex-col items-center justify-center h-screen">
      <form onSubmit={handleSubmit(onSubmit)} className="w-96 p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-medium text-gray-700">新しいパスワードの設定</h1>

        {apiError && <p className="mb-4 text-sm text-center text-red-600">{apiError}</p>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">新規パスワード</label>
          <input
            {...register("newPassword", {
              required: "新しいパスワードは必須です",
              minLength: { value: 4, message: "4文字以上で入力してください" },
            })}
            type="password"
            className="w-full p-2 mt-1 border-2 rounded-md"
          />
          {errors.newPassword && <span className="text-sm text-red-600">{errors.newPassword.message}</span>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">新規パスワード（確認用）</label>
          <input
            {...register("confirmPassword", {
              required: "確認のため、パスワードを再入力してください",
              validate: value => value === getValues("newPassword") || "パスワードが一致しません",
            })}
            type="password"
            className="w-full p-2 mt-1 border-2 rounded-md"
          />
          {errors.confirmPassword && <span className="text-sm text-red-600">{errors.confirmPassword.message}</span>}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? '更新中...' : 'パスワードを更新'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordPage;