'use client';
import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";  // App Router用
import { registerUserAction } from '@/lib/actions'

type Inputs = {
  username: string;
  email: string;
  newpassword: string;
  anspassword?: string;
  birth?: string;
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
    router.push('/auth/login');  // 戻り先のパスを適宜設定してください
  };


  // 送信時の処理
  // --- ▼▼▼ onSubmit関数をServer Actionを使う形に修正 ▼▼▼ ---
  const onSubmit = async (data: Inputs) => {
    try {
      // Server Actionを直接呼び出す
      const result = await registerUserAction({
        username: data.username,
        email: data.email,
        password: data.newpassword,
        birth: data.birth,
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


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">新規登録</h1>

        {/* --- ▼▼▼ ユーザー名入力欄を追加 ▼▼▼ --- */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">ユーザー名</label>
          <input
            {...register("username", { required: "ユーザー名は必須です" })}
            type="text"
            placeholder="例：山田 太郎"
            className="w-full p-2 mt-1 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {errors.username && <span className="text-sm text-red-600">{errors.username.message}</span>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">メールアドレス</label>
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
            className="w-full p-2 mt-1 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && <span className="text-sm text-red-600">{errors.email.message}</span>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">パスワード</label>
          <input
            {...register("newpassword", {
              required: "パスワードは必須です",
              minLength: { value: 8, message: "8文字以上のパスワードを設定してください" },
            })}
            type="password"
            className="w-full p-2 mt-1 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {errors.newpassword && <span className="text-sm text-red-600">{errors.newpassword.message}</span>}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600">パスワード確認</label>
          <input
            {...register("anspassword", {
              required: "確認のため、パスワードを再入力してください",
              validate: (value) => value === getValues("newpassword") || "パスワードが一致しません",
            })}
            type="password"
            className="w-full p-2 mt-1 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {errors.anspassword && <span className="text-sm text-red-600">{errors.anspassword.message}</span>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">生年月日 (任意)</label>
          <input
            {...register("birth")}
            type="date"
            className="w-full p-2 mt-1 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-between items-center mt-6">
          <button type="button" onClick={handleBack} className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
            戻る
          </button>
          <button type="submit" className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-600">
            登録する
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
