// /workspaces/my-next-app/src/app/auth/google/confirm/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Googleのプロフィール画像を表示するため
import Image from 'next/image'; 

type ProfileData = {
  email: string;
  name: string;
  picture: string | null;
};

export default function ConfirmGoogleSignup() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<ProfileData | null>(null);

  // 1. ページ読み込み時に、セッションから一時情報を取得するAPIを叩く
  React.useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        // (このAPIルートはステップ6で作成します)
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
    setLoading(true);
    setError(null);
    try {
      // (このAPIルートはステップ5で作成します)
      const res = await fetch('/api/auth/google/create-user', { method: 'POST' });
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

  // 3. 画面の表示
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-96 p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-xl font-medium text-gray-700 text-center">
          アカウントの確認
        </h1>

        {loading && !profile && <p className="text-center text-gray-600">確認中...</p>}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {profile && (
          <>
            <div className="flex flex-col items-center mb-4">
                {/*{profile.picture ? (
                // next.config.ts/mjs に 'lh3.googleusercontent.com' が許可されている必要があります
                <Image
                  src={profile.picture}
                  alt="Google Profile"
                  width={80}
                  height={80}
                  className="rounded-full mb-2"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full mb-2" />
              )} */}
              <p className="text-lg font-medium">{profile.name}</p>
              <p className="text-sm text-gray-600">{profile.email}</p>
            </div>
            <p className="mb-6 text-center text-gray-700">
              INFOPIAにようこそ！<br />このアカウントで新規登録しますか？
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`w-full px-4 py-2 font-bold text-white rounded ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'}`}
              >
                {loading ? '登録中...' : '登録する'}
              </button>
              <Link href="/auth/login" passHref>
                <button
                  disabled={loading}
                  className={`w-full text-center text-sm font-medium text-gray-700 
               border border-gray-300 bg-gray-50 rounded 
               px-4 py-2 hover:bg-gray-100 transition-colors
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
  );
}