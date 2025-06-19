//app/auth/mail/page.tsx

'use client';

// react-hook-form から useForm をインポートします
import { useForm } from "react-hook-form";
// useState や Link もインポートしておきます
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";  // App Router用

// フォームのデータ型を定義
type Inputs = {
    email: string;
};

// コンポーネント名をPascalCaseに修正（推奨）
export default function PasswordResetPage() {
    const router = useRouter();
    // 戻るボタン処理
  const handleBack = () => {
    router.push('/auth/login');  // 戻り先のパスを適宜設定してください
  };



    


    // 1. useFormフックを呼び出し、必要な関数を取得します
    const { register, handleSubmit, formState: { errors } } = useForm<Inputs>();

    // 2. API通信に関する状態管理は引き続きuseStateを使用します
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [apiError, setApiError] = useState('');

    // 3. onSubmit関数は react-hook-form からデータを受け取ります
    const onSubmit = async (data: Inputs) => {
        setLoading(true);
        setSuccessMessage('');
        setApiError('');

        try {
        const res = await fetch('/api/auth/mail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const text = await res.text(); // ← text() で取得してから判定
        const result = text ? JSON.parse(text) : {};

        if (!res.ok) {
            throw new Error(result.message || 'エラーが発生しました。');
        }

        setSuccessMessage(result.message || 'パスワード再設定メールを送信しました。');
        } catch (err) {
        if (err instanceof Error) {
            setApiError(err.message);
        } else {
            setApiError('予期せぬエラーが発生しました。');
        }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            {/* 4. handleSubmit(onSubmit) は react-hook-form の作法に則っています */}
            <form onSubmit={handleSubmit(onSubmit)} className="w-96 p-8 bg-white rounded-lg shadow-md">

                <h1 className="mb-4 text-2xl font-medium text-gray-700">パスワードをお忘れですか？</h1>
                <p className="mb-4 text-sm text-gray-600">
                    ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
                </p>

                {/* 成功メッセージの表示エリア */}
                {successMessage && (
                    <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 border border-green-200 rounded-md">
                        {successMessage}
                    </div>
                )}

                {/* APIエラーメッセージの表示エリア */}
                {apiError && (
                    <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
                        {apiError}
                    </div>
                )}

                {/* 成功メッセージが表示されている場合は、入力フォームを非表示にする */}
                {!successMessage && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600">メールアドレス</label>
                            <input
                                // 5. register と errors は useForm から取得したものなので正しく動作します
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
                            {errors.email && (
                                <span className="text-sm text-red-600">{errors.email.message}</span>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 mt-4">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                        >
                            戻る
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 font-bold text-white rounded ${
                            loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'
                            }`}
                        >
                            {loading ? '送信中...' : '送信'}
                        </button>

                        
                        </div>
                    </>
                )}
            </form>
        </div>
        );
    };