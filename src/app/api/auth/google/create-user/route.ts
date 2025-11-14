// /workspaces/my-next-app/src/app/api/auth/google/create-user/route.ts
import { NextResponse } from 'next/server';
import { getIronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sessionOptions } from '@/lib/session';
import { updateUserLoginStats } from '@/lib/actions'; // 既存のログイン統計アクション

// MAX_HUNGER は actions.ts で 200 と定義されていますが、ここでは 150 で初期化します
const INITIAL_HUNGER = 150; 

export async function POST(req: Request) {
  const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);

  // 1. 一時セッションに保存されたプロフィール情報を取得
  const profile = session.googleSignupProfile;

  if (!profile || !profile.email) {
    console.error('Google Create-User: 一時セッション情報が見つかりません。');
    return NextResponse.json({ error: '不正なセッションです。ログインからやり直してください。' }, { status: 400 });
  }

  const { email, name, picture } = profile;

  try {
    // 2. (念のため) DBに同じメールアドレスが作成されていないか最終確認
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      session.googleSignupProfile = undefined;
      await session.save();
      return NextResponse.json({ error: 'このアカウントは既に使用されています。' }, { status: 409 });
    }

    // 3. ユーザーをDBに新規作成
    const user = await prisma.user.create({
      data: {
        email: email,
        username: name,
        password: null, // Googleログインのためパスワードは null
        icon: picture,
        level: 1,
        xp: 0,
        aiAdviceCredits: 5,
        status_Kohaku: {
          create: {
            status: '満腹', // status_Kohaku の初期値は '元気' ではなく '満腹' にすべき
            hungerlevel: INITIAL_HUNGER, 
            hungerLastUpdatedAt: new Date(), // 満腹度タイマーを今開始
          },
        },
      },
    });

    console.log(`Google Create-User: ユーザー ${email} (ID: ${user.id}) を作成しました。`);

    // 4. 一時セッションを削除し、本番のログインセッションを作成
    session.googleSignupProfile = undefined;
    session.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      lastlogin: user.lastlogin,
    };
    await session.save();

    // 5. ログイン統計を更新 (これが初回ログインになる)
    await updateUserLoginStats(user.id);

    // 6. 成功レスポンス (UI側が /home にリダイレクトする)
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Google Create-User API error:', error);
    return NextResponse.json({ error: 'アカウント作成中にエラーが発生しました。' }, { status: 500 });
  }
}