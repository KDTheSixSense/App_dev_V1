import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

/**
 * Verifies that the current user has admin privileges by checking the database directly.
 * This is more secure than relying on the session cookie, which may be stale.
 * 
 * @returns The user object if verified as admin.
 * @throws Redirects to '/' if not authorized.
 */
/**
 * 管理者権限確認ヘルパー
 * 
 * 現在のユーザーが管理者権限を持っているかをDBに直接問い合わせて確認します。
 * セッション情報だけに依存せず、よりセキュアなチェックを行います。
 */
export async function verifyAdminAccess() {
    const session = await getAppSession();

    if (!session.user?.id) {
        redirect('/auth/login');
    }

    // Always fetch the latest user data from DB to ensure permissions are current
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, id: true, email: true }
    });

    if (!user || !user.isAdmin) {
        redirect('/');
    }

    return user;
}
