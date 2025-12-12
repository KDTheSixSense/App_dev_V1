// /workspaces/my-next-app/src/lib/session.ts
import { getIronSession, IronSession, IronSessionData, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  user?: {
    id: string;
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
    secure: process.env.NODE_ENV === 'production', // 本番環境のみSecure属性を有効化
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
      id: string;
      email: string;
      username: string | null;
      isAdmin: boolean;
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

