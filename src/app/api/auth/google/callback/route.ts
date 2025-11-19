import { NextResponse, NextRequest } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getIronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sessionOptions } from '@/lib/session';
import { updateUserLoginStats } from '@/lib/actions'; 

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(
      `https://infopia.nqg1t0/auth/login?error=google_auth_failed`
    );
  }

  const redirectUri = `https://infopia.nqg1t0/api/auth/google/callback`;

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
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name) {
      throw new Error('Googleから有効なプロフィールが取得できませんでした。');
    }

    const email = payload.email;
    const name = payload.name;
    const picture = null; // payload.picture || null;

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
        lastlogin: existingUser.lastlogin,
      };
      await session.save();

      // ログイン統計を更新
      await updateUserLoginStats(existingUser.id);

      console.log(`Google Callback: 既存ユーザー ${email} (ID: ${existingUser.id}) でログインしました。`);

      // ホーム画面にリダイレクト
      return NextResponse.redirect(`https://infopia.nqg1t0/home`);
    } else {
      // 5b. 新規ユーザー: 一時セッションに保存し、確認画面へリダイレクト
      session.googleSignupProfile = {
        email: email,
        name: name,
        picture: picture,
      };
      await session.save();

      console.log(`Google Callback: 新規ユーザー ${email} を確認待ちセッションに保存しました。`);
      
      // 新規登録確認ページにリダイレクト
      return NextResponse.redirect(`https://infopia.nqg1t0/auth/google/confirm`);
    }

  } catch (error: any) { // 👈 エラーの詳細を取得
    console.error('--- Google callback error details ---');
    
    // Google APIからの詳細なレスポンス（特に 'invalid_grant' など）を出力
    if (error.response?.data) {
        console.error('Google Response Data:', JSON.stringify(error.response.data));
    } else {
        console.error('General Error Message:', error.message);
    }
    console.error('-------------------------------------');

    return NextResponse.redirect(
      `https://infopia.nqg1t0/auth/login?error=google_callback_failed`
    );
  }
}