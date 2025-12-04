// /workspaces/my-next-app/src/app/api/auth/google/login/route.ts
// (404エラーを解決するために、このファイルを指定されたパスに作成します)
import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET() {
  // コールバックURLを環境変数から正しく構築します
  const redirectUri = `https://infopia.nqg1t0.com/api/auth/google/callback`;

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,                         
    redirectUri
  );

  // ユーザーに要求する情報 (email と profile)
  const scopes = [
    'openid',
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
}