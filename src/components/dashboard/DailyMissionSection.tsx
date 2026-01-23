// app/(main)/daily/components/DailyMissionSection.tsx
// このファイルは「サーバー側」で実行されます（async functionのコンポーネント）

import React from 'react';
import { prisma } from '@/lib/prisma'; // データベース接続
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { ensureDailyMissionProgress } from '@/lib/actions'; // ミッション作成用のアクション
import { getMissionDate } from '@/lib/utils';
// 表示用のリストコンポーネント（クライアント側で動くことが多い）
import MissionList, { Mission } from '@/app/(main)/home/daily/missionList';

export default async function DailyMissionSection() {
    // 1. ログインユーザーの特定
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id ? session.user.id : null;

    // ログインしていなければ何も表示しない（またはログイン画面への誘導など）
    if (!userId) {
        return null; 
    }

    // 2. 「今日」の日付を取得（日本時間やアプリ内の切り替わり時間を考慮しているはず）
    const missionDate = getMissionDate();

    try {
        // 3. その日のミッションデータが存在することを保証する
        // もしユーザーが今日初めてアクセスした場合、ここでDBにレコードを作成していると思われます
        await ensureDailyMissionProgress(userId);

        // 4. データベースから進捗データを取得
        const progressEntries = await prisma.userDailyMissionProgress.findMany({
            where: {
                userId: userId,
                date: missionDate, // 今日の分だけ取得
            },
            include: {
                mission: true, // 紐付いているミッションの定義（タイトルや目標数など）も一緒に取得
            },
            orderBy: {
                missionId: 'asc',
            },
        });

        // 5. データをクライアント用（MissionList）の型に合わせて整形
        // DBの構造（entry.mission.titleなど）を、UIが使いやすい形（flatなオブジェクト）に変換
        const missionsForClient: Mission[] = progressEntries.map(entry => ({
            id: entry.missionId,
            title: entry.mission.title,
            description: entry.mission.description,
            progress: entry.progress, // 現在の進捗数
            targetCount: entry.mission.targetCount, // 目標数
            xpReward: entry.mission.xpReward,
            isCompleted: entry.isCompleted,
        }));

        // 6. 整形したデータを MissionList コンポーネントに渡して表示
        return (
            <div className="bg-gradient-to-r from-[#e0f4f9] to-cyan-100 rounded-3xl p-6 shadow-sm h-full">
                <h2 className="text-xl font-bold text-slate-700 mb-6">
                    デイリーミッション
                </h2>
                {/* MissionCard が並んで表示されることになります */}
                <MissionList missions={missionsForClient} />
            </div>
        );

    } catch (error) {
        console.error("デイリーミッションの取得中にエラーが発生しました:", error);
        // エラー時の表示
        return (
            <div className="min-h-screen bg-gray-100 py-10 flex items-center justify-center">
                <p className="text-red-500">ミッションデータの読み込みに失敗しました。</p>
            </div>
        );
    }
}