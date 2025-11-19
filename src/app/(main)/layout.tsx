import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { User, Status_Kohaku } from '@prisma/client';
import { ensureDailyMissionProgress } from '@/lib/actions';
import MainLayout from './MainLayout';

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

import type { UserWithPetStatus } from '@/lib/types';

export default async function MainPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? Number(session.user.id) : null;

  let userWithPet: UserWithPetStatus | null = null;
  if (userId) {
    await ensureDailyMissionProgress(userId);
    userWithPet = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        status_Kohaku: true,
      },
    });
  }

  return (
    <MainLayout userWithPet={userWithPet}>
      {children}
    </MainLayout>
  );
}