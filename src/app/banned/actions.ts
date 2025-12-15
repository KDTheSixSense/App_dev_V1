'use server';

import nodemailer from 'nodemailer';
import { z } from 'zod';
import { headers, cookies } from 'next/headers';

// Rate Limiting Map (In-Memory)
// Key: IP address, Value: { count: number, lastTime: number }
const MAX_REQUESTS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const rateLimitMap = new Map<string, { count: number, lastTime: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, lastTime: now });
        return true;
    }

    if (now - record.lastTime > RATE_LIMIT_WINDOW) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, lastTime: now });
        return true;
    }

    if (record.count >= MAX_REQUESTS_PER_HOUR) {
        return false;
    }

    record.count++;
    return true;
}

const formSchema = z.object({
    email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
    reason: z.string().min(10, { message: '理由は10文字以上で入力してください' }).max(1000, { message: '理由は1000文字以内で入力してください' }),
});

export type AppealState = {
    success: boolean;
    message: string;
    errors?: {
        email?: string[];
        reason?: string[];
    };
};

export async function sendAppealEmail(prevState: AppealState, formData: FormData): Promise<AppealState> {
    const validatedFields = formSchema.safeParse({
        email: formData.get('email'),
        reason: formData.get('reason'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: '入力内容に誤りがあります',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { email, reason } = validatedFields.data;

    // Gather context
    const headersList = await headers();
    const cookiesList = await cookies();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const deviceId = cookiesList.get('d_id')?.value || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Check Rate Limit
    if (!checkRateLimit(ip)) {
        console.warn(`[BanAppeal] Rate limit exceeded for IP: ${ip}`);
        return { success: false, message: '送信回数制限を超えました。しばらく待ってから再送信してください。' };
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_SERVER_USER, // Ensure these are set in .env
            pass: process.env.EMAIL_SERVER_PASSWORD,
        },
    });

    // If env vars are missing, log and fail gracefully (or mock for dev if needed)
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
        console.error('Email configuration missing');
        return { success: false, message: 'システムエラー: メール設定が不足しています。管理者に連絡してください。' };
    }

    const mailOptions = {
        from: process.env.EMAIL_SERVER_USER,
        to: 'ainfopiaf6@gmail.com',
        subject: `[Ban Appeal] Appeal from ${email}`,
        text: `
Ban Appeal Request:

User Email: ${email}
Reason:
${reason}

---
Context Info:
IP Address: ${ip}
Device ID: ${deviceId}
User Agent: ${userAgent}
Time: ${new Date().toISOString()}
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'お問い合わせを送信しました。管理者が確認次第ご連絡いたします。' };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, message: 'メール送信に失敗しました。後ほど再度お試しください。' };
    }
}
