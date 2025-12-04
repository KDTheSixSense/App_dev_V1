// /workspaces/my-next-app/src/lib/session.ts
import { getIronSession, IronSession, IronSessionData, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  user?: {
    id: number;
    email: string;
  };
}
/**
 * セッションの設定オブジェクト
 */
export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD!,
  cookieName: process.env.COOKIE_NAME!,
  cookieOptions: {
    httpOnly: true,
    secure: true, // 常にSecure属性を付与 (ローカル開発でもHTTPS推奨、またはlocalhostは例外扱いされる場合あり)
    sameSite: 'lax',
  },
  ttl: 86400, // 1日 (秒単位)
};

/**
 * TypeScriptの型定義を拡張し、セッションに保存するデータの構造を定義します。
 */
// IronSessionData の型定義を拡張
declare module 'iron-session' {
  interface IronSessionData {
    // 既存のログイン済みユーザー情報
    user?: {
      id: number;
      email: string;
      username: string | null;
      lastlogin?: Date | null;
    };
    // Google新規登録確認用の一時データ
    googleSignupProfile?: {
      email: string;
      name: string;
      picture: string | null;
    };
  }
}

/**
 * サーバーコンポーネント、Server Actions、APIルートで現在のセッションを取得するためのヘルパー関数です。
 */
export async function getSession(): Promise<IronSession<IronSessionData>> {
  const session = await getIronSession(await cookies() as any, sessionOptions);
  return session;
}
