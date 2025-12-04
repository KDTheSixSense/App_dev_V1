import { NextResponse } from 'next/server';
import { updateUserProfileAction } from '@/app/(main)/profile/actions';

export async function GET() {
    // Test Case 1: Username too long
    const longUsername = 'a'.repeat(51);
    const result1 = await updateUserProfileAction({ username: longUsername });

    // Test Case 2: Invalid Title ID (Assuming 999999 is invalid/unowned)
    const result2 = await updateUserProfileAction({ selectedTitleId: 999999 });

    return NextResponse.json({
        testCase1: {
            description: 'Username > 50 chars',
            expected: 'Error',
            result: result1
        },
        testCase2: {
            description: 'Unowned Title ID',
            expected: 'Error',
            result: result2
        }
    });
}
