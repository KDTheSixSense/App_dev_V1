// /workspaces/my-next-app/src/lib/session.ts
import { getIronSession, IronSession, IronSessionData, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

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
    };
  }
}

/**
 * サーバーコンポーネント、Server Actions、APIルートで現在のセッションを取得するためのヘルパー関数です。
 */
export async function getSession(): Promise<IronSession<IronSessionData>> {
  // ▼▼▼【修正】再度 as any を追加して、頑固な型エラーを回避します ▼▼▼
  const session = await getIronSession(cookies() as any, sessionOptions);
  return session;
}
