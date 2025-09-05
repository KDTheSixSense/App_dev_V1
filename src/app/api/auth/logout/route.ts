import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth'; 

export async function POST() {
  try {
    // 専用関数でセッションを取得
    const session = await getAppSession();

    // セッションを破棄します
    session.destroy();

    return NextResponse.json({ message: 'ログアウトしました' });

  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ error: 'ログアウト処理に失敗しました' }, { status: 500 });
  }
}