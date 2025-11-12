// /workspaces/my-next-app/src/app/api/auth/google/callback/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getIronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sessionOptions } from '@/lib/session'; // 既存のsessionOptionsをインポート
import { updateUserLoginStats } from '@/lib/actions'; // ログイン統計更新アクションを流用

export async function GET(req: NextRequest) {
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
    const picture = payload.picture || null; // アイコン画像

    // 3. データベースでユーザーを検索、または作成 (upsert)
    const user = await prisma.user.upsert({
      where: { email: email },
      
      // [修正 1] ユーザーが既に存在する場合 (update)
      // 既存のusernameは変更せず、iconのみ更新
      update: {
        icon: picture, 
      },

      // ユーザーが存在しない場合 (create)
      create: {
        email: email,
        username: name,
        password: null, 
        icon: picture,
        level: 1,
        xp: 0,
        aiAdviceCredits: 5,
        status_Kohaku: {
          create: {
            status: '元気', 
            hungerlevel: 150, 
            hungerLastUpdatedAt: new Date(),
          },
        },
      },
    });

    // 4. 既存の `iron-session` にセッションデータを保存
    // [修正 2] cookies() の呼び出しに 'await' を追加
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
    session.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      lastlogin: user.lastlogin,
    };
    await session.save();

    // 5. 既存のログイン統計更新処理を呼び出す
    await updateUserLoginStats(user.id);

    // 6. ホーム画面にリダイレクト
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/home`);

  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=google_callback_failed`
    );
  }
}