import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import React from 'react';

export const dynamic = 'force-dynamic';

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

// 型定義を修正
type MemberLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ hashedId: string }>; // params は Promise
};

export default async function MemberLayout({
  children,
  params,
}: MemberLayoutProps) {
  const { hashedId } = await params;

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? session.user.id : null;

  if (!userId) {
    redirect('/auth/login');
  }

  const group = await prisma.groups.findUnique({
    where: { hashedId: hashedId }, // awaitした変数を使用
    select: { id: true },
  });

  if (!group) {
    redirect('/group?error=not_found');
  }

  const membership = await prisma.groups_User.findUnique({
    where: {
      group_id_user_id: {
        group_id: group.id,
        user_id: userId as any,
      },
    },
  });

  if (!membership) {
    redirect('/group?error=not_member');
  }

  return <>{children}</>;
}