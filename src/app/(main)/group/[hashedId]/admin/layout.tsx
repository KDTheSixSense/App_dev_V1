import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ReactNode } from 'react';

// このレイアウトがadminディレクトリ配下のすべてのページを保護します。
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { hashedId: string };
}) {
  const session = await getSession();
  const user = session.user;

  // 1. ユーザーがログインしているか確認
  if (!user?.id) {
    redirect('/auth/login');
  }

  const userIdAsNumber = parseInt(String(user.id), 10);
  if (isNaN(userIdAsNumber)) {
    redirect('/auth/login');
  }

  // 2. このグループの管理者(admin_flgがtrue)であるかデータベースで確認
  const groupMembership = await prisma.groups_User.findFirst({
    where: {
      user_id: userIdAsNumber,
      group: {
        hashedId: params.hashedId,
      },
    },
    select: {
      admin_flg: true,
    },
  });

  // 3. 管理者でない場合(レコードがない、またはadmin_flgがfalse)、memberページへリダイレクト
  if (!groupMembership || !groupMembership.admin_flg) {
    // 悪意のあるアクセスを防ぐため、メンバーページへ強制的にリダイレクトします。
    redirect(`/group/${params.hashedId}/member`);
  }

  // 4. 管理者であれば、ページ(children)の表示を許可
  return <>{children}</>;
}