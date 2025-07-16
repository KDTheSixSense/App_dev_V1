import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ReactNode } from 'react';

// このレイアウトがmemberディレクトリ配下のすべてのページを保護します。
export default async function MemberLayout({
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

  // 2. このグループのメンバーであるかデータベースで確認
  const groupMembership = await prisma.groups_User.findFirst({
    where: {
      user_id: userIdAsNumber,
      group: {
        hashedId: params.hashedId,
      },
    },
    select: {
      id: true, // 存在確認のため、何か一つフィールドを選択
    },
  });

  // 3. メンバーでない場合、グループ一覧ページへリダイレクト
  if (!groupMembership) {
    redirect('/group?error=not_member');
  }

  // 4. メンバーであれば、ページの表示を許可
  return <>{children}</>;
}