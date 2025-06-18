//パスワード変更機能
//メールアドレス入力→メール届く→新規パスワード

//クライアントコンポーネント
'use client';
import React from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";

//email/password　の型宣言
type Inputs = {
    email: string;
    password: string;
    newpassword: string;
    anspassword?: string;
};


const Login = () => {
    //useFormフックの呼び出し const以下の関数受け取り
    const { register, handleSubmit, formState: { errors },getValues } = useForm<Inputs>();
    
    //以下で画面表示するフォームの見た目を定義
    return (
        //Tailwind CSSを使用して見た目の変更・hookで入力チェック
        <div className="flex flex-col items-center justify-center h-screen">
            <form className="w-96 p-8 bg-white rounded-lg shadow-md">
                
                {/*見出しとラベル*/}
                <h1 className="mb-4 text-2xl font-medium text-gray-700">新規登録</h1>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600">メールアドレス</label>
                    
                    {/*入力部分*/}
                    <input
                        //registerでライブラリの管理下に登録する
                            //今回は、emailという名前を設定
                        {...register("email", {

                            //以下内容は、入力値のチェックになる
                            //requiredは必須指定
                            required: "メールアドレスは必須です",
                            
                            //入力値が特定パターン(value)に一致するか/一致しない場合のメッセージ(message)
                            pattern: {
                                value: /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/,
                                message: "このメールアドレスは無効です。",
                            },
                        })}
                        //メールアドレス専用指定
                        type="email"
                        //入力値が空の場合の例文
                        placeholder="mail@myservice.com"
                        
                        className="w-full p-2 mt-1 border-2 rounded-md"
                    />
                    {/*hookでエラーがでた場合のエラー内容*/}
                    {errors.email && (
                        <span className="text-sm text-red-600">{errors.email.message}</span>
                    )}
                </div>

                <div className="mb-4">
                    {/*新規パスワード入力*/}
                    <label className="block text-sm font-medium text-gray-600">パスワード</label>
                    <input
                        {...register("newpassword", {
                            required: "パスワードは必須です",
                            minLength: {
                                value: 8,
                                message: "パスワードは8文字以上でなくてはなりません",
                            },
                        })}
                        type="password"
                        className="w-full p-2 mt-1 border-2 rounded-md"
                    />
                    {errors.newpassword && (
                        <span className="text-sm text-red-600">{errors.newpassword.message}</span>
                    )}

                    
                    {/*確認パスワード再入力*/}
                    <label className="block text-sm font-medium text-gray-600">パスワード確認</label>
                    <input
                        {...register("anspassword", {
                            required: "確認のため、パスワードを再入力してください",

                            //パスワードが一致するかの確認
                            validate: (value) =>
                                value === getValues('newpassword') || "パスワードが一致しません",
                        })}
                        type="password"
                        className="w-full p-2 mt-1 border-2 rounded-md"
                    />
                    {errors.anspassword && (
                        <span className="text-sm text-red-600">{errors.anspassword.message}</span>
                    )}
                </div>

                {/*登録ボタン*/}
                <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
                        新規登録
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
