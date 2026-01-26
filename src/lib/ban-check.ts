import { prisma } from './prisma';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * BAN状態確認ヘルパー
 * 
 * リクエスト元のIPまたはクッキーIDがBANリストに含まれているか確認します。
 * BANされている場合はブロック画面へリダイレクトします。
 */
export async function checkBanStatus() {
    const headersList = await headers();
    const cookiesList = await cookies();

    // Get IP
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    // Get Device Cookie
    const deviceId = cookiesList.get('d_id')?.value;

    console.log(`[BanCheck] Checking access for IP: ${ip}, Device: ${deviceId}`);

    // Check ban
    const banned = await prisma.bannedUser.findFirst({
        where: {
            OR: [
                { targetType: 'IP', value: ip },
                ...(deviceId ? [{ targetType: 'COOKIE_ID', value: deviceId }] : [])
            ]
        }
    });

    if (banned) {
        // Check for expiration (Kick)
        if (banned.expiresAt && new Date() > new Date(banned.expiresAt)) {
            console.log(`[BanCheck] Ban expired for ${banned.value}. Removing ban.`);
            // Expired: Remove ban and allow access
            await prisma.bannedUser.delete({ where: { id: banned.id } });
            return;
        }

        console.warn(`[BanCheck] Access denied. Reason: ${banned.reason} (Target: ${banned.targetType})`);
        redirect('/banned');
    }
}
