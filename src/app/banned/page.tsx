import { prisma } from '@/lib/prisma';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import BanAppealForm from './components/BanAppealForm';

export const dynamic = 'force-dynamic';

/**
 * BAN/Kick画面コンポーネント
 * 
 * アクセス元のIPアドレスやCookieのデバイスIDに基づいて、
 * ユーザーがBAN（永久停止）またはKick（一時停止）されているかを確認し、
 * 該当する場合に警告画面を表示します。
 */
export default async function BannedPage() {
    // 1. Identify the user (IP/Device)
    const headersList = await headers();
    const cookiesList = await cookies();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    const deviceId = cookiesList.get('d_id')?.value;

    // 2. Find Ban Record
    const banned = await prisma.bannedUser.findFirst({
        where: {
            OR: [
                { targetType: 'IP', value: ip },
                ...(deviceId ? [{ targetType: 'COOKIE_ID', value: deviceId }] : [])
            ]
        },
        include: {
            targetUser: {
                select: { username: true, email: true }
            }
        }
    });

    // 3. User Info
    const session = await getAppSession();
    let currentUser = null;
    if (session?.user?.id) {
        currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { username: true, email: true }
        });
    }

    // If not banned, redirect to home
    if (!banned) {
        redirect('/');
    }

    // @ts-ignore - expiresAt exists in DB but types might be stale
    const isKick = !!banned.expiresAt;

    // Calculate remaining time if Kick
    let remainingTime = '';
    // @ts-ignore
    if (isKick && banned.expiresAt) {
        const now = new Date();
        // @ts-ignore
        const diff = new Date(banned.expiresAt).getTime() - now.getTime();
        if (diff > 0) {
            // Simple logic, client-side countdown is better but SSR text is good baseline
            const minutes = Math.ceil(diff / 60000);
            if (minutes > 60) {
                const hours = Math.ceil(minutes / 60);
                remainingTime = `約 ${hours} 時間`;
            } else {
                remainingTime = `約 ${minutes} 分`;
            }
        } else {
            // Already expired, should be removed by middleware/check but just in case
            redirect('/');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
                {/* Header */}
                <div className={`p-6 text-center ${isKick ? 'bg-blue-500' : 'bg-blue-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-white mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h1 className="text-2xl font-bold text-white">
                        {isKick ? '一時的なアクセス制限' : 'アクセスが拒否されました'}
                    </h1>
                    <p className="text-white/80 mt-2 text-sm">
                        {isKick
                            ? 'あなたのアカウントは一時的にロックされています'
                            : '利用規約違反によりアクセスが永久に停止されました'
                        }
                    </p>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Reason */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">理由 / Reason</h3>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-900 font-medium text-sm">
                            {banned.reason || '詳細は管理者にお問い合わせください'}
                        </div>
                    </div>

                    {/* Expiry / Countdown */}
                    {/* @ts-ignore */}
                    {isKick && banned.expiresAt && (
                        <div className="mb-6 text-center">
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">制限解除まで / Automatic Lift</h3>
                            <div className="text-3xl font-bold text-blue-600 font-mono">
                                {remainingTime}
                            </div>
                            <div className="text-xs text-blue-400 mt-1">
                                {/* @ts-ignore */}
                                {new Date(banned.expiresAt).toLocaleString()} に解除されます
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center">

                        <a href="/" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                            再読み込み / Reload
                        </a>
                        <BanAppealForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
