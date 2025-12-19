
import React from 'react';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { ensureDailyMissionProgress } from '@/lib/actions';
import { getMissionDate } from '@/lib/utils';
// Import from original location
import MissionList, { Mission } from '@/app/(main)/home/daily/missionList';

export default async function DailyMissionSection() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id ? session.user.id : null;

    if (!userId) {
        return null; // Or some fallback UI
    }

    const missionDate = getMissionDate();

    try {
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

        return (
            <div className="bg-[#FFF8E1] rounded-3xl p-6 shadow-sm h-full">
                <h2 className="text-xl font-bold text-slate-700 mb-6">
                    デイリーミッション
                </h2>
                <MissionList missions={missionsForClient} />
            </div>
        );

    } catch (error) {
        console.error("デイリーミッションの取得中にエラーが発生しました:", error);
        return (
            <div className="min-h-screen bg-gray-100 py-10 flex items-center justify-center">
                <p className="text-red-500">ミッションデータの読み込みに失敗しました。</p>
            </div>
        );
    }
}
