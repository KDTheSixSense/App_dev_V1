// app/api/daily-missions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { ensureDailyMissionProgress } from '@/lib/actions';
import { getMissionDate } from '@/lib/utils';
import { Mission } from '@/app/(main)/home/daily/missionList';

/**
 * デイリーミッション取得API
 * 
 * ログインユーザーのその日のデイリーミッションとその進捗状況を取得します。
 * ミッションデータが存在しない場合は初期化を行います。
 */
export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const missionDate = getMissionDate();
    await ensureDailyMissionProgress(userId);

    const progressEntries = await prisma.userDailyMissionProgress.findMany({
      where: {
        userId: userId,
        date: missionDate,
      },
      include: {
        mission: true,
      },
      orderBy: {
        missionId: 'asc',
      },
    });

    const missionsForClient: Mission[] = progressEntries.map(entry => ({
      id: entry.missionId,
      title: entry.mission.title,
      description: entry.mission.description,
      progress: entry.progress,
      targetCount: entry.mission.targetCount,
      xpReward: entry.mission.xpReward,
      isCompleted: entry.isCompleted,
    }));

    return NextResponse.json(missionsForClient);

  } catch (error) {
    console.error("API: デイリーミッションの取得中にエラーが発生しました:", error);
    return NextResponse.json({ error: 'ミッションデータの読み込みに失敗しました。' }, { status: 500 });
  }
}
