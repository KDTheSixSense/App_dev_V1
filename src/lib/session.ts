// /workspaces/my-next-app/src/lib/session.ts
import { getIronSession, IronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from './session-config';

export { sessionOptions, type SessionData };

/**
 * サーバーコンポーネント、Server Actions、APIルートで現在のセッションを取得するためのヘルパー関数です。
 */
export async function getSession(): Promise<IronSession<IronSessionData>> {
  const session = await getIronSession(await cookies() as any, sessionOptions);
  return session;
}
