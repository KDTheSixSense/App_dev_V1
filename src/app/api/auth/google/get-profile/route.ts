// /workspaces/my-next-app/src/app/api/auth/google/get-profile/route.ts
import { NextResponse } from 'next/server';
import { getIronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

/**
 * Googleプロフィール情報取得API
 * 
 * Google認証フローで一時保存されたプロフィール情報を取得します。
 * 新規登録確認画面で表示するために使用されます。
 */
export async function GET(req: Request) {
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);

    const profile = session.googleSignupProfile;

    if (!profile) {
        return NextResponse.json({ error: '確認情報が見つかりません。ログインからやり直してください。' }, { status: 404 });
    }

    // 情報をクライアント（確認ページ）に返す
    return NextResponse.json({ profile: profile });
}