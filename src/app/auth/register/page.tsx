'use client';
import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";  // App Router用


type Inputs = {
  email: string;
  newpassword: string;
  anspassword?: string;
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
  const onSubmit = (data: Inputs) => {
    console.log("登録データ", data);
    // ここにAPI呼び出しや登録処理を書く



    
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form onSubmit={handleSubmit(onSubmit)} className="w-96 p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-medium text-gray-700">新規登録</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">メールアドレス</label>
          <input
            {...register("email", {
              required: "メールアドレスは必須です",
              pattern: {
                value: /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/,
                message: "このメールアドレスは無効です。",
              },
            })}
            type="email"
            placeholder="mail@myservice.com"
            className="w-full p-2 mt-1 border-2 rounded-md"
          />
          {errors.email && <span className="text-sm text-red-600">{errors.email.message}</span>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600">パスワード</label>
          <input
            {...register("newpassword", {
              required: "パスワードは必須です",
              minLength: {
                value: 4,
                message: "パスワードは4文字以上でなくてはなりません",
              },
            })}
            type="password"
            className="w-full p-2 mt-1 border-2 rounded-md"
          />
          {errors.newpassword && (
            <span className="text-sm text-red-600">{errors.newpassword.message}</span>
          )}

          <label className="block text-sm font-medium text-gray-600 mt-4">パスワード確認</label>
          <input
            {...register("anspassword", {
              required: "確認のため、パスワードを再入力してください",
              validate: (value) =>
                value === getValues("newpassword") || "パスワードが一致しません",
            })}
            type="password"
            className="w-full p-2 mt-1 border-2 rounded-md"
          />
          {errors.anspassword && (
            <span className="text-sm text-red-600">{errors.anspassword.message}</span>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
          >
            戻る
          </button>

          <button
            type="submit"
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
          >
            新規登録
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
