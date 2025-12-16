import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 内部API呼び出し用のシークレットヘッダーキー
// 本番環境では環境変数で管理すべきですが、今回は簡易的に定義します。
// MiddlewareとこのAPIルート間で共有します。
export const INTERNAL_API_KEY = 'internal-secure-ban-key-v1';

const BanDeviceSchema = z.object({
    deviceId: z.string().min(1),
    reason: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('x-internal-api-key');
    if (authHeader !== INTERNAL_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Input Validation
        const validation = BanDeviceSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid payload: ' + validation.error.message }, { status: 400 });
        }

        const { deviceId, reason } = validation.data;

        console.log(`[Auto-Ban] Banning device ${deviceId} due to: ${reason}`);

        // DBにBANを記録
        await prisma.bannedUser.upsert({
            where: {
                targetType_value: {
                    targetType: 'COOKIE_ID',
                    value: deviceId
                }
            },
            update: {
                reason,
                createdAt: new Date(),
                createdBy: 'SYSTEM_MIDDLEWARE'
            },
            create: {
                targetType: 'COOKIE_ID',
                value: deviceId,
                reason,
                createdBy: 'SYSTEM_MIDDLEWARE'
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Auto-Ban] Failed to ban device:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
