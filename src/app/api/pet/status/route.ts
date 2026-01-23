import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

const MAX_HUNGER = 200; // 最大満腹度（ actions.ts と一致させる）

// 現在のペットステータスを取得する (GET)
/**
 * ペットステータス取得API
 * 
 * ユーザーのペット（コハク）の現在の状態（満腹度など）と
 * ユーザー自身のレベルや経験値などを取得します。
 */
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 2. ユーザー情報と、関連するペット情報を一度に取得
    const userWithPet = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,            // 1. ランク(レベル)
        xp: true,               // 4. 経験値 (NEW)
        continuouslogin: true,  // 2. 連続ログイン日数
        status_Kohaku: {        // 3. ペット情報
          select: {
            hungerlevel: true,
          }
        }
      }
    });

    if (!userWithPet) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 3. 取得したデータを整形して返す
    const responseData = {
      level: userWithPet.level,
      xp: userWithPet.xp ?? 0, // nullの場合は0を返す
      continuouslogin: userWithPet.continuouslogin ?? 0, // nullの場合は0を返す
      hungerlevel: userWithPet.status_Kohaku?.hungerlevel ?? MAX_HUNGER // ペット情報がない場合は最大値を返す
    };

    return NextResponse.json({ data: responseData }, { status: 200 });

  } catch (error) {
    console.error('API /pet/status error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
