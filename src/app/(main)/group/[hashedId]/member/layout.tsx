import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import React from 'react';

// セッションデータの型を定義
interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

// レイアウトコンポーネントは、子要素とURLのパラメータを受け取ります
export default async function MemberLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { hashedId: string }; // URLの [hashedId] 部分
}) {
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

  // グループが存在しない場合は、グループ一覧ページなどにリダイレクト
  if (!group) {
      redirect('/group?error=not_found');
  }

  // --- 3. ログインユーザーがそのグループのメンバーか確認 ---
  // 複合主キーを使って、メンバーシップレコードを直接検索します
  const membership = await prisma.groups_User.findUnique({
    where: {
      group_id_user_id: {
        group_id: group.id,
        user_id: userId,
      },
    },
  });

  // メンバーでなければ、アクセスを拒否してリダイレクト
  if (!membership) {
    redirect('/group?error=not_member');
  }

  // メンバーであれば、子ページ（{children}）をそのまま表示
  return <>{children}</>;
}
