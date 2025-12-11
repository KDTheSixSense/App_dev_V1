import { getIronSession, IronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from './session';

/**
 * サーバーコンポーネント、Server Actions、APIルートで現在のセッションを取得するためのヘルパー関数です。
 */
export async function getSession(): Promise<IronSession<IronSessionData>> {
  const session = await getIronSession(cookies() as any, sessionOptions);
  return session;
}
