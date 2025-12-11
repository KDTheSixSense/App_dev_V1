// app/api/validate-user/route.ts
import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(req, new NextResponse(), sessionOptions);
  const { user } = session;

  if (!user?.id) {
    return NextResponse.json({ exists: false }, { status: 401 });
  }

  const userFromDb = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userFromDb) {
    session.destroy();
    return NextResponse.json({ exists: false }, { status: 401 });
  }

  return NextResponse.json({ exists: true });
}
