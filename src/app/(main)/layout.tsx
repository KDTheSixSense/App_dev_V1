import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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

export type UserWithPetStatus = User & {
  status_Kohaku: Status_Kohaku | null;
};

import { checkBanStatus } from '@/lib/ban-check';

/**
 * メイン画面用レイアウト (Server Component)
 * 
 * ログイン後の主要機能ページ（ホーム、問題一覧など）をラップするレイアウトです。
 * ユーザー認証のチェック、BAN状態の確認、ペット情報の取得、デイリーミッションの進行確認を行います。
 */
export default async function MainPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for ban first
  await checkBanStatus();

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? session.user.id : null;

  if (!userId) {
    redirect('/auth/login');
  }

  let userWithPet: UserWithPetStatus | null = null;
  if (userId) {
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
        isAdmin: true, // Header等でAdmin判定に使う
        // Layoutで必要な他のフィールドがあれば追加
        resetPasswordToken: false, // 明示的に除外 (selectを使うとデフォルトで除外されるが念のため意識)
        hash: false,
        password: false,
      }
    }) as any; // Type mismatch回避のため一時的にanyキャスト (本来は型定義を更新すべき)

    if (userWithPet) {
      await ensureDailyMissionProgress(userWithPet);
    }
  }

  return (
    <MainLayout userWithPet={userWithPet}>
      {children}
      <ResponsiveHelpButton />
    </MainLayout>
  );
}