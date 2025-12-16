'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { sendAppealEmail } from '../actions';
import { useActionState } from 'react';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? '送信中...' : '送信する'}
        </button>
    );
}

export default function BanAppealForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [state, formAction] = useActionState(sendAppealEmail, { success: false, message: '' });

    if (state.success) {
        return (
            <div className="mt-4 text-center">
                <button
                    onClick={() => setIsOpen(true)}
                    className="text-sm text-blue-500 hover:text-blue-700 underline mb-4"
                >
                    お問い合わせ / Contact Admin
                </button>

                {isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="text-center py-8">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">送信完了</h3>
                                <p className="mt-2 text-sm text-gray-500">{state.message}</p>
                                <div className="mt-6">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                                    >
                                        閉じる
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mt-4 text-center">
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-blue-500 hover:text-blue-700 underline"
            >
                お問い合わせ / Contact Admin
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl text-left animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">お問い合わせ</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            誤ったアクセス制限と思われる場合や、ご質問がある場合は以下のフォームよりご連絡ください。
                        </p>

                        <form action={formAction} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    メールアドレス
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="your@email.com"
                                />
                                {state.errors?.email && (
                                    <p className="text-red-500 text-xs mt-1">{state.errors.email[0]}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                    お問い合わせ内容
                                </label>
                                <textarea
                                    id="reason"
                                    name="reason"
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="BAN解除の申請や、状況の詳細をご記入ください。"
                                ></textarea>
                                {state.errors?.reason && (
                                    <p className="text-red-500 text-xs mt-1">{state.errors.reason[0]}</p>
                                )}
                            </div>

                            {state.message && !state.success && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                                    {state.message}
                                </div>
                            )}

                            <SubmitButton />
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
