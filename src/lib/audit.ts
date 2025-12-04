import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export enum AuditAction {
    LOGIN = 'LOGIN',
    EXECUTE_CODE = 'EXECUTE_CODE',
    POST_CREATE = 'POST_CREATE',
    // Add more actions as needed
}

export async function logAudit(
    userId: number | null,
    action: AuditAction,
    details?: any
) {
    try {
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || 'unknown';

        await prisma.auditLog.create({
            data: {
                userId,
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
