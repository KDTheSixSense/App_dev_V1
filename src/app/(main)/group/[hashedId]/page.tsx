// src/app/(main)/group/[hashedId]/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma'; // Prisma Clientのインポートパスを確認
import { getSession } from '@/lib/session'; // iron-sessionのセッション取得関数

// UIは描画せず、サーバーサイドでのリダイレクト処理に特化させます。
async function GroupRedirectPage({ params }: { params: { hashedId: string } }) {
  const session = await getSession();
  const user = session.user;

  // 1. ログインしているか確認 (middlewareと二重のチェックでより安全に)
  if (!user) {
    redirect('/auth/login');
  }

  // ★★★【修正】★★★
  // user.id が文字列として渡されている可能性があるため、parseIntで数値に変換します。
  const userIdAsNumber = parseInt(String(user.id), 10);

  // もし変換に失敗した場合（非数値だった場合）は安全にログインへリダイレクト
  if (isNaN(userIdAsNumber)) {
      console.error("Invalid user ID in session:", user.id);
      redirect('/auth/login');
  }

  // 2. データベースからユーザーの権限情報を取得
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

  // 3. グループに所属していない場合は、グループ一覧ページにリダイレクト
  if (!groupMembership) {
    // エラーメッセージをクエリパラメータで渡すと、リダイレクト先で表示できます
    redirect('/group?error=not_member');
  }

  // 4. admin_flg の値に基づいて、適切なページにリダイレクト
  if (groupMembership.admin_flg) {
    redirect(`/group/${params.hashedId}/admin`);
  } else {
    redirect(`/group/${params.hashedId}/member`);
  }

  // Next.jsのルール上、コンポーネントはnullまたはJSXを返す必要があるため、nullを返します。
  // 実際にはこのコードに到達する前にリダイレクトが実行されます。
  return null;
}

export default GroupRedirectPage;
