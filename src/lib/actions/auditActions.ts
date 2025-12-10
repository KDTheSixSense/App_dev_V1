'use server';

import { getAppSession } from "@/lib/auth";
import { logAudit, AuditAction } from "@/lib/audit";
import { headers } from "next/headers";

/**
 * Server Action called by client-side PageViewLogger to record every route change.
 */
import { LRUCache } from 'lru-cache';

// Simple in-memory rate limit: 1 log per 500ms per user to prevent abuse
const rateLimitCache = new LRUCache<string, number>({
    max: 1000,
    ttl: 1000, // 1 second
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

        const now = Date.now();
        const lastLogTime = rateLimitCache.get(userId);

        // Rate Limit Check: Allow max 1 request per 500ms
        if (lastLogTime && now - lastLogTime < 500) {
            return; // Silently ignore spam
        }
        rateLimitCache.set(userId, now);

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
