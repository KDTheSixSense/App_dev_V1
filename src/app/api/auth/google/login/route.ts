// /workspaces/my-next-app/src/app/api/auth/google/login/route.ts
// (404エラーを解決するために、このファイルを指定されたパスに作成します)
import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { env } from '@/lib/env';

/**
 * Googleログイン開始API
 * 
 * GoogleのOAuth認証ページへのリダイレクトURLを生成し、
 * クライアントをリダイレクトさせます。
 */
export async function GET() {
  try {
    // コールバックURLを環境変数から正しく構築します
    const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    const oAuth2Client = new OAuth2Client(
      env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // ユーザーに要求する情報 (email と profile)
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    // 認証URLを生成します
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline', // リフレッシュトークンが必要な場合は 'offline'
      scope: scopes,
    });

    // ユーザーをGoogleの認証ページにリダイレクトさせます
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Login Route Error:', error);
    return NextResponse.json(
      { error: error?.message || "Login failed" },
      { status: 500 }
    );
  }
}