// /workspaces/my-next-app/src/app/auth/google/confirm/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type ProfileData = {
  email: string;
  name: string;
  picture: string | null;
};

/**
 * Googleアカウント連携確認画面
 * 
 * Googleログイン後、未登録ユーザーの場合に表示されます。
 * プロフィール情報の確認と、利用規約・プライバシーポリシーへの同意を行います。
 */
export default function ConfirmGoogleSignup() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [isAgreedToTerms, setIsAgreedToTerms] = React.useState(false);
  const [isAgreedToPrivacy, setIsAgreedToPrivacy] = React.useState(false);

  // 1. ページ読み込み時に、セッションから一時情報を取得するAPIを叩く
  React.useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/google/get-profile');
        const data = await res.json();
        if (!res.ok || !data.profile) {
          throw new Error(data.error || '確認情報の取得に失敗しました。');
        }
        setProfile(data.profile);
      } catch (err: any) {
        setError(err.message);
        // エラーが出たらログインページに戻す
        setTimeout(() => router.push('/auth/login?error=invalid_flow'), 2000);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  // 2. 「はい、登録する」ボタンが押された時の処理
  const handleConfirm = async () => {
    // フロントエンドバリデーション
    if (!isAgreedToTerms || !isAgreedToPrivacy) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAgreedToTerms,
          isAgreedToPrivacyPolicy: isAgreedToPrivacy
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登録に失敗しました。');
      }
      // 登録成功！ ホーム画面へ
      router.push('/home');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const canSubmit = isAgreedToTerms && isAgreedToPrivacy;

  // 3. 画面の表示
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

      {/* --- コンテンツラッパー --- */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* --- ヘッダーロゴ (中央配置) --- */}
        <header className="relative flex h-40 items-center justify-center py-6">
          <Link href="/" className="relative h-full w-full max-w-lg">
            <Image
              src="/images/infopia_logo.png"
              alt="Infopia Logo"
              fill
              priority
              className="object-contain"
            />
          </Link>
        </header>

        {/* --- メインコンテンツ --- */}
        <div className="flex flex-col items-center justify-start py-12">
          {/* --- すりガラス風カード --- */}
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
            <h1 className="mb-6 text-2xl font-bold text-center text-white">
              アカウントの確認
            </h1>

            {loading && !profile && <p className="text-center text-slate-300">確認中...</p>}

            {error && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded text-center text-sm">
                {error}
              </div>
            )}

            {profile && (
              <>
                <div className="flex flex-col items-center mb-6">
                  {/* プロフィール画像があればここに表示 */}
                  {/* {profile.picture && (
                    <Image
                      src={profile.picture}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-full mb-4 border-2 border-white/20"
                    />
                  )} */}

                  <p className="text-xl font-bold text-white">{profile.name}</p>
                  <p className="text-sm text-slate-400">{profile.email}</p>
                </div>

                <div className="space-y-2 mb-8">
                  <p className="text-center text-slate-200">
                    INFOPIAにようこそ！
                  </p>
                  <p className="text-center text-slate-200">
                    新規登録しますか？
                  </p>
                </div>

                {/* --- 利用規約・プライバシーポリシー --- */}
                <div className="mb-8 flex flex-col gap-3 px-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="google-terms"
                      checked={isAgreedToTerms}
                      onChange={(e) => setIsAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-500 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                    />
                    <label htmlFor="google-terms" className="text-sm text-slate-300 cursor-pointer select-none">
                      <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">利用規約</Link>
                      に同意します
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="google-privacy"
                      checked={isAgreedToPrivacy}
                      onChange={(e) => setIsAgreedToPrivacy(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-500 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                    />
                    <label htmlFor="google-privacy" className="text-sm text-slate-300 cursor-pointer select-none">
                      <Link href="/privacypolicy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">プライバシーポリシー</Link>
                      に同意します
                    </label>
                  </div>
                </div>

                {/* --- アクションボタン --- */}
                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleConfirm}
                    disabled={loading || !canSubmit}
                    className={`group w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/25 transition-all 
                      ${(loading || !canSubmit)
                        ? 'opacity-50 cursor-not-allowed grayscale'
                        : 'hover:scale-105 hover:shadow-cyan-500/50'
                      }`}
                  >
                    {loading ? '登録中...' : '登録する'}
                  </button>

                  <Link href="/auth/login" passHref className="w-full">
                    <button
                      disabled={loading}
                      className={`w-full rounded-lg border border-white/20 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20
                        ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      キャンセル
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}