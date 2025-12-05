import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getAppSession();
    // セッションを破棄してクッキーもクリア
    await session.destroy();
    return NextResponse.json({ message: 'ログアウトしました' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'ログアウトに失敗しました' }, { status: 500 });
  }
}