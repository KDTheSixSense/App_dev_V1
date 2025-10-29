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
    secure: process.env.NODE_ENV === 'production',
  },
};

/**
 * TypeScriptの型定義を拡張し、セッションに保存するデータの構造を定義します。
 */
declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: number;
      email: string;
      username: string | null;
      lastlogin?: Date | null;
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
