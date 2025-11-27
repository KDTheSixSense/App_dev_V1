//lib/auth.ts

import { getIronSession, IronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from './session';

export async function getAppSession(): Promise<IronSession<IronSessionData>> {
  
  const cookieStore = cookies();

  const session = await getIronSession(await(cookieStore), sessionOptions);
  
  return session;
}
