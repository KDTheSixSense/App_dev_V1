import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export enum AuditAction {
    LOGIN = 'LOGIN',
    EXECUTE_CODE = 'EXECUTE_CODE',
    POST_CREATE = 'POST_CREATE',
    REGISTER = 'REGISTER',
    CREATE_GROUP = 'CREATE_GROUP',
    JOIN_GROUP = 'JOIN_GROUP',
    UPDATE_USER = 'UPDATE_USER',
}

export async function logAudit(
    userId: string | null,
    action: AuditAction,
    details?: any,
    // Optional additional fields
    additionalLogs?: {
        ipAddress?: string;
        userAgent?: string;
        path?: string;
        method?: string;
        duration?: number;
    }
) {
    try {
        const headersList = await headers();
        const ipAddress = additionalLogs?.ipAddress || headersList.get('x-forwarded-for') || 'unknown';
        const userAgent = additionalLogs?.userAgent || headersList.get('user-agent');

        await prisma.auditLog.create({
            data: {
                userId: userId as any,
                action,
                details: details && typeof details === 'string' ? details : (details ? JSON.stringify(details) : null),
                ipAddress,
                userAgent,
                path: additionalLogs?.path,
                method: additionalLogs?.method,
                duration: additionalLogs?.duration,
                metadata: details && typeof details === 'object' ? details : undefined,
            },
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Non-blocking
    }
}
