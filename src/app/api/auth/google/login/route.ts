// /workspaces/my-next-app/src/app/api/auth/google/login/route.ts
// (404エラーを解決するために、このファイルを指定されたパスに作成します)
import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function GET() {
  // 必須の環境変数が設定されているかを確認
  if (!process.env.NEXT_PUBLIC_APP_URL || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('【Google OAuth】: 必要な環境変数が設定されていません。');
    return NextResponse.json(
      { error: "サーバー設定が不完全です。管理者にお問い合わせください。" },
      { status: 500 }
    );
  }

  // コールバックURLを環境変数から正しく構築します
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
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
}