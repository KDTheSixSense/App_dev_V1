'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { verifyAdminAccess } from '@/lib/auth-helpers';

import { z } from 'zod';

// Input Validation Schema
const BanUserSchema = z.object({
    targetType: z.enum(['IP', 'COOKIE_ID']),
    value: z.string().min(1).max(255),
    reason: z.string().max(500).optional(),
    targetUserId: z.string().optional(),
});
const KickUserSchema = BanUserSchema.extend({
    duration: z.number().int().positive(), // Duration in seconds
    durationUnit: z.enum(['seconds', 'minutes', 'hours', 'days']),
});

export async function banUser(targetType: 'IP' | 'COOKIE_ID', value: string, reason: string, targetUserId?: string) {
    // Verify admin access first
    const admin = await verifyAdminAccess();

    // Validate Input
    const validationResult = BanUserSchema.safeParse({ targetType, value, reason, targetUserId });
    if (!validationResult.success) {
        return { success: false, error: 'Invalid input: ' + validationResult.error.message };
    }

    try {
        await prisma.bannedUser.upsert({
            where: {
                targetType_value: {
                    targetType,
                    value
                }
            },
            update: {
                reason,
                targetUserId: targetUserId || null,
                createdAt: new Date(), // Update timestamp on re-ban
                createdBy: admin.id,
                expiresAt: null // Permanent ban clears expiry
            },
            create: {
                targetType,
                value,
                reason,
                targetUserId: targetUserId || null,
                createdBy: admin.id
            }
        });

        revalidatePath('/admin-audit');
        return { success: true };
    } catch (error) {
        console.error('Failed to ban user:', error);
        return { success: false, error: 'Database error' };
    }
}

export async function unbanUser(targetType: 'IP' | 'COOKIE_ID', value: string) {
    const admin = await verifyAdminAccess();

    try {
        await prisma.bannedUser.delete({
            where: {
                targetType_value: {
                    targetType,
                    value
                }
            }
        });

        revalidatePath('/admin-audit');
        return { success: true };
    } catch (error) {
        console.error('Failed to unban user:', error);
        // It's possible the user wasn't banned, which is fine
        return { success: false, error: 'Failed to delete ban record (may not exist)' };
    }
}

export async function updateBanReason(targetType: 'IP' | 'COOKIE_ID', value: string, newReason: string) {
    const admin = await verifyAdminAccess();

    // Validate Input
    const validationResult = BanUserSchema.safeParse({ targetType, value, reason: newReason });
    if (!validationResult.success) {
        return { success: false, error: 'Invalid input: ' + validationResult.error.message };
    }

    try {
        await prisma.bannedUser.update({
            where: {
                targetType_value: {
                    targetType,
                    value
                }
            },
            data: {
                reason: newReason
            }
        });

        revalidatePath('/admin-audit');
        return { success: true };
    } catch (error) {
        console.error('Failed to update ban reason:', error);
        return { success: false, error: 'Failed to update reason' };
    }




}

export async function kickUser(targetType: 'IP' | 'COOKIE_ID', value: string, reason: string, duration: number, unit: 'seconds' | 'minutes' | 'hours' | 'days', targetUserId?: string) {
    const admin = await verifyAdminAccess();

    const validationResult = KickUserSchema.safeParse({ targetType, value, reason, duration, durationUnit: unit, targetUserId });
    if (!validationResult.success) {
        return { success: false, error: 'Invalid input: ' + validationResult.error.message };
    }

    const now = new Date();
    let expiresAt = new Date(now.getTime());

    switch (unit) {
        case 'seconds': expiresAt.setSeconds(expiresAt.getSeconds() + duration); break;
        case 'minutes': expiresAt.setMinutes(expiresAt.getMinutes() + duration); break;
        case 'hours': expiresAt.setHours(expiresAt.getHours() + duration); break;
        case 'days': expiresAt.setDate(expiresAt.getDate() + duration); break;
    }

    try {
        await prisma.bannedUser.upsert({
            where: { targetType_value: { targetType, value } },
            update: {
                reason,
                targetUserId: targetUserId || null,
                createdAt: now,
                expiresAt: expiresAt,
                createdBy: admin.id
            },
            create: {
                targetType,
                value,
                reason,
                targetUserId: targetUserId || null,
                createdAt: now,
                expiresAt: expiresAt,
                createdBy: admin.id
            }
        });
        revalidatePath('/admin-audit');
        return { success: true };
    } catch (error) {
        console.error('Failed to kick user:', error);
        return { success: false, error: 'Database error' };
    }
}



export async function getLatestAuditLogs(limit: number) {
    // Verify admin access (although this is a read operation, audit logs are sensitive)
    await verifyAdminAccess();

    const safeLimit = Math.min(Math.max(1, limit), 1000); // Cap at 1000 for auto-refresh to prevent load

    try {
        const logs = await prisma.auditLog.findMany({
            take: safeLimit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { username: true, email: true }
                }
            }
        });
        return { success: true, logs };
    } catch (error) {
        console.error('Failed to fetch latest logs:', error);
        return { success: false, error: 'Failed to fetch logs' };
    }
}
