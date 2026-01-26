import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// 型定義を修正: params は Promise です
type Props = {
  params: Promise<{ hashedId: string }>;
};

/**
 * グループ詳細へのリダイレクトページ (Server Component)
 * 
 * URLパラメータのハッシュ化IDに基づき、ユーザーがそのグループの管理者か一般メンバーかを確認し、
 * 適切な役割別ページ (`/admin` または `/member`) へリダイレクトします。
 */
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
      user_id: userId,
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