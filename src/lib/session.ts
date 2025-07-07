//lib/session.ts

import { SessionOptions } from 'iron-session';

export const sessionOptions: SessionOptions = {
  // .env.localファイルで設定したパスワード
  password: process.env.SECRET_COOKIE_PASSWORD!, 
  cookieName: process.env.COOKIE_NAME!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// --- ▼ この部分が重要です ▼ ---
// TypeScriptにセッションデータの型を教えます
declare module 'iron-session' {
  interface IronSessionData {
    // 'user'プロパティが存在し、その型が以下のようであることを定義します
    user?: {
      id: string; // Prismaのモデルに合わせて string または number
      email: string;
    };
  }
}