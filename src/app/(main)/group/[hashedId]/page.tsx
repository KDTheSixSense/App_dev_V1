import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// 型定義を修正: params は Promise です
type Props = {
  params: Promise<{ hashedId: string }>;
};

export default async function GroupRedirectPage({ params }: Props) {
  const { hashedId } = await params;

  const session = await getSession();
  const user = session.user;

  if (!user) {
    redirect('/auth/login');
  }

  const userId = user.id;

  const groupMembership = await prisma.groups_User.findFirst({
    where: {
      user_id: userId as any,
      group: {
        hashedId: hashedId, // awaitした変数を使用
      },
    },
    select: {
      admin_flg: true,
    },
  });

  if (!groupMembership) {
    redirect('/group?error=not_member');
  }

  if (groupMembership.admin_flg) {
    redirect(`/group/${hashedId}/admin`); // awaitした変数を使用
  } else {
    redirect(`/group/${hashedId}/member`); // awaitした変数を使用
  }

  return null;
}