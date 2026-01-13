'use server';

import { getAppSession } from "@/lib/auth";
import { logAudit, AuditAction } from "@/lib/audit";
import { headers } from "next/headers";

/**
 * Server Action called by client-side PageViewLogger to record every route change.
 */
import { RateLimiter } from '@/lib/rate-limit';

// Simple in-memory rate limit: 1 log per 500ms per user to prevent abuse
// Using RateLimiter with maxAttempts=1 and short TTL implies if you hit it, you are locked out?
// Actually for simpler throttling "1 req / 500ms", our RateLimiter is a bit heavy (lockout based).
// However, we can use it: maxAttempts=1, baseLockoutMinutes not used? 
// Actually, for high frequency throttling, a simple implementation logic might be different.
// But let's stick to consistency.
// Max=1, TTL=500ms. If you hit it, successful is usually true, but if you hit again?
// Our RateLimiter is "Try -> Fail -> Lockout". 
// Here we want "Try -> Success -> Try -> Fail (Too fast)".
// Let's use it as: check(ip), if success -> increment/set?
// Simpler: 
const pageViewLimiter = new RateLimiter({
    maxAttempts: 1,
    ttl: 1000,
    // If we set lockout to 0, does it work? 
    // We just want to check if "recently used".
    // RateLimiter is designed for "failure locking".
    // Maybe adhering strictly to RateLimiter for "Throttling" is misuse.
    // BUT, we can just use the RateLimiter instance to manage the state manually if needed, 
    // or just assume "Increment" = "Log". 
    // If attempts >= 1, it locks out.
    baseLockoutMinutes: [0.01], // 0.6 sec lockout?
});

/**
 * Server Action called by client-side PageViewLogger to record every route change.
 */
export async function logPageViewAction(path: string) {
    try {
        const session = await getAppSession();
        const userId = session.user?.id;

        // Anonymous users are not logged for page views to save space/spam, 
        // or we can log them with IP-based rate limiting. 
        // For now, only log authenticated users as per original requirement.
        if (!userId) return;

        // Rate Limit Check
        // We use check() - if locked out, return.
        // If not locked, we increment() which triggers lockout for a short duration?
        const check = pageViewLimiter.check(userId);
        if (!check.success) return;

        // "Consume" the token. Since maxAttempts=1, this triggers lockout immediately.
        // Lockout duration is small (0.01 min ~= 600ms).
        pageViewLimiter.increment(userId);

        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || undefined;
        const ipAddress = headersList.get('x-forwarded-for') || 'unknown';

        // We can't easily get method 'GET' from a Server Action call (it's a POST usually),
        // but semantically a Page View is a GET.

        await logAudit(userId, 'PAGE_VIEW' as AuditAction, { message: 'Page View' }, {
            userAgent,
            ipAddress,
            path: path.substring(0, 255), // Truncate path to avoid DB errors
            method: 'GET',
        });
    } catch (error: any) {
        // FK constraint failed means user no longer exists (e.g. DB reset), ignore.
        if (error.code === 'P2003') {
            return;
        }
        // Silently fail to not break the UI
        console.error("PageView Log Error:", error);
    }
}
