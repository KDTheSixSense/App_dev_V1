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
    details?: any
) {
    try {
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || 'unknown';

        await prisma.auditLog.create({
            data: {
                userId: userId as any,
                action,
                details: details ? JSON.stringify(details) : null,
                ipAddress,
            },
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Non-blocking: don't throw error to avoid disrupting the main flow
    }
}
