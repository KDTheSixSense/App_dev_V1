//ログイン画面

//クライアントコンポーネント
'use client';
import React from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";

//email/password　の型宣言
type Inputs = {
    email: string;
    password: string;
};


const Login = () => {
    //useFormフックの呼び出し const以下の関数受け取り
    const { register, handleSubmit, formState: { errors } } = useForm<Inputs>();
    
    //以下で画面表示するフォームの見た目を定義
    return (
        //Tailwind CSSを使用して見た目の変更・hookで入力チェック
        <div className="flex flex-col items-center justify-center h-screen">
            <form className="w-96 p-8 bg-white rounded-lg shadow-md">
                
                //見出しとラベル
                <h1 className="mb-4 text-2xl font-medium text-grey-700">ログイン</h1>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-grey-600">メールアドレス</label>
                    
                    //入力部分
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
                    //hookでエラーがでた場合のエラー内容
                    {errors.email && (
                        <span className="text-sm text-red-600">{errors.email.message}</span>
                    )}
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-grey-600">パスワード</label>
                    <input
                        {...register("password", {
                            required: "パスワードは必須です",
                            minLength: {
                                value: 8,
                                message: "パスワードは8文字以上でなくてはなりません",
                            },
                        })}
                        type="password"
                        className="w-full p-2 mt-1 border-2 rounded-md"
                    />
                    {errors.password && (
                        <span className="text-sm text-red-600">{errors.password.message}</span>
                    )}
                </div>

                //ログインボタン
                <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
                        ログイン
                    </button>
                </div>
                //新規登録への案内リンク
                <div className="mt-4">
                    <span className="text-sm text-grey-600">初めてのご利用の方は</span>
                    <Link href="/register" className="ml-1 text-sm font-bold text-blue-500 hover:text-blue-700">
                        こちら
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default Login;
