   import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import React from 'react';

export const dynamic = 'force-dynamic';

// セッションデータの型を定義
interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

// このレイアウトがadminディレクトリ配下のすべてのページを保護します
interface AdminLayoutProps {
  children: React.ReactNode;
  params: any; // 型を any に変更
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  // --- 1. セッションとユーザーIDを正しく取得 ---
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? Number(session.user.id) : null;

  // ログインしていなければ、ログインページにリダイレクト
  if (!userId) {
    redirect('/auth/login'); // あなたのログインページのパスに合わせてください
  }

  // --- 2. URLのhashedIdから、対象のグループの整数IDを取得 ---
  const group = await prisma.groups.findUnique({
      where: { hashedId: params.hashedId },
      select: { id: true }, // 必要なのは整数のIDだけ
  });

  if (!group) {
      redirect('/group?error=not_found');
  }

  // --- 3. ログインユーザーがそのグループのメンバーであり、かつ管理者か確認 ---
  const membership = await prisma.groups_User.findUnique({
    where: {
      group_id_user_id: {
        group_id: group.id,
        user_id: userId,
      },
    },
    // admin_flgだけを取得すれば十分
    select: {
      admin_flg: true,
    },
  });

  // --- 4. メンバーでない、または管理者でない場合、メンバーページへリダイレクト ---
  // これにより、管理者以外のユーザーが悪意を持ってURLにアクセスするのを防ぎます
  if (!membership?.admin_flg) {
    redirect(`/group/${params.hashedId}/member?error=not_admin`);
  }

  // 5. 管理者であれば、子ページ（{children}）の表示を許可
  return <>{children}</>;
}
