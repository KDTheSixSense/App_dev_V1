import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuditLogTable } from './components/AuditLogTable';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await getAppSession();
    if (!session.user) {
        redirect('/auth/login');
    }

    // isAdmin チェック: オペレーターが権限を付与しない限り閲覧不可
    if (!session.user?.isAdmin) {
        redirect('/'); // 権限がない場合はホームへリダイレクト
    }

    const searchParams = await props.searchParams;
    const limitParam = searchParams.limit;
    const limit = typeof limitParam === 'string' ? parseInt(limitParam, 10) : 100;
    const safeLimit = isNaN(limit) || limit <= 0 ? 100 : limit;

    // 指定件数を取得
    const logs = await prisma.auditLog.findMany({
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { username: true, email: true }
            }
        }
    });

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Security Audit Log</h1>
            <p className="mb-4 text-gray-600">
                最新のユーザーアクティビティログ (直近 {safeLimit} 件) を表示しています。
                全てのページビュー、ログイン試行、重要なアクションが記録されています。
            </p>

            <AuditLogTable initialLogs={logs} currentLimit={safeLimit} />
        </div>
    );
}
