import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { User, Status_Kohaku } from '@prisma/client';
import { ensureDailyMissionProgress } from '@/lib/actions';
import MainLayout from './MainLayout';
import ResponsiveHelpButton from "@/components/responsive-help/ResponsiveHelpButton";

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
  const userId = session.user?.id ? session.user.id : null;

  let userWithPet: UserWithPetStatus | null = null;
  if (userId) {
    await ensureDailyMissionProgress(userId);
    userWithPet = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        level: true,
        xp: true,
        icon: true,
        class: true,
        year: true,
        birth: true,
        lastlogin: true,
        continuouslogin: true,
        status_Kohaku: true,
        // Layoutで必要な他のフィールドがあれば追加
        resetPasswordToken: false, // 明示的に除外 (selectを使うとデフォルトで除外されるが念のため意識)
        hash: false,
        password: false,
      }
    }) as any; // Type mismatch回避のため一時的にanyキャスト (本来は型定義を更新すべき)
  }

  return (
    <MainLayout userWithPet={userWithPet}>
      {children}
      <ResponsiveHelpButton />
    </MainLayout>
  );
}