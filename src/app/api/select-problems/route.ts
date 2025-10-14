import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

// Redirect to the correct API endpoint
export async function POST(request: Request) {
    console.warn('DEPRECATED: /api/select-problems is deprecated. Use /api/selects_problems instead.');
    
    // Redirect to the correct endpoint
    const body = await request.text();
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/selects_problems`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Forward any authentication headers
            ...Object.fromEntries(
                Array.from(request.headers.entries()).filter(([key]) => 
                    key.toLowerCase().includes('auth') || key.toLowerCase().includes('cookie')
                )
            )
        },
        body: body
    });
    
    return response;
}

// (The unreachable/duplicate code block below has been removed to fix the error)

// 選択問題の一覧を取得するGETハンドラ (こちらも念のため記載)
export async function GET(request: Request) {
    console.warn('DEPRECATED: /api/select-problems is deprecated. Use /api/selects_problems instead.');
    
    // Redirect to the correct endpoint
    const url = new URL(request.url);
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/selects_problems${url.search}`, {
        method: 'GET',
        headers: {
            // Forward any authentication headers
            ...Object.fromEntries(
                Array.from(request.headers.entries()).filter(([key]) => 
                    key.toLowerCase().includes('auth') || key.toLowerCase().includes('cookie')
                )
            )
        }
    });
    
    return response;
}
