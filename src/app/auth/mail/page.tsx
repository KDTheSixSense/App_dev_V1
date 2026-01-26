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
/**
 * パスワードリセットリクエスト画面
 * 
 * パスワードを忘れたユーザーがメールアドレスを入力し、
 * リセット用のリンクを受け取るための画面です。
 */
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
        try {
            const res = await fetch('/api/auth/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email }),
            });

            const text = await res.text();
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

                {/* 4. handleSubmit(onSubmit) は react-hook-form の作法に則っています */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl mt-20"
                >

                    <h1 className="mb-4 text-2xl font-bold text-center text-white">パスワードをお忘れですか？</h1>
                    <p className="mb-6 text-sm text-slate-300 text-center">
                        ご登録のメールアドレスを入力してください。<br />パスワード再設定用のリンクをお送りします。
                    </p>

                    {/* 成功メッセージの表示エリア */}
                    {successMessage && (
                        <div className="p-3 mb-4 text-sm text-green-300 bg-green-900/50 border border-green-500 rounded-md">
                            {successMessage}
                        </div>
                    )}

                    {/* APIエラーメッセージの表示エリア */}
                    {apiError && (
                        <div className="p-3 mb-4 text-sm text-red-300 bg-red-900/50 border border-red-500 rounded-md">
                            {apiError}
                        </div>
                    )}

                    {/* 成功メッセージが表示されている場合は、入力フォームを非表示にする */}
                    {!successMessage && (
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-300">メールアドレス</label>
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
                                    className="w-full p-2 mt-1 rounded-md border border-white/20 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:scale-[1.01]"
                                />
                                {errors.email && (
                                    <span className="text-sm text-red-500">{errors.email.message}</span>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 mt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/50 ${loading ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
                                >
                                    {loading ? '送信中...' : '送信'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-6 py-2 font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                                >
                                    戻る
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};