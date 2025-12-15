import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INTERNAL_API_KEY } from '../ban-device/route'; // Key sharing
import { z } from 'zod';

const AuditLogSchema = z.object({
    action: z.string().min(1),
    ipAddress: z.string().optional().nullable(),
    deviceId: z.string().optional().nullable(),
    userAgent: z.string().optional().nullable(),
    details: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('x-internal-api-key');
    if (authHeader !== INTERNAL_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Input Validation
        const validation = AuditLogSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid payload: ' + validation.error.message }, { status: 400 });
        }

        const { action, ipAddress, deviceId, userAgent, details } = validation.data;

        await prisma.auditLog.create({
            data: {
                action,
                ipAddress,
                deviceId,
                userAgent,
                details: details || null,
                createdAt: new Date(),
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[System Audit] Failed to create log:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
