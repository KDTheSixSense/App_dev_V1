// app/api/session/route.ts
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { IronSessionData } from 'iron-session';

export async function GET() {
  const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
  
  if (!session.user) {
    return NextResponse.json({ user: null });
  }

  // セッションに保存されているユーザー情報を返す
  return NextResponse.json({
    user: session.user,
  });
}
