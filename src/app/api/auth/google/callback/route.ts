// /workspaces/my-next-app/src/app/api/auth/google/callback/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getIronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sessionOptions } from '@/lib/session';
import { updateUserLoginStats } from '@/lib/actions';

export async function GET(req: NextRequest) {
  // 必須の環境変数が設定されているかを確認
  if (!process.env.NEXT_PUBLIC_APP_URL || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('【Google OAuth Callback】: 必要な環境変数が設定されていません。');
    return NextResponse.json(
      { error: "サーバー設定が不完全です。管理者にお問い合わせください。" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=google_auth_failed`
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    // 1. 認証コードをアクセストークンに交換
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // 2. アクセストークンを使い、Googleからユーザー情報を取得
    const payload = await-google-auth-library.verifyIdToken({
      idToken: id_token,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name) {
      throw new Error('Googleから有効なプロフィールが取得できませんでした。');
    }

    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture || null;

    // 3. セッションを取得
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);

    // 4. データベースでユーザーを検索
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      // 5a. 既存ユーザー: ログイン処理を実行

      // アイコンが更新されている可能性があるので、DBを更新
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { icon: picture },
      });

      // ログインセッションを作成
      session.user = {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        isAdmin: existingUser.isAdmin,
        lastlogin: existingUser.lastlogin,
      };
      await session.save();

      // ログイン統計を更新
      await updateUserLoginStats(existingUser.id);

      // console.log(`Google Callback: 既存ユーザー ${email} (ID: ${existingUser.id}) でログインしました。`);

      // ホーム画面にリダイレクト
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/home`);
    } else {
      // 5b. 新規ユーザー: 一時セッションに保存し、確認画面へリダイレクト
      session.googleSignupProfile = {
        email: email,
        name: name,
        picture: picture,
      };
      await session.save();

      // console.log(`Google Callback: 新規ユーザー ${email} を確認待ちセッションに保存しました。`);

      // 新規登録確認ページにリダイレクト
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/google/confirm`);
    }

  } catch (error: any) {
    console.error('--- Google Callback Error ---');
    
    // Log the basic error message and stack trace
    console.error('Message:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }

    // Check if it's a Google API error from google-auth-library
    if (error.response && error.response.data) {
      console.error('Google API Error Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Log the full error object for deep inspection, handling circular references
    try {
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
    } catch (e) {
      console.error('Full Error Object (circular reference):', error);
    }
    
    console.error('-----------------------------');

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=google_callback_failed`
    );
  }
}